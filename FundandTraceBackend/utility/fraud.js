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
function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0].trim();
  return req.ip || "";
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

module.exports = {
  getClientIp,
  assessDonation,
  geoMismatchScore,
  initAttemptScore,
  FLAG_THRESHOLD,
};
