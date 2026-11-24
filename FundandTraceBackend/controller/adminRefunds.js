const mongoose = require("mongoose");
const { Campaign } = require("../models/campaignModel");
const { Donations } = require("../models/donationsModel");
const logger = require("../utility/logger");

const { refundDonation, proRataRefundCampaign, RefundError } = require("../services/refunds");
const { recordAdminAction } = require("../services/activityLog");

const actorOf = (req) => ({
  id: req.admin?._id,
  name: req.admin ? `${req.admin.firstName || ""} ${req.admin.lastName || ""}`.trim() || "Admin" : "Admin",
});

const sendRefundError = (res, err) => {
  if (err instanceof RefundError) {
    return res.status(err.status).json({ status: err.status, code: err.code, error: err.message });
  }
  logger.error({ err });
  return res.status(500).json({ status: 500, error: "Server error." });
};

// Route name kept for compatibility; now refunds Stripe, Flutterwave and
// Paystack donations through the guarded refund pipeline.
exports.stripeRefund = async (req, res) => {
  try {
    const { campaignId, donationId } = req.params;
    if (
      !mongoose.Types.ObjectId.isValid(String(campaignId || "")) ||
      !mongoose.Types.ObjectId.isValid(String(donationId || ""))
    ) {
      return res.status(400).json({ status: 400, error: "Invalid ID" });
    }
    const donation = await Donations.findOne({ _id: donationId, campaignId }).select("_id").maxTimeMS(3000);
    if (!donation) {
      return res.status(404).json({ status: 404, error: "Donation not found" });
    }
    const result = await refundDonation({
      donationId,
      requestedBy: "admin",
      actor: actorOf(req),
      reason: String(req.body?.reason || "Refunded by admin"),
    });
    recordAdminAction(req, "refundDonation", { targetType: "donation", targetId: donationId, campaignId, details: result });
    return res.status(200).json({ status: 200, message: "Refund created.", data: result });
  } catch (error) {
    return sendRefundError(res, error);
  }
};

// Refund everything still in escrow, pro-rata (see services/refunds.js).
exports.stripeRefundBatch = async (req, res) => {
  try {
    const { campaignId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(campaignId || ""))) {
      return res.status(400).json({ status: 400, error: "Invalid Campaign ID" });
    }
    const summary = await proRataRefundCampaign(campaignId, {
      requestedBy: "admin",
      actor: actorOf(req),
      reason: String(req.body?.reason || "Campaign refunded by admin"),
    });
    recordAdminAction(req, "refundCampaign", { targetType: "campaign", targetId: campaignId, campaignId, details: { totalRefunded: summary.totalRefunded, failed: summary.failed.length } });
    if (!summary.refunded.length && !summary.failed.length) {
      return res.status(422).json({ status: 422, error: "Nothing left in escrow to refund" });
    }
    return res.status(summary.failed.length ? 207 : 200).json({ status: summary.failed.length ? 207 : 200, data: summary });
  } catch (error) {
    return sendRefundError(res, error);
  }
};

exports.getAllDonations = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    let query = {};
    if (req.query.queries) {
      try {
        const parsed =
          typeof req.query.queries === "string"
            ? JSON.parse(req.query.queries)
            : req.query.queries;
        if (parsed.query && typeof parsed.query === "object" && !Array.isArray(parsed.query)) {
          query = parsed.query;
        } else if (parsed.queries && typeof parsed.queries === "object" && !Array.isArray(parsed.queries)) {
          query = parsed.queries;
        } else if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          // fallback: treat parsed directly as query if it doesn't contain nested query key
          const hasQueryKey = "query" in parsed || "queries" in parsed;
          if (!hasQueryKey) query = parsed;
        }
      } catch (e) {
        logger.warn({ err: e }, "Could not parse queries JSON");
        return res.status(400).json({ status: 400, error: "Invalid queries" });
      }
    }
    const page = Math.max(parseInt(req.params.query, 10) || 1, 1);
    const count = await Donations.find({ ...query }).countDocuments().maxTimeMS(3000);
    const donations = await Donations.find({ ...query })
      .skip((page - 1) * 10)
      .limit(10)
      .populate("campaignId")
      .maxTimeMS(3000);

    logger.debug({ donations }, "Donations queried");
    return res.status(200).json({
      data: { donations, count },
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.getSingleCampaign = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    let query = {};
    if (req.query.queries) {
      try {
        const parsed =
          typeof req.query.queries === "string"
            ? JSON.parse(req.query.queries)
            : req.query.queries;
        if (parsed.query && typeof parsed.query === "object" && !Array.isArray(parsed.query)) {
          query = parsed.query;
        } else if (parsed.queries && typeof parsed.queries === "object" && !Array.isArray(parsed.queries)) {
          query = parsed.queries;
        } else if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const hasQueryKey = "query" in parsed || "queries" in parsed;
          if (!hasQueryKey) query = parsed;
        }
      } catch (e) {
        logger.warn({ err: e }, "Could not parse queries JSON");
        return res.status(400).json({ status: 400, error: "Invalid queries" });
      }
    }
    const page = Math.max(parseInt(req.params.query, 10) || 1, 1);
    const count = await Campaign.find({ ...query }).countDocuments().maxTimeMS(3000);
    const donations = await Campaign.find({ ...query })
      .skip((page - 1) * 10)
      .limit(10)
      .maxTimeMS(3000);

    logger.debug({ donations }, "Donations queried");
    return res.status(200).json({
      data: { donations, count },
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
