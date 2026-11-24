// Organiser risk score, taken when a campaign launches and shown to admins
// (campaign list, payout review). It doesn't block anything on its own: it
// tells reviewers where to look first, and a "high" score posts to
// ALERT_WEBHOOK_URL.
//
// Signals are things a fraudster struggles to fake cheaply: account age,
// verified identity, a payout account shared with other organisers, a burst
// of launches, past suspensions, an unusually large goal for a new account.
// If SENTINEL_URL is set, the same facts go to SentinelNG (or any compatible
// scoring service) and its score is added.
const crypto = require("crypto");
const axios = require("axios");
const mongoose = require("mongoose");
const logger = require("../utility/logger");

const DAY = 864e5;
const DEFAULT_LARGE_GOAL = { NGN: 10000000, GHS: 200000, KES: 2000000, ZAR: 300000, GBP: 20000, USD: 25000, EUR: 25000, CAD: 30000 };
function largeGoalFor(currency) {
  let table = DEFAULT_LARGE_GOAL;
  try {
    if (process.env.RISK_LARGE_GOAL_JSON) table = { ...table, ...JSON.parse(process.env.RISK_LARGE_GOAL_JSON) };
  } catch {
    /* keep defaults */
  }
  return table[String(currency || "").toUpperCase()] || Infinity;
}

/** Keyed hash of a payout account, so accounts can be compared without decrypting. */
function accountHash(bankCode, accountNumber) {
  const { revealSensitive } = require("../utility/encryption"); // lazy: needs SECURITY_KEY
  const acct = String(revealSensitive(accountNumber) || "").replace(/\s+/g, "");
  if (!acct) return "";
  const key = process.env.FRAUD_HASH_SECRET || process.env.TOKEN_SECRET || "fundandtrace";
  return crypto.createHmac("sha256", key).update(`acct|${String(bankCode || "").trim()}|${acct}`).digest("hex").slice(0, 32);
}

const createdAtOf = (doc) => {
  if (doc?.createdAt) return new Date(doc.createdAt);
  try {
    return new mongoose.Types.ObjectId(String(doc?._id)).getTimestamp();
  } catch {
    return null;
  }
};

/** Pure: score the facts. */
function scoreOrganiser(f, now = new Date()) {
  const reasons = [];
  let score = 0;
  const add = (points, reason) => {
    score += points;
    reasons.push(reason);
  };
  const ageDays = f.accountCreatedAt ? (now - new Date(f.accountCreatedAt)) / DAY : null;
  if (ageDays !== null && ageDays < 3) add(20, "Account less than 3 days old");
  else if (ageDays !== null && ageDays < 14) add(10, "Account less than 2 weeks old");
  if (f.identityStatus !== "verified") add(f.identityStatus === "pending" ? 10 : 25, `Identity ${f.identityStatus || "unverified"}`);
  if (!f.emailVerified) add(15, "Email not verified");
  if (f.sharedAccountOrganisers > 0) add(35, `Payout account also used by ${f.sharedAccountOrganisers} other organiser(s)`);
  if (f.priorSuspensions > 0) add(30, `${f.priorSuspensions} earlier campaign(s) suspended`);
  if (f.recentLaunches >= 3) add(15, `${f.recentLaunches} campaigns launched in 30 days`);
  if (f.largeGoal && ageDays !== null && ageDays < 30) add(10, "Large goal for a new account");
  if (f.storyLength < 300) add(5, "Very short story");
  if (!f.hasMedia) add(5, "No photo or video");
  if (f.external?.score) add(Number(f.external.score) || 0, `External score: ${f.external.reason || f.external.score}`);
  score = Math.min(100, score);
  const level = score >= 60 ? "high" : score >= 30 ? "medium" : "low";
  return { score, level, reasons };
}

async function gatherFacts(campaign) {
  const { Campaign } = require("../models/campaignModel");
  const { Users } = require("../models/users");
  const organizerId = campaign.organizerId;
  const [user, siblings] = await Promise.all([
    organizerId ? Users.findById(organizerId).select("verified identityVerification.status email").lean() : null,
    organizerId
      ? Campaign.find({ organizerId, _id: { $ne: campaign._id } }).select("launched suspended createdAt").lean().maxTimeMS(5000)
      : [],
  ]);
  const hash = campaign.funding?.accountHash || accountHash(campaign.funding?.bankCode, campaign.funding?.accountNumber);
  const sharedAccountOrganisers = hash
    ? (await Campaign.distinct("organizerId", { "funding.accountHash": hash, organizerId: { $ne: organizerId } })).length
    : 0;
  const since = Date.now() - 30 * DAY;
  return {
    accountCreatedAt: user ? createdAtOf(user) : null,
    identityStatus: user?.identityVerification?.status || "unverified",
    emailVerified: Boolean(user?.verified),
    sharedAccountOrganisers,
    priorSuspensions: siblings.filter((c) => c.suspended).length,
    recentLaunches: siblings.filter((c) => c.launched && new Date(c.createdAt).getTime() >= since).length + 1,
    largeGoal: Number(campaign.funding?.amountExpected || 0) >= largeGoalFor(campaign.funding?.currency),
    storyLength: (campaign.content?.story || []).join(" ").replace(/<[^>]+>/g, "").trim().length,
    hasMedia: Boolean(campaign.basicInformation?.campaignImage || campaign.content?.campaignVideo),
    emailDomain: String(user?.email || "").split("@")[1] || "",
  };
}

async function externalScore(facts, campaign) {
  if (!process.env.SENTINEL_URL) return null;
  try {
    const { data } = await axios.post(
      process.env.SENTINEL_URL,
      {
        event: "organiser_campaign_launch",
        campaignId: String(campaign._id),
        organiserId: String(campaign.organizerId || ""),
        country: campaign.basicInformation?.locationCountry || "",
        currency: campaign.funding?.currency || "",
        goal: Number(campaign.funding?.amountExpected || 0),
        facts: { ...facts, accountCreatedAt: facts.accountCreatedAt ? new Date(facts.accountCreatedAt).toISOString() : null },
      },
      { timeout: 4000, headers: process.env.SENTINEL_API_KEY ? { Authorization: `Bearer ${process.env.SENTINEL_API_KEY}` } : {} }
    );
    const score = Math.max(0, Math.min(50, Number(data?.score) || 0)); // capped: one input among several
    return score ? { score, reason: String(data?.reason || data?.label || "").slice(0, 120) } : null;
  } catch (err) {
    logger.warn({ err: err?.message }, "External risk score unavailable");
    return null;
  }
}

/** Score a campaign's organiser and store the result on the campaign. Never throws. */
async function assessLaunch(campaignId) {
  try {
    const { Campaign } = require("../models/campaignModel");
    const campaign = await Campaign.findById(campaignId).lean();
    if (!campaign) return null;
    const facts = await gatherFacts(campaign);
    facts.external = await externalScore(facts, campaign);
    const result = { ...scoreOrganiser(facts), at: new Date() };
    await Campaign.updateOne({ _id: campaignId }, { $set: { riskAssessment: result } });
    if (result.level === "high" && process.env.ALERT_WEBHOOK_URL) {
      const text = `High-risk launch (${result.score}/100): "${campaign.basicInformation?.campaignTitle || campaignId}". ${result.reasons.join("; ")}`;
      axios.post(process.env.ALERT_WEBHOOK_URL, { text, content: text }, { timeout: 5000 }).catch(() => {});
    }
    return result;
  } catch (err) {
    logger.warn({ err: err?.message, campaignId: String(campaignId) }, "Organiser risk assessment failed");
    return null;
  }
}

module.exports = { scoreOrganiser, assessLaunch, accountHash, createdAtOf, largeGoalFor };
