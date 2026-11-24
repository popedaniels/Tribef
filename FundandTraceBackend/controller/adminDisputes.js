// Dispute resolution (gap H-3).
//
// When the circuit-breaker freezes a campaign, an admin investigates and then:
//   - "unlock": concerns were unfounded; donations and payouts resume.
//   - "refund": misuse confirmed; everything still in escrow is returned to
//               donors pro-rata, and the campaign is suspended.
// Both are recorded on the campaign (disputeGovernance.resolution) and in the
// admin audit trail; refunds also appear on the public ledger.

const mongoose = require("mongoose");
const { Campaign } = require("../models/campaignModel");
const { proRataRefundCampaign } = require("../services/refunds");
const { recordAdminAction } = require("../services/activityLog");
const logger = require("../utility/logger");

const adminName = (req) =>
  req.admin ? `${req.admin.firstName || ""} ${req.admin.lastName || ""}`.trim() || "Admin" : "Admin";

exports.listFrozenCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ "disputeGovernance.isLocked": true })
      .select("basicInformation.campaignTitle organizerId funding.currency funding.amountRaised funding.availableBalance disputeGovernance")
      .sort({ "disputeGovernance.lockedAt": -1 })
      .limit(100)
      .maxTimeMS(3000);
    return res.status(200).json({ data: campaigns });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.resolveDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const action = String(req.body?.action || "");
    const note = String(req.body?.note || "").trim().slice(0, 1000);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid Campaign ID" });
    }
    if (!["unlock", "refund"].includes(action)) {
      return res.status(400).json({ status: 400, error: 'action must be "unlock" or "refund"' });
    }
    if (note.length < 10) {
      return res.status(400).json({ status: 400, error: "Explain the decision in a note (at least 10 characters)." });
    }

    const campaign = await Campaign.findById(id).select("disputeGovernance funding").maxTimeMS(3000);
    if (!campaign) return res.status(404).json({ status: 404, error: "Campaign not found" });
    if (!campaign.disputeGovernance?.isLocked) {
      return res.status(409).json({ status: 409, error: "This campaign is not frozen." });
    }

    const resolution = {
      action,
      note,
      adminId: String(req.admin?._id || ""),
      adminName: adminName(req),
      resolvedAt: new Date(),
      refundedAmount: 0,
    };

    if (action === "unlock") {
      await Campaign.updateOne(
        { _id: id, "disputeGovernance.isLocked": true },
        { $set: { "disputeGovernance.isLocked": false, "disputeGovernance.resolution": resolution } }
      );
      recordAdminAction(req, "resolveDispute:unlock", { targetType: "campaign", targetId: id, campaignId: id, details: { note } });
      return res.status(200).json({ status: 200, data: { action, resolution } });
    }

    // Refund: suspend first so nothing new comes in, keep the escrow locked,
    // then return what's left pro-rata.
    await Campaign.updateOne({ _id: id }, { $set: { suspended: true } });
    const summary = await proRataRefundCampaign(id, {
      requestedBy: "dispute",
      actor: { id: req.admin?._id, name: adminName(req) },
      reason: `Dispute upheld: ${note}`,
    });
    resolution.refundedAmount = summary.totalRefunded;
    await Campaign.updateOne({ _id: id }, { $set: { "disputeGovernance.resolution": resolution } });
    recordAdminAction(req, "resolveDispute:refund", {
      targetType: "campaign",
      targetId: id,
      campaignId: id,
      details: { note, totalRefunded: summary.totalRefunded, refunded: summary.refunded.length, failed: summary.failed.length },
    });
    // 207 when some gateway refunds failed: they stay retryable via the batch refund.
    const status = summary.failed.length ? 207 : 200;
    return res.status(status).json({ status, data: { action, resolution, summary } });
  } catch (error) {
    logger.error({ err: error });
    return res.status(error.status || 500).json({ status: error.status || 500, error: error.status ? error.message : "Server error." });
  }
};
