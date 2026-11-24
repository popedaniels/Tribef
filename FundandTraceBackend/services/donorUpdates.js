// Donor updates: "your money was paid out" and "proof of spending was added".
//
// This closes the trust loop. A donor gives once and hears nothing until
// they're told where the money went and can see the receipt.
//
// - enqueue() is called from the payout and receipt paths. It only writes one
//   outbox document, keyed "<type>:<fundingRequestId>", so each event is
//   queued at most once however many times the code path runs.
// - drain() runs on every scheduler tick. It claims one event with a lease and
//   emails up to `batch` donors in sorted order, recording a cursor so a crash
//   or restart resumes where it stopped and no donor gets the same email twice.
// - Every email carries a signed one-click unsubscribe link (this campaign or
//   all campaigns) and List-Unsubscribe headers.
const crypto = require("crypto");
const mongoose = require("mongoose");
const { DonorUpdate, EmailOptOut } = require("../models/donorUpdateModel");
const logger = require("../utility/logger");

const LEASE_MS = 10 * 60 * 1000;
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function money(amount, currency) {
  const cur = String(currency || "GBP").toUpperCase();
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: cur }).format(Number(amount) || 0);
  } catch {
    return `${cur} ${(Number(amount) || 0).toFixed(2)}`;
  }
}

// ── Unsubscribe tokens ─────────────────────────────────────────────────────
// scope is a campaign id or "all". The token is an HMAC, so it can't be
// forged for someone else's address and needs no database lookup.
function secret() {
  const s = process.env.UNSUBSCRIBE_SECRET || process.env.TOKEN_SECRET;
  if (!s) throw new Error("UNSUBSCRIBE_SECRET or TOKEN_SECRET must be set");
  return s;
}
function unsubscribeToken(email, scope) {
  return crypto.createHmac("sha256", secret()).update(`unsub|${String(email).toLowerCase()}|${scope}`).digest("base64url");
}
function verifyUnsubscribe(email, scope, token) {
  if (!email || !scope || !token) return false;
  const want = Buffer.from(unsubscribeToken(email, scope));
  const got = Buffer.from(String(token));
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}
// kind "page": the website's confirmation page (link in the email body).
// kind "oneclick": the API endpoint (List-Unsubscribe header, RFC 8058).
function unsubscribeUrl(email, scope, kind = "page") {
  const q = new URLSearchParams({ e: String(email).toLowerCase(), s: String(scope), t: unsubscribeToken(email, scope) });
  if (kind === "oneclick") return `${(process.env.BACKENDURL || "").replace(/\/$/, "")}/api/email/unsubscribe?${q}`;
  return `${(process.env.MAINURL || "").replace(/\/$/, "")}/unsubscribe?${q}`;
}

async function optOut(email, scope) {
  const campaignId = scope === "all" ? null : new mongoose.Types.ObjectId(String(scope));
  await EmailOptOut.updateOne({ email: String(email).toLowerCase(), campaignId }, { $setOnInsert: { at: new Date() } }, { upsert: true });
}

// ── Queue ──────────────────────────────────────────────────────────────────
async function enqueue(type, fundingRequestId, campaignId) {
  try {
    await DonorUpdate.updateOne(
      { key: `${type}:${fundingRequestId}` },
      { $setOnInsert: { type, fundingRequestId, campaignId, status: "queued" } },
      { upsert: true }
    );
  } catch (err) {
    // Best-effort: the payout or receipt has already happened; never fail it
    // because of an email. Duplicate-key races mean it's already queued.
    if (err?.code !== 11000) logger.warn({ err, type, fundingRequestId }, "Couldn't queue donor update");
  }
}

// ── Email content ──────────────────────────────────────────────────────────
function render(type, { campaign, request, email }) {
  const main = (process.env.MAINURL || "").replace(/\/$/, "");
  const title = campaign?.basicInformation?.campaignTitle || "a campaign you supported";
  const link = `${main}/campaign/${campaign._id}/tracker`;
  const amount = money(request.disbursement?.amount ?? request.amount, request.disbursement?.currency || request.currency || campaign?.funding?.currency);
  const payee = request.vendorDisbursement?.isDirectToVendor ? request.vendorDisbursement.vendorLegalName : "";
  const purpose = String(request.purposeOfFunding || "").slice(0, 300);

  const subject =
    type === "payout" ? `${amount} from "${title}" has been paid out` : `Receipt added: see how ${amount} from "${title}" was spent`;
  const lead =
    type === "payout"
      ? `${esc(amount)} from <strong>${esc(title)}</strong> has been paid out${payee ? ` directly to <strong>${esc(payee)}</strong>` : ""}.`
      : `The organiser of <strong>${esc(title)}</strong> has added proof of spending for the ${esc(amount)} payout.`;
  const next =
    type === "payout"
      ? "We'll email you again when the receipt or proof of spending is added."
      : "You can see the receipt and every payout on the campaign tracker.";
  const one = unsubscribeUrl(email, String(campaign._id));
  const all = unsubscribeUrl(email, "all");
  const html = `<!doctype html><html><body style="font-family:Helvetica,Arial,sans-serif;color:#0f172a;max-width:560px;margin:0 auto;padding:24px">
<p style="font-size:16px;line-height:1.5">${lead}</p>
${purpose ? `<p style="font-size:15px;line-height:1.5;color:#334155"><strong>What it's for:</strong> ${esc(purpose)}</p>` : ""}
<p style="font-size:15px;line-height:1.5;color:#334155">${esc(next)}</p>
<p><a href="${esc(link)}" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600">See where the money went</a></p>
<p style="font-size:12px;color:#64748b;margin-top:32px">You're getting this because you donated to this campaign on Fund&amp;Trace.
<a href="${esc(one)}" style="color:#64748b">Stop updates for this campaign</a> · <a href="${esc(all)}" style="color:#64748b">Stop all campaign updates</a></p>
</body></html>`;
  const text = `${lead.replace(/<[^>]+>/g, "")}\n${purpose ? `What it's for: ${purpose}\n` : ""}${next}\n\nSee where the money went: ${link}\n\nStop updates for this campaign: ${one}\nStop all campaign updates: ${all}\n`;
  return {
    subject,
    html,
    text,
    headers: { "List-Unsubscribe": `<${unsubscribeUrl(email, String(campaign._id), "oneclick")}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  };
}

// ── Drain ──────────────────────────────────────────────────────────────────
async function recipients(campaignId, after, limit) {
  const { Donations } = require("../models/donationsModel");
  const rows = await Donations.aggregate([
    {
      $match: {
        campaignId: new mongoose.Types.ObjectId(String(campaignId)),
        donorEmail: { $type: "string", $ne: "" },
        $or: [{ "refund.status": { $in: ["", null, "failed"] } }, { "refund.status": { $exists: false } }],
      },
    },
    { $group: { _id: { $toLower: { $trim: { input: "$donorEmail" } } } } },
    { $match: { _id: { $gt: after || "" } } },
    { $sort: { _id: 1 } },
    { $limit: limit },
  ]).option({ maxTimeMS: 15000 });
  return rows.map((r) => r._id);
}

async function claim(now) {
  return DonorUpdate.findOneAndUpdate(
    { $or: [{ status: "queued" }, { status: "sending", leaseUntil: { $lt: now } }] },
    { $set: { status: "sending", leaseUntil: new Date(now.getTime() + LEASE_MS) } },
    { sort: { createdAt: 1 }, new: true }
  );
}

async function drain({ batch = 200, now = new Date(), send } = {}) {
  const job = await claim(now);
  if (!job) return { idle: true };
  const { FundingRequests } = require("../models/fundingRequestModel");
  const { Campaign } = require("../models/campaignModel");
  const [request, campaign] = await Promise.all([
    FundingRequests.findById(job.fundingRequestId).lean(),
    Campaign.findById(job.campaignId).select("basicInformation.campaignTitle funding.currency").lean(),
  ]);
  // A payout that was reversed after it was queued is not announced.
  const stale = job.type === "payout" && (!request?.disbursement?.dateDisbursed || request.disbursement.providerStatus === "failed");
  if (!request || !campaign || stale) {
    await DonorUpdate.updateOne({ _id: job._id }, { $set: { status: "done", completedAt: new Date(), leaseUntil: null } });
    return { key: job.key, skipped: stale ? "payout no longer disbursed" : "funding request or campaign gone" };
  }

  const emails = (await recipients(job.campaignId, job.cursor, batch)).filter((e) => EMAIL_RE.test(e));
  const opted = new Set(
    await EmailOptOut.distinct("email", { email: { $in: emails }, $or: [{ campaignId: null }, { campaignId: job.campaignId }] })
  );
  const transport = send || (await defaultSender());
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let cursor = job.cursor;
  for (const email of emails) {
    if (opted.has(email)) skipped += 1;
    else {
      try {
        await transport({ to: email, ...render(job.type, { campaign, request, email }) });
        sent += 1;
      } catch (err) {
        failed += 1;
        logger.warn({ err: err?.message, key: job.key }, "Donor update email failed");
      }
    }
    cursor = email;
  }
  // One write per batch: a crash mid-batch can resend at most that batch, and
  // the lease stops a second worker running it concurrently.
  const done = emails.length < batch;
  await DonorUpdate.updateOne(
    { _id: job._id },
    {
      $set: { cursor, status: done ? "done" : "queued", leaseUntil: null, ...(done ? { completedAt: new Date() } : {}) },
      $inc: { sent, failed, skippedOptOut: skipped },
    }
  );
  return { key: job.key, sent, failed, skipped, done };
}

async function defaultSender() {
  const { createTransporter } = require("./mailing");
  const transporter = await createTransporter();
  const from = process.env.EMAIL_FROM || process.env.EMAIL || "Fund&Trace <no-reply@fundandtrace.com>";
  return (msg) => transporter.sendMail({ from, ...msg });
}

module.exports = { enqueue, drain, render, unsubscribeToken, verifyUnsubscribe, unsubscribeUrl, optOut };
