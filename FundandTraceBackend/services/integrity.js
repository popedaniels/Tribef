// Nightly integrity check for the money system. Answers, every day:
//   - Is every ledger chain intact?
//   - Does each campaign's escrow balance equal the sum of its ledger?
//   - Is any balance negative?
//   - Are payouts, bank transfers or refunds stuck mid-flight?
//   - Which payouts are missing their receipt past the deadline?
//
// Findings have a severity: "critical" (money or ledger is wrong — page
// someone), "warning" (stuck work — look today) or "info" (follow-up).
// Gateway-side checks (lost webhooks, phantom credits) live in
// services/reconciliation.js; this module checks our own books.
const axios = require("axios");
const { Campaign } = require("../models/campaignModel");
const { FundingRequests } = require("../models/fundingRequestModel");
const { Donations } = require("../models/donationsModel");
const { LedgerEntry } = require("../models/ledgerEntryModel");
const { verifyCampaign } = require("./ledger");
const { proofDueDays } = require("./transparency");
const logger = require("../utility/logger");

const HOUR = 3600e3;
const DAY = 24 * HOUR;
const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

/**
 * Pure: compare balances with ledger sums.
 * @param campaigns [{_id, createdAt, funding:{availableBalance,currency}}]
 * @param sums Map campaignId → ledger sum
 * @param inFlight Set of campaignIds with a payout/refund in progress
 * @param since only campaigns created on/after this date are compared
 */
function balanceFindings(campaigns, sums, inFlight, since) {
  const out = [];
  for (const c of campaigns) {
    const id = String(c._id);
    const balance = round2(c.funding?.availableBalance);
    if (balance < 0) {
      out.push({ severity: "critical", code: "negative_balance", campaignId: id, balance, currency: c.funding?.currency });
    }
    if (since && new Date(c.createdAt) < since) continue; // pre-ledger campaign
    const ledger = round2(sums.get(id) || 0);
    const diff = round2(balance - ledger);
    if (Math.abs(diff) > 0.01) {
      out.push({
        severity: inFlight.has(id) ? "warning" : "critical",
        code: inFlight.has(id) ? "balance_mismatch_in_flight" : "balance_mismatch",
        campaignId: id,
        balance,
        ledger,
        diff,
        currency: c.funding?.currency,
      });
    }
  }
  return out;
}

async function postAlert(report) {
  const url = process.env.ALERT_WEBHOOK_URL; // Slack/Teams/Discord-compatible
  if (!url) return false;
  const lines = report.findings
    .filter((f) => f.severity !== "info")
    .slice(0, 15)
    .map((f) => `• [${f.severity}] ${f.code}${f.campaignId ? ` campaign ${f.campaignId}` : ""}${f.diff !== undefined ? ` diff ${f.diff}` : ""}`);
  const text = `Fund&Trace integrity check: ${report.summary.critical} critical, ${report.summary.warning} warning\n${lines.join("\n")}`;
  await axios.post(url, { text, content: text }, { timeout: 10000 });
  return true;
}

async function runIntegrityCheck({ now = new Date(), alert = true } = {}) {
  const findings = [];

  // 1. Ledger chains.
  const campaignIds = (await LedgerEntry.distinct("campaignId")).map(String);
  for (const id of campaignIds) {
    const v = await verifyCampaign(id);
    if (!v.valid) findings.push({ severity: "critical", code: "ledger_broken", campaignId: id, brokenAt: v.brokenAt, reason: v.reason });
  }

  // 2. Work in flight (explains temporary balance differences).
  // NB: the payout date lives at disbursement.dateDisbursed (there is no top-level field).
  const stalePayoutLock = await FundingRequests.find({ payoutLockedAt: { $lt: new Date(now - HOUR) }, "disbursement.dateDisbursed": null })
    .select("_id campaignId payoutLockedAt")
    .lean();
  const pendingTransfers = await FundingRequests.find({ "disbursement.providerStatus": "pending" })
    .select("_id campaignId disbursement.dateDisbursed disbursement.provider disbursement.providerReference")
    .lean();
  const processingRefunds = await Donations.find({ "refund.status": "processing" })
    .select("_id campaignId refund.createdAt")
    .lean();

  const inFlight = new Set([
    ...stalePayoutLock.map((f) => String(f.campaignId)),
    ...pendingTransfers.map((f) => String(f.campaignId)),
    ...processingRefunds.map((d) => String(d.campaignId)),
  ]);

  stalePayoutLock.forEach((f) =>
    findings.push({ severity: "warning", code: "payout_stuck", fundingRequestId: String(f._id), campaignId: String(f.campaignId), since: f.payoutLockedAt })
  );
  pendingTransfers
    .filter((f) => now - new Date(f.disbursement?.dateDisbursed || now) > 2 * DAY)
    .forEach((f) =>
      findings.push({
        severity: "warning",
        code: "bank_transfer_unconfirmed",
        fundingRequestId: String(f._id),
        campaignId: String(f.campaignId),
        provider: f.disbursement?.provider,
        reference: f.disbursement?.providerReference,
      })
    );
  processingRefunds
    .filter((d) => now - new Date(d.refund?.createdAt || now) > HOUR)
    .forEach((d) => findings.push({ severity: "warning", code: "refund_stuck", donationId: String(d._id), campaignId: String(d.campaignId) }));

  // 3. Balances vs ledger. Campaigns that predate the ledger can't be compared.
  const firstEntry = await LedgerEntry.findOne().sort({ at: 1 }).select("at").lean();
  const since = process.env.LEDGER_START_DATE ? new Date(process.env.LEDGER_START_DATE) : firstEntry ? new Date(firstEntry.at) : null;
  const sums = new Map(
    (await LedgerEntry.aggregate([{ $group: { _id: "$campaignId", sum: { $sum: "$amount" } } }])).map((r) => [String(r._id), r.sum])
  );
  const campaigns = await Campaign.find({}).select("_id createdAt funding.availableBalance funding.currency").lean();
  findings.push(...balanceFindings(campaigns, sums, inFlight, since));

  // 4. Receipts past their deadline.
  const due = new Date(now - proofDueDays() * DAY);
  const overdue = await FundingRequests.find({
    status: "Approved",
    "disbursement.dateDisbursed": { $ne: null, $lt: due },
    $or: [{ "disbursement.receipt": { $exists: false } }, { "disbursement.receipt": "" }, { "disbursement.receipt": null }],
  })
    .select("_id campaignId disbursement.dateDisbursed")
    .lean();
  overdue.forEach((f) =>
    findings.push({ severity: "info", code: "receipt_overdue", fundingRequestId: String(f._id), campaignId: String(f.campaignId), paidAt: f.disbursement?.dateDisbursed })
  );

  const summary = {
    checkedAt: now.toISOString(),
    ledgersChecked: campaignIds.length,
    campaignsChecked: campaigns.length,
    critical: findings.filter((f) => f.severity === "critical").length,
    warning: findings.filter((f) => f.severity === "warning").length,
    info: findings.filter((f) => f.severity === "info").length,
  };
  const report = { summary, findings: findings.slice(0, 500) };

  if (summary.critical || summary.warning) {
    logger.error({ summary, findings: findings.slice(0, 20) }, "INTEGRITY_ALERT");
    try {
      require("../utility/sentry").captureException(new Error(`Integrity check: ${summary.critical} critical, ${summary.warning} warning`), {
        extra: summary,
      });
    } catch {
      /* sentry optional */
    }
    if (alert) await postAlert(report).catch((err) => logger.error({ err }, "Alert webhook failed"));
  } else {
    logger.info({ summary }, "Integrity check passed");
  }
  return report;
}

module.exports = { runIntegrityCheck, balanceFindings, postAlert };
