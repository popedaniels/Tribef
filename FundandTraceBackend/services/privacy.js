// Data protection: subject access (export), erasure (delete account) and
// retention. See docs/data-protection.md for what is kept and why.
//
// Money records are not erased: UK and Nigerian law require payment and
// Gift Aid records to be kept for 6 years, and donors' trust depends on a
// campaign's history staying intact. On deletion they are de-identified
// instead: donor name and email are replaced, the person can no longer be
// found from them, and the account itself is removed.
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const logger = require("../utility/logger");

const DAY = 864e5;
const lower = (s) => String(s || "").trim().toLowerCase();

async function exportUserData(userId) {
  const { Users } = require("../models/users");
  const { Campaign } = require("../models/campaignModel");
  const { Donations } = require("../models/donationsModel");
  const { FundingRequests } = require("../models/fundingRequestModel");
  const { ActivityLog } = require("../models/activityLogModel");
  const { Subscription } = require("../models/subscriptionModel");
  const { EmailOptOut } = require("../models/donorUpdateModel");
  const { PushSubscription } = require("../models/pushSubscriptionModel");

  const user = await Users.findById(userId).lean();
  if (!user) return null;
  const email = lower(user.email);
  const { safeProfile } = require("../utility/safeProfile");
  const [campaigns, donations, subscriptions, optOuts, pushes, activity] = await Promise.all([
    Campaign.find({ organizerId: user._id }).select("-adminActivities -riskAssessment -funding.accountHash -disputeGovernance.disputeReports").lean(),
    Donations.find({ donorEmail: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") })
      .select("campaignId amount tip processingFee createdAt paymentMethod anonymous giftAid refund.status donorName")
      .lean(),
    Subscription ? Subscription.find({ subscriberId: user._id }).select("-stripeCustomerId").lean() : [],
    EmailOptOut.find({ email }).lean(),
    PushSubscription.find({ userId: user._id }).select("createdAt userAgent").lean(),
    ActivityLog.find({ $or: [{ userId: user._id }, { user: email }] }).select("type createdAt campaignId").sort({ createdAt: -1 }).limit(1000).lean(),
  ]);
  const requests = await FundingRequests.find({ campaignId: { $in: campaigns.map((c) => c._id) } })
    .select("campaignId amount currency status purposeOfFunding fundingType createdAt approvedAt disbursement.dateDisbursed disbursement.amount disbursement.receipt")
    .lean();
  const { revealSensitive } = require("../utility/encryption");
  const mask = (v) => {
    const s = String(revealSensitive(v) || "");
    return s ? `••••${s.slice(-4)}` : "";
  };
  for (const c of campaigns) {
    if (c.funding) {
      c.funding.accountNumber = mask(c.funding.accountNumber);
      c.funding.sortCode = mask(c.funding.sortCode);
      c.funding.accountName = String(revealSensitive(c.funding.accountName) || "");
      c.funding.bankName = String(revealSensitive(c.funding.bankName) || "");
    }
  }
  const iv = user.identityVerification || {};
  return {
    exportedAt: new Date().toISOString(),
    about: "Everything Fund&Trace holds about your account. Identity document images are not included; ask support@fundandtrace.com for copies.",
    profile: safeProfile(user),
    security: { twoFactorEnabled: Boolean(user.twoFactor?.enabled), sessionVersion: user.sessionVersion || 0 },
    identityVerification: { status: iv.status, method: iv.method, verifiedAt: iv.verifiedAt, idDocumentType: iv.idDocumentType, idCountry: iv.idCountry, nameOnId: iv.nameOnId },
    campaigns,
    fundingRequests: requests,
    donations,
    monthlyGifts: subscriptions,
    emailPreferences: optOuts,
    pushSubscriptions: pushes,
    activity,
  };
}

/** Why an account can't be deleted yet, or null. */
async function deletionBlockers(user) {
  const { Campaign } = require("../models/campaignModel");
  const { FundingRequests } = require("../models/fundingRequestModel");
  const { Subscription } = require("../models/subscriptionModel");
  const blockers = [];
  const funded = await Campaign.find({ organizerId: user._id, "funding.amountRaised": { $gt: 0 } }).select("_id basicInformation.campaignTitle funding.availableBalance").lean();
  if (funded.some((c) => Number(c.funding?.availableBalance || 0) > 0)) {
    blockers.push("You have campaign money still held in escrow. It has to be paid out or refunded to donors first.");
  }
  if (funded.length) {
    const pending = await FundingRequests.countDocuments({ campaignId: { $in: funded.map((c) => c._id) }, status: "Pending" });
    if (pending) blockers.push("You have funding requests waiting for review.");
  }
  if (Subscription) {
    const active = await Subscription.countDocuments({ subscriberId: user._id, status: { $in: ["active", "trialing", "past_due"] } });
    if (active) blockers.push("You have monthly gifts running. Cancel them under Dashboard → Subscriptions first.");
  }
  return blockers;
}

async function deleteAccount(userId, { password, confirm }) {
  const { Users, Credentials } = require("../models/users");
  const { Campaign } = require("../models/campaignModel");
  const { Donations } = require("../models/donationsModel");
  const { PushSubscription } = require("../models/pushSubscriptionModel");
  const { EmailOptOut } = require("../models/donorUpdateModel");

  if (confirm !== "DELETE") return { status: 400, error: 'Type DELETE to confirm.' };
  const user = await Users.findById(userId);
  if (!user) return { status: 404, error: "Account not found" };
  if (user.role === "admin") return { status: 403, error: "Admin accounts are removed by another admin." };
  const email = lower(user.email);
  const cred = await Credentials.findOne({ email });
  if (!cred || !(await bcrypt.compare(String(password || ""), cred.password))) return { status: 401, error: "Password is incorrect" };

  const blockers = await deletionBlockers(user);
  if (blockers.length) return { status: 409, error: blockers.join(" "), data: { blockers } };

  const tombstone = `deleted-${crypto.randomBytes(8).toString("hex")}@deleted.invalid`;
  // Draft campaigns that never took money go; funded ones stay (donors'
  // records) with the organiser's name removed.
  await Campaign.deleteMany({ organizerId: user._id, launched: { $ne: true }, $or: [{ "funding.amountRaised": 0 }, { "funding.amountRaised": { $exists: false } }] });
  await Campaign.updateMany({ organizerId: user._id }, { $set: { organizer: "Former organiser" } });
  // Donations: de-identify, keep the money record.
  await Donations.updateMany(
    { donorEmail: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    { $set: { donorEmail: tombstone, donorName: "Former donor", anonymous: true, zipCode: "", "fraud.ip": "" } }
  );
  await Promise.all([
    PushSubscription.deleteMany({ userId: user._id }),
    EmailOptOut.updateMany({ email }, { $set: { email: tombstone } }).catch(() => {}),
    Credentials.deleteOne({ _id: cred._id }),
  ]);
  await Users.updateOne(
    { _id: user._id },
    {
      $set: {
        firstName: "Deleted",
        lastName: "user",
        email: tombstone,
        phone: "",
        city: "",
        profilePicture: "",
        code: "",
        suspended: true,
        twoFactor: { enabled: false, secret: "", confirmedAt: null },
        deletedAt: new Date(),
      },
      $inc: { sessionVersion: 1 },
    },
    { strict: false }
  );
  logger.info({ userId: String(user._id) }, "Account deleted at the user's request");
  return { status: 200 };
}

// ── Retention (daily) ──────────────────────────────────────────────────────
// Data minimisation: personal data that was only needed for a while.
//  - Donor IP addresses (fraud checks) after RETAIN_DONOR_IP_DAYS (90).
//  - Activity log entries after RETAIN_ACTIVITY_DAYS (730), except the admin
//    audit trail (entries with an actorId), which is kept.
//  - Expired, never-submitted capture sessions after 30 days.
//  - Unverified accounts that never did anything after RETAIN_UNVERIFIED_DAYS (90).
async function runRetention(now = new Date()) {
  const { Donations } = require("../models/donationsModel");
  const { ActivityLog } = require("../models/activityLogModel");
  const { CaptureSession } = require("../models/evidenceModel");
  const { Users, Credentials } = require("../models/users");
  const { Campaign } = require("../models/campaignModel");
  const days = (env, d) => Math.max(1, Number(process.env[env] || d));
  const before = (n) => new Date(now.getTime() - n * DAY);

  const ips = await Donations.updateMany({ "fraud.ip": { $nin: ["", null] }, createdAt: { $lt: before(days("RETAIN_DONOR_IP_DAYS", 90)) } }, { $set: { "fraud.ip": "" } });
  const logs = await ActivityLog.deleteMany({ actorId: { $exists: false }, createdAt: { $lt: before(days("RETAIN_ACTIVITY_DAYS", 730)) } });
  const sessions = await CaptureSession.deleteMany({ status: { $in: ["open", "expired"] }, expiresAt: { $lt: before(30) } });

  // Unverified, never-used accounts: no campaign, no donation.
  const stale = await Users.find({ verified: { $ne: true }, role: { $ne: "admin" }, joined: { $lt: before(days("RETAIN_UNVERIFIED_DAYS", 90)) } })
    .select("_id email")
    .limit(500)
    .lean();
  let removed = 0;
  for (const u of stale) {
    const [hasCampaign, hasDonation] = await Promise.all([
      Campaign.exists({ organizerId: u._id }),
      Donations.exists({ donorEmail: u.email }),
    ]);
    if (hasCampaign || hasDonation) continue;
    await Credentials.deleteOne({ email: lower(u.email) });
    await Users.deleteOne({ _id: u._id });
    removed += 1;
  }
  return {
    donorIpsCleared: ips.modifiedCount ?? ips.nModified ?? 0,
    activityDeleted: logs.deletedCount || 0,
    captureSessionsDeleted: sessions.deletedCount || 0,
    unverifiedAccountsRemoved: removed,
  };
}

module.exports = { exportUserData, deleteAccount, deletionBlockers, runRetention };
