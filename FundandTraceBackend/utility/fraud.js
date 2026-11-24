// Lightweight donation fraud assessment.
//
// Philosophy: flag, don't block. False positives cost real donations; a
// flagged donation still records but lands in the admin fraud queue
// (GET /api/admin/fraud/flagged) for review. Score components:
//
//   - Email velocity: many donations from one address in a short window
//     (card-testing signature).
//   - Campaign hopping: one address spreading tiny amounts across many
//     campaigns quickly (stolen-card validation behavior).
//   - IP velocity: many different donor emails from one IP address.
//   - Geo mismatch: donor-declared country contradicts the gateway's
//     card country (checked again at callback verification).
//
// Amounts are compared in major units; all windows configurable via env.
const { Donations } = require("../models/donationsModel");
const { ActivityLog } = require("../models/activityLogModel");
const logger = require("./logger");

const EMAIL_VELOCITY_WINDOW_MS = Number(process.env.FRAUD_EMAIL_WINDOW_MS || 15 * 60 * 1000);
const EMAIL_VELOCITY_MAX = Number(process.env.FRAUD_EMAIL_MAX || 5);
const CAMPAIGN_HOP_WINDOW_MS = Number(process.env.FRAUD_HOP_WINDOW_MS || 60 * 60 * 1000);
const CAMPAIGN_HOP_MAX = Number(process.env.FRAUD_HOP_MAX || 5);
const IP_VELOCITY_WINDOW_MS = Number(process.env.FRAUD_IP_WINDOW_MS || 24 * 60 * 60 * 1000);
const IP_VELOCITY_MAX = Number(process.env.FRAUD_IP_MAX || 10);
const INIT_WINDOW_MS = Number(process.env.FRAUD_INIT_WINDOW_MS || 15 * 60 * 1000);
const INIT_ATTEMPT_MAX = Number(process.env.FRAUD_INIT_MAX || 8);
const FLAG_THRESHOLD = Number(process.env.FRAUD_FLAG_THRESHOLD || 50);

// Pure scoring helper (unit-testable without a DB).
function initAttemptScore(count) {
  if (!Number.isFinite(count) || count < INIT_ATTEMPT_MAX) return { score: 0, reason: null };
  return { score: 20, reason: `init_attempts:${count}` };
}

// Best-effort client IP behind nginx/proxies (server.js sets trust proxy).
// req.ip honours `trust proxy` (one hop), so it is the address our proxy saw.
// The leftmost X-Forwarded-For entry is whatever the client typed, so using
// it let anyone dodge the IP velocity checks; it's only a fallback for
// requests that never passed through Express's IP resolution (unit tests).
function getClientIp(req) {
  if (req.ip) return req.ip;
  const fwd = req.headers?.["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",").pop().trim();
  return "";
}

async function assessDonation({ email, campaignId, ip }) {
  const assessment = { score: 0, reasons: [], flagged: false, ip: ip || "" };
  try {
    const now = Date.now();

    if (email) {
      // Email velocity (completed donations).
      const emailCount = await Donations.countDocuments({
        donorEmail: email,
        createdAt: { $gte: new Date(now - EMAIL_VELOCITY_WINDOW_MS) },
      }).maxTimeMS(3000);
      if (emailCount >= EMAIL_VELOCITY_MAX) {
        assessment.score += 40;
        assessment.reasons.push(`email_velocity:${emailCount}in${EMAIL_VELOCITY_WINDOW_MS / 60000}m`);
      }

      // Initialization attempts — catches card-testing probes that never
      // reach a completed donation. Every initializePayment call writes an
      // ActivityLog("initializeDonation") entry, failed attempts included.
      let initAttempts = 0;
      try {
        initAttempts = await ActivityLog.countDocuments({
          type: "initializeDonation",
          user: email,
          createdAt: { $gte: new Date(now - INIT_WINDOW_MS) },
        }).maxTimeMS(3000);
      } catch (err) {
        logger.warn({ err }, "Init-attempt fraud query failed; skipping signal");
      }
      const initSignal = initAttemptScore(initAttempts);
      if (initSignal.reason) {
        assessment.score += initSignal.score;
        assessment.reasons.push(initSignal.reason);
      }

      // Campaign hopping.
      if (campaignId) {
        const hops = await Donations.distinct("campaignId", {
          donorEmail: email,
          createdAt: { $gte: new Date(now - CAMPAIGN_HOP_WINDOW_MS) },
        }).maxTimeMS(3000);
        if (hops.length >= CAMPAIGN_HOP_MAX && !hops.some((h) => String(h) === String(campaignId))) {
          assessment.score += 30;
          assessment.reasons.push(`campaign_hopping:${hops.length}campaignsin${CAMPAIGN_HOP_WINDOW_MS / 3600000}h`);
        }
      }
    }

    // IP velocity: distinct donor emails sharing one IP.
    if (ip) {
      const ips = await Donations.distinct("donorEmail", {
        "fraud.ip": ip,
        createdAt: { $gte: new Date(now - IP_VELOCITY_WINDOW_MS) },
      }).maxTimeMS(3000);
      if (ips.length >= IP_VELOCITY_MAX) {
        assessment.score += 35;
        assessment.reasons.push(`ip_velocity:${ips.length}emails`);
      }
    }
  } catch (err) {
    // Fraud assessment must never break the donate flow.
    logger.warn({ err }, "Fraud assessment failed; continuing unflagged");
  }

  assessment.flagged = assessment.score >= FLAG_THRESHOLD;
  return assessment;
}

// Pure function so it is unit-testable without a DB.
// Only scores when BOTH sides are known; unknown ≠ mismatch.
function geoMismatchScore(donorCountry, gatewayCountry) {
  const donor = String(donorCountry || "").trim().toUpperCase();
  const gateway = String(gatewayCountry || "").trim().toUpperCase();
  if (!donor || !gateway) return { score: 0, reason: null };
  if (donor === gateway) return { score: 0, reason: null };
  return { score: 25, reason: `geo_mismatch:${donor}vs${gateway}` };
}

// ── Card signals (recorded when the gateway confirms a payment) ──────────
// We never see card numbers. The gateways give a reusable card signature
// (Paystack) or BIN + last 4 + expiry (Flutterwave); we keep only a keyed
// hash of it, enough to notice one card paying from many identities or
// many times in a burst (card testing, stolen cards).
const CARD_EMAILS_MAX = Number(process.env.FRAUD_CARD_EMAILS_MAX || 3);
const CARD_EMAILS_WINDOW_MS = Number(process.env.FRAUD_CARD_EMAILS_WINDOW_MS || 24 * 3600e3);
const CARD_BURST_MAX = Number(process.env.FRAUD_CARD_BURST_MAX || 5);
const CARD_BURST_WINDOW_MS = Number(process.env.FRAUD_CARD_BURST_WINDOW_MS || 3600e3);

function cardFingerprint(gateway, tx) {
  let raw = "";
  if (gateway === "paystack") {
    const a = tx?.authorization || {};
    raw = a.signature || (a.bin && a.last4 ? `${a.bin}${a.last4}${a.exp_month || ""}${a.exp_year || ""}` : "");
  } else if (gateway === "flutterwave") {
    const c = tx?.card || {};
    raw = c.first_6digits && c.last_4digits ? `${c.first_6digits}${c.last_4digits}${c.expiry || ""}` : "";
  }
  if (!raw) return "";
  const key = process.env.FRAUD_HASH_SECRET || process.env.TOKEN_SECRET || "fundandtrace";
  return require("crypto").createHmac("sha256", key).update(`${gateway}|${raw}`).digest("hex").slice(0, 32);
}

/** Pure: score card reuse. */
function cardScore({ distinctEmails = 0, recent = 0 } = {}) {
  let score = 0;
  const reasons = [];
  if (distinctEmails >= CARD_EMAILS_MAX) {
    score += 40;
    reasons.push(`card_shared:${distinctEmails}emails`);
  }
  if (recent >= CARD_BURST_MAX) {
    score += 30;
    reasons.push(`card_burst:${recent}in${CARD_BURST_WINDOW_MS / 60000}m`);
  }
  return { score, reasons };
}

/** Add card signals to a fraud snapshot. Never throws. */
async function withCardSignals(snapshot, gateway, tx, donorEmail) {
  const out = { ...snapshot, reasons: [...(snapshot.reasons || [])] };
  const card = cardFingerprint(gateway, tx);
  if (!card) return out;
  out.card = card;
  try {
    const now = Date.now();
    const [emails, recent] = await Promise.all([
      Donations.distinct("donorEmail", { "fraud.card": card, createdAt: { $gte: new Date(now - CARD_EMAILS_WINDOW_MS) } }).maxTimeMS(3000),
      Donations.countDocuments({ "fraud.card": card, createdAt: { $gte: new Date(now - CARD_BURST_WINDOW_MS) } }).maxTimeMS(3000),
    ]);
    const others = new Set(emails.map((e) => String(e || "").toLowerCase()));
    if (donorEmail) others.add(String(donorEmail).toLowerCase());
    const sig = cardScore({ distinctEmails: others.size, recent: recent + 1 });
    out.score = Number(out.score || 0) + sig.score;
    out.reasons.push(...sig.reasons);
  } catch (err) {
    logger.warn({ err: err?.message }, "Card velocity check failed; skipping signal");
  }
  out.flagged = Number(out.score || 0) >= FLAG_THRESHOLD;
  return out;
}

module.exports = {
  cardFingerprint,
  cardScore,
  withCardSignals,
  getClientIp,
  assessDonation,
  geoMismatchScore,
  initAttemptScore,
  FLAG_THRESHOLD,
};
