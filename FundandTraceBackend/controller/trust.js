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
    await require("../services/donorUpdates").enqueue("receipt", fr._id, fr.campaignId);
    return res.status(200).json({ status: 200, data: { receipt: receiptUrl } });
  } catch (error) {
    logger.error({ err: error }, "uploadReceipt failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

// ── Daily anchors (services/anchoring.js) ──────────────────────────────────
const { LedgerAnchor } = require("../models/ledgerAnchorModel");
const anchoring = require("../services/anchoring");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

exports.listAnchors = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbDown(res);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 365);
    const anchors = await LedgerAnchor.find().sort({ date: -1 }).limit(limit).select("-leaves").lean().maxTimeMS(3000);
    res.set("Cache-Control", "public, max-age=300");
    return res.status(200).json({ data: anchors.map(anchoring.publicAnchor) });
  } catch (error) {
    logger.error({ err: error }, "listAnchors failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

// GET /anchors/:date            → anchor with all leaves (enough to recompute the root)
// GET /anchors/:date?format=txt → the exact published message
// GET /anchors/:date?format=ots → OpenTimestamps proof for that message
exports.getAnchor = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbDown(res);
    const { date } = req.params;
    if (date !== "latest" && !DATE_RE.test(date)) return res.status(400).json({ status: 400, error: "Use a date like 2026-11-22." });
    const anchor =
      date === "latest"
        ? await LedgerAnchor.findOne().sort({ date: -1 }).lean().maxTimeMS(3000)
        : await LedgerAnchor.findOne({ date }).lean().maxTimeMS(3000);
    if (!anchor) return res.status(404).json({ status: 404, error: "No anchor for that date." });

    res.set("Cache-Control", "public, max-age=300");
    if (req.query.format === "txt") return res.type("text/plain").send(anchor.message);
    if (req.query.format === "ots") {
      const ots = (anchor.publications || []).find((p) => p.target === "opentimestamps" && p.proof);
      if (!ots) return res.status(404).json({ status: 404, error: "No OpenTimestamps proof for this anchor." });
      res.set("Content-Disposition", `attachment; filename="${anchor.date}.txt.ots"`);
      return res.type("application/octet-stream").send(Buffer.from(ots.proof, "base64"));
    }
    return res.status(200).json({ data: { ...anchoring.publicAnchor(anchor), leaves: anchor.leaves } });
  } catch (error) {
    logger.error({ err: error }, "getAnchor failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.anchorProof = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return dbDown(res);
    const date = req.query.date ? String(req.query.date) : undefined;
    if (date && !DATE_RE.test(date)) return res.status(400).json({ status: 400, error: "Use a date like 2026-11-22." });
    const proof = await anchoring.proofFor(req.params.campaignId, date);
    if (!proof) return res.status(404).json({ status: 404, error: "No anchors published yet." });
    res.set("Cache-Control", "public, max-age=300");
    return res.status(200).json({ data: proof });
  } catch (error) {
    logger.error({ err: error }, "anchorProof failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
