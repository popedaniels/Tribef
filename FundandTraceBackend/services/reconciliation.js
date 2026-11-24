// Payment reconciliation — compares gateway settlement records against the
// local Donations ledger so a lost webhook or a phantom credit is caught
// within a day instead of never.
//
// Run modes:
//   - scripts/reconcile.js (CLI)
//   - daily timer inside server.js when RECONCILE_DAILY=true
//
// A shared Redis lock prevents overlapping runs across PM2 cluster instances.
const axios = require("axios");
const { getRedis } = require("../utility/redis");
const logger = require("../utility/logger");

const RECONCILE_LOCK_KEY = "lock:reconciliation";
const LOCK_TTL_SECONDS = 15 * 60;

// ── Pure diff core (unit-testable without network) ────────────────────────
// Normalized shape: { id, ref, amount } — amounts in major units.
function diffTransactions(gatewayTxs, dbDonations, { idKey, refKey } = {}) {
  const dbById = new Map();
  const dbByRef = new Map();
  dbDonations.forEach((d) => {
    if (idKey && d[idKey]) dbById.set(String(d[idKey]), d);
    if (refKey && d[refKey]) dbByRef.set(String(d[refKey]), d);
  });

  const missingInDb = [];
  const amountMismatches = [];

  gatewayTxs.forEach((tx) => {
    const local =
      dbById.get(String(tx.id)) ||
      dbByRef.get(String(tx.id)) ||
      dbByRef.get(String(tx.ref));
    if (!local) {
      missingInDb.push(tx);
    } else if (
      Number.isFinite(tx.amount) &&
      Number.isFinite(local.amount) &&
      Math.abs(tx.amount - local.amount) > 0.01
    ) {
      amountMismatches.push({ gateway: tx, dbAmount: local.amount });
    }
  });

  return { missingInDb, amountMismatches };
}

async function acquireLock() {
  const redis = getRedis();
  if (!redis) {
    // Single-instance fallback: process-local lock via a module flag.
    global.__reconcileRunning = Boolean(global.__reconcileRunning);
    if (global.__reconcileRunning) return false;
    global.__reconcileRunning = true;
    return true;
  }
  const result = await redis.set(RECONCILE_LOCK_KEY, String(process.pid), "EX", LOCK_TTL_SECONDS, "NX");
  return result === "OK";
}

async function releaseLock() {
  const redis = getRedis();
  if (!redis) {
    global.__reconcileRunning = false;
    return;
  }
  await redis.del(RECONCILE_LOCK_KEY).catch(() => {});
}

// ── Gateway fetchers (each no-ops when unconfigured) ──────────────────────
// Each accepts an optional client override for unit testing.
async function fetchStripe(sinceTs, stripeClient) {
  if (!stripeClient && !process.env.STRIPESECRET) return null;
  const client = stripeClient || require("stripe")(process.env.STRIPESECRET);
  const txs = [];
  let startingAfter;
  do {
    const page = await client.balanceTransactions.list({
      created: { gte: sinceTs },
      limit: 100,
      expand: ["data.source"],
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    page.data.forEach((bt) => {
      if (bt.type === "charge" && bt.status === "succeeded") {
        // The DB stores the PaymentIntent (donations.paymentId); the balance
        // transaction source must be expanded to reach it. Without expansion
        // source is a charge ID and nothing would ever match.
        const charge = bt.source && bt.source.object === "charge" ? bt.source : null;
        const paymentIntent = charge ? charge.payment_intent : null;
        if (paymentIntent) {
          txs.push({
            id: paymentIntent,
            // Checkout sessions carry our tx_ref as client_reference_id, so
            // legacy donations recorded without paymentId can still be
            // matched via transactionRef instead of producing false alarms.
            ref: charge.client_reference_id || "",
            // The charge's own amount and currency: bt.amount is in the
            // settlement currency (e.g. GBP for an NGN charge) and would
            // never match the donation.
            amount: Math.round(Number(charge.amount ?? bt.amount)) / 100,
            currency: String(charge.currency || bt.currency || "").toUpperCase(),
            at: new Date((charge.created || bt.created || 0) * 1000),
          });
        }
      }
    });
    startingAfter = page.has_more ? page.data[page.data.length - 1].id : undefined;
  } while (startingAfter);
  return txs;
}

async function fetchFlutterwave(fromISO, axiosImpl) {
  if (!process.env.FLUTTERWAVE && !axiosImpl) return null;
  const http = axiosImpl || axios;
  const headers = { Authorization: "Bearer " + (process.env.FLUTTERWAVE || "test") };
  const txs = [];
  let page = 1;
  for (;;) {
    const resp = await http.get("https://api.flutterwave.com/v3/transactions", {
      headers,
      params: { from: fromISO, status: "successful", page },
    });
    (resp.data.data || []).forEach((tx) =>
      txs.push({
        id: String(tx.id),
        ref: tx.tx_ref,
        amount: Number(tx.charged_amount ?? tx.amount),
        currency: String(tx.currency || "").toUpperCase(),
        at: new Date(tx.created_at),
      })
    );
    const pageCount = (resp.data.meta && resp.data.meta.pageCount) || 1;
    if (page >= pageCount || !(resp.data.data || []).length) break;
    page += 1;
  }
  return txs;
}

async function fetchPaystack(fromISO, axiosImpl) {
  if (!process.env.PAYSTACK_SECRET && !axiosImpl) return null;
  const http = axiosImpl || axios;
  const headers = { Authorization: "Bearer " + (process.env.PAYSTACK_SECRET || "test") };
  const txs = [];
  let page = 1;
  for (;;) {
    const resp = await http.get("https://api.paystack.co/transaction", {
      headers: { Authorization: "Bearer " + process.env.PAYSTACK_SECRET },
      params: { from: fromISO, status: "success", perPage: 100, page },
    });
    (resp.data.data || []).forEach((tx) =>
      txs.push({
        id: String(tx.id),
        ref: tx.reference,
        amount: tx.amount / 100,
        currency: String(tx.currency || "").toUpperCase(),
        at: new Date(tx.paid_at || tx.created_at),
      })
    );
    if (page >= (resp.data.meta && resp.data.meta.pageCount) || !(resp.data.data || []).length) break;
    page += 1;
  }
  return txs;
}

// ── Two-way reconciliation (pure) ─────────────────────────────────────────
// Matches each gateway charge to a donation by any reference we store
// (transactionId, transactionRef, paymentId) and checks:
//   missingInDb        charged at the gateway, never recorded/credited (lost webhook)
//   creditedWithoutPay recorded/credited, but the gateway has no successful charge (phantom)
//   amountMismatches   charged total ≠ donation + tip + card fee
//   currencyMismatches charged in a different currency from the campaign
// Records within `graceMs` of either window edge are ignored (webhook lag,
// boundary effects) so a busy minute doesn't page anyone.
const round2 = (n) => Math.round(Number(n) * 100) / 100;

function reconcileGateway(gatewayTxs, donations, { from, to, graceMs = 30 * 60 * 1000, currencyOf = () => "" } = {}) {
  const index = new Map();
  for (const d of donations) for (const k of [d.transactionId, d.transactionRef, d.paymentId]) if (k) index.set(String(k), d);
  const inWindow = (at) => {
    const t = new Date(at).getTime();
    return !Number.isFinite(t) || (t >= from.getTime() + graceMs && t <= to.getTime() - graceMs);
  };
  const matched = new Set();
  const out = { missingInDb: [], creditedWithoutPayment: [], amountMismatches: [], currencyMismatches: [], totals: {} };

  for (const tx of gatewayTxs) {
    const d = index.get(String(tx.id)) || index.get(String(tx.ref));
    const cur = String(tx.currency || "").toUpperCase();
    const t = (out.totals[cur] ||= { gatewayCharged: 0, recordedCharged: 0, donated: 0, tips: 0, fees: 0, count: 0 });
    t.gatewayCharged = round2(t.gatewayCharged + Number(tx.amount || 0));
    t.count += 1;
    if (!d) {
      if (inWindow(tx.at)) out.missingInDb.push({ id: tx.id, ref: tx.ref, amount: tx.amount, currency: cur, at: tx.at });
      continue;
    }
    matched.add(String(d._id));
    const charged = round2(Number(d.amount || 0) + Number(d.tip || 0) + Number(d.processingFee || 0));
    t.recordedCharged = round2(t.recordedCharged + charged);
    t.donated = round2(t.donated + Number(d.amount || 0));
    t.tips = round2(t.tips + Number(d.tip || 0));
    t.fees = round2(t.fees + Number(d.processingFee || 0));
    if (Number.isFinite(tx.amount) && Math.abs(Number(tx.amount) - charged) > 0.01) {
      out.amountMismatches.push({ id: tx.id, ref: tx.ref, gatewayAmount: tx.amount, recordedCharged: charged, donationId: String(d._id) });
    }
    const campaignCur = String(currencyOf(d) || "").toUpperCase();
    if (cur && campaignCur && cur !== campaignCur) out.currencyMismatches.push({ id: tx.id, gatewayCurrency: cur, campaignCurrency: campaignCur, donationId: String(d._id) });
  }
  for (const d of donations) {
    if (matched.has(String(d._id)) || !inWindow(d.createdAt)) continue;
    out.creditedWithoutPayment.push({ donationId: String(d._id), campaignId: String(d.campaignId || ""), amount: d.amount, ref: d.transactionRef || d.transactionId, at: d.createdAt });
  }
  out.discrepancies = out.missingInDb.length + out.creditedWithoutPayment.length + out.amountMismatches.length + out.currencyMismatches.length;
  return out;
}

async function alert(report) {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return;
  const lines = Object.entries(report.gateways)
    .filter(([, g]) => g.discrepancies)
    .map(([name, g]) => `• ${name}: ${g.missingInDb.length} charged but not recorded, ${g.creditedWithoutPayment.length} credited without a payment, ${g.amountMismatches.length} amount and ${g.currencyMismatches.length} currency mismatches`);
  for (const e of report.errors || []) lines.push(`• ${e.gateway}: couldn't fetch transactions (${e.error})`);
  const text = `:rotating_light: Fund&Trace reconciliation (last ${report.windowDays} day${report.windowDays === 1 ? "" : "s"}): ${report.discrepancies} discrepanc${report.discrepancies === 1 ? "y" : "ies"}${report.errors?.length ? `, ${report.errors.length} gateway error(s)` : ""}\n${lines.join("\n")}\nSee /admin/reconciliation.`;
  await axios.post(url, { text, content: text }, { timeout: 10000 }).catch((err) => logger.warn({ err: err.message }, "Reconciliation alert failed"));
}

// ── Orchestrator ───────────────────────────────────────────────────────────
async function runReconciliation({ days = 1, fetchers = {}, notify = true } = {}) {
  const { Donations } = require("../models/donationsModel");
  const { Campaign } = require("../models/campaignModel");
  const gotLock = await acquireLock();
  if (!gotLock) {
    logger.info("Reconciliation skipped: another instance holds the lock");
    return { skipped: true };
  }

  try {
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    // Ask the gateways for an extra hour either side so a charge near the edge
    // still finds its donation (and vice versa).
    const fetchFrom = new Date(from.getTime() - 60 * 60 * 1000);
    const sinceTs = Math.floor(fetchFrom.getTime() / 1000);
    const fromISO = fetchFrom.toISOString().split(".")[0];
    const get = async (name, fn) => {
      try {
        return await fn();
      } catch (e) {
        logger.warn({ err: e?.message }, `${name} reconciliation fetch failed`);
        return { error: e?.message || "fetch failed" };
      }
    };
    const sources = {
      stripe: await get("Stripe", () => (fetchers.stripe || fetchStripe)(sinceTs)),
      flutterwave: await get("Flutterwave", () => (fetchers.flutterwave || fetchFlutterwave)(fromISO)),
      paystack: await get("Paystack", () => (fetchers.paystack || fetchPaystack)(fromISO)),
    };
    const methods = { stripe: /^stripe/i, flutterwave: /^flutterwave$/i, paystack: /^paystack$/i };

    const report = { ranAt: to.toISOString(), windowDays: days, gateways: {}, discrepancies: 0, errors: [] };
    for (const [name, txs] of Object.entries(sources)) {
      if (txs === null) continue; // gateway not configured
      if (txs?.error) {
        report.errors.push({ gateway: name, error: txs.error });
        continue;
      }
      const donations = await Donations.find({ paymentMethod: methods[name], createdAt: { $gte: fetchFrom } })
        .select("_id campaignId amount tip processingFee transactionId transactionRef paymentId createdAt refund.status")
        .lean()
        .maxTimeMS(15000);
      const camps = await Campaign.find({ _id: { $in: [...new Set(donations.map((d) => String(d.campaignId)))] } })
        .select("funding.currency")
        .lean();
      const curById = Object.fromEntries(camps.map((c) => [String(c._id), c.funding?.currency]));
      const r = reconcileGateway(txs, donations, { from, to, currencyOf: (d) => curById[String(d.campaignId)] });
      report.gateways[name] = { gatewayCount: txs.length, dbCount: donations.length, ...r };
      report.discrepancies += r.discrepancies;
    }

    try {
      const { ReconciliationReport } = require("../models/reconciliationReportModel");
      await ReconciliationReport.create(report);
    } catch (err) {
      logger.warn({ err: err?.message }, "Saving reconciliation report failed");
    }
    if (report.discrepancies) logger.error({ discrepancies: report.discrepancies, gateways: Object.keys(report.gateways) }, "RECONCILIATION DISCREPANCY: investigate");
    else logger.info({ gateways: Object.keys(report.gateways), errors: report.errors.length }, "Reconciliation finished");
    if ((report.discrepancies || report.errors.length) && notify) await alert(report);
    return report;
  } finally {
    await releaseLock();
  }
}

module.exports = {
  diffTransactions,
  reconcileGateway,
  runReconciliation,
  fetchStripe,
  fetchFlutterwave,
  fetchPaystack,
};
