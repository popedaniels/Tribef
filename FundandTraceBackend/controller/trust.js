// Public trust endpoints: Transparency Score, public ledger, chain verification,
// and organiser proof-of-spend uploads.
const mongoose = require("mongoose");
const { Campaign } = require("../models/campaignModel");
const { FundingRequests } = require("../models/fundingRequestModel");
const { Users } = require("../models/users");
const { LedgerEntry } = require("../models/ledgerEntryModel");
const { computeTransparencyScore } = require("../services/transparency");
const { verifyCampaign } = require("../services/ledger");
const { getAuthUserId } = require("../utility/auth");
const logger = require("../utility/logger");

const dbDown = (res) =>
  res.status(503).json({ status: 503, error: "Service temporarily unavailable. Please try again." });

exports.transparencyScore = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbDown(res);
    const campaign = await Campaign.findOne({ _id: req.params.id, suspended: false })
      .select("organizerId createdAt updates disputeGovernance charityId")
      .maxTimeMS(3000);
    if (!campaign) return res.status(404).json({ status: 404, error: "Campaign not found" });
    const [organizer, fundingRequests] = await Promise.all([
      Users.findById(campaign.organizerId).select("identityVerification").maxTimeMS(3000),
      FundingRequests.find({ campaignId: campaign._id })
        .select("status fundingType amount disbursement.dateDisbursed disbursement.receipt disbursement.amount disbursement.providerStatus")
        .maxTimeMS(3000),
    ]);
    const result = computeTransparencyScore({ campaign, organizer, fundingRequests });
    res.set("Cache-Control", "public, max-age=60");
    return res.status(200).json({ data: result });
  } catch (error) {
    logger.error({ err: error }, "transparencyScore failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.ledger = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbDown(res);
    const { campaignId } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500);
    const [entries, count] = await Promise.all([
      LedgerEntry.find({ campaignId }).sort({ seq: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      LedgerEntry.countDocuments({ campaignId }),
    ]);
    return res.status(200).json({
      data: {
        entries,
        count,
        page,
        limit,
        howToVerify:
          "hash = SHA-256(JSON.stringify([campaignId, seq, type, amount.toFixed(2), CURRENCY, refId, memo, at(ISO), prevHash])); first prevHash is 64 zeros.",
      },
    });
  } catch (error) {
    logger.error({ err: error }, "ledger list failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.verifyLedger = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbDown(res);
    const result = await verifyCampaign(req.params.campaignId);
    return res.status(200).json({ data: result });
  } catch (error) {
    logger.error({ err: error }, "ledger verify failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

// Proof of spend: only Cloudinary uploads (or hosts configured in
// RECEIPT_HOSTS) are accepted, so receipts can't point at arbitrary sites.
const allowedReceiptHosts = () =>
  String(process.env.RECEIPT_HOSTS || "res.cloudinary.com")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

exports.isAllowedReceiptUrl = (value) => {
  try {
    const url = new URL(String(value));
    return url.protocol === "https:" && allowedReceiptHosts().includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
};

exports.uploadReceipt = async (req, res) => {
  try {
    const authUserId = getAuthUserId(req.auth);
    const receiptUrl = String(req.body?.receiptUrl || "");
    if (!exports.isAllowedReceiptUrl(receiptUrl)) {
      return res.status(400).json({ status: 400, error: "receiptUrl must be an https link to an uploaded file" });
    }
    const fr = await FundingRequests.findById(req.params.id).select("campaignId disbursement status").maxTimeMS(3000);
    if (!fr) return res.status(404).json({ status: 404, error: "Funding request not found" });
    const campaign = await Campaign.findById(fr.campaignId).select("organizerId").maxTimeMS(3000);
    if (!campaign || String(campaign.organizerId) !== String(authUserId)) {
      return res.status(403).json({ status: 403, error: "Campaign ownership required" });
    }
    if (!fr.disbursement?.dateDisbursed) {
      return res.status(409).json({ status: 409, error: "Proof can be added once the payout has been made" });
    }
    await FundingRequests.updateOne(
      { _id: fr._id },
      { $set: { "disbursement.receipt": receiptUrl, "disbursement.receiptUploadedAt": new Date() } }
    );
    return res.status(200).json({ status: 200, data: { receipt: receiptUrl } });
  } catch (error) {
    logger.error({ err: error }, "uploadReceipt failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
