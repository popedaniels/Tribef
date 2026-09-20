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
            amount: Math.round(bt.amount) / 100,
            currency: bt.currency,
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
        amount: Number(tx.amount),
        currency: tx.currency,
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
        currency: tx.currency,
      })
    );
    if (page >= (resp.data.meta && resp.data.meta.pageCount) || !(resp.data.data || []).length) break;
    page += 1;
  }
  return txs;
}

// ── Orchestrator ───────────────────────────────────────────────────────────
async function runReconciliation({ days = 1 } = {}) {
  const { Donations } = require("../models/donationsModel");
  const gotLock = await acquireLock();
  if (!gotLock) {
    logger.info("Reconciliation skipped: another instance holds the lock");
    return { skipped: true };
  }

  try {
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const sinceTs = Math.floor(sinceDate.getTime() / 1000);
    const fromISO = sinceDate.toISOString().split(".")[0];

    const [stripeTxs, flwTxs, psTxs] = [
      await fetchStripe(sinceTs).catch((e) => {
        logger.warn({ err: e }, "Stripe reconciliation fetch failed");
        return null;
      }),
      await fetchFlutterwave(fromISO).catch((e) => {
        logger.warn({ err: e }, "Flutterwave reconciliation fetch failed");
        return null;
      }),
      await fetchPaystack(fromISO).catch((e) => {
        logger.warn({ err: e }, "Paystack reconciliation fetch failed");
        return null;
      }),
    ];

    const report = { ranAt: new Date().toISOString(), windowDays: days, gateways: {} };

    const configs = [
      {
        name: "stripe",
        txs: stripeTxs,
        query: { paymentMethod: /^Stripe/i, createdAt: { $gte: sinceDate } },
        idKey: "paymentId",
        refKey: "transactionRef",
      },
      { name: "flutterwave", txs: flwTxs, query: { paymentMethod: "flutterwave", createdAt: { $gte: sinceDate } }, idKey: "transactionId" },
      { name: "paystack", txs: psTxs, query: { paymentMethod: "paystack", createdAt: { $gte: sinceDate } }, idKey: "transactionId" },
    ];

    for (const cfg of configs) {
      if (!cfg.txs) continue; // gateway unconfigured — skip silently
      const dbDonations = await Donations.find(cfg.query)
        .select("_id amount transactionId transactionRef paymentId")
        .maxTimeMS(5000);
      const diff = diffTransactions(cfg.txs, dbDonations.map((d) => d.toObject()), cfg);
      report.gateways[cfg.name] = {
        gatewayCount: cfg.txs.length,
        dbCount: dbDonations.length,
        ...diff,
      };

      if (diff.missingInDb.length > 0 || diff.amountMismatches.length > 0) {
        logger.error(
          { gateway: cfg.name, missingInDb: diff.missingInDb, amountMismatches: diff.amountMismatches },
          "RECONCILIATION DISCREPANCY — investigate immediately"
        );
      }
    }

    logger.info(report, "Reconciliation complete");
    return report;
  } finally {
    await releaseLock();
  }
}

module.exports = {
  diffTransactions,
  runReconciliation,
  fetchStripe,
  fetchFlutterwave,
  fetchPaystack,
};
