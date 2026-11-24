// Donor self-service refunds (docs/SELF_SERVICE_REFUNDS.md, gap I-2).
const mongoose = require("mongoose");
const { Donations } = require("../../models/donationsModel");
const { Campaign } = require("../../models/campaignModel");
const { refundDonation, RefundError, gatewayOf } = require("../../services/refunds");
const { addActivity } = require("../../services/activityLog");
const logger = require("../../utility/logger");

const DAY = 24 * 60 * 60 * 1000;
const enabled = () => process.env.ENABLE_SELF_REFUNDS === "true";
const windowDays = () => Number(process.env.REFUND_WINDOW_DAYS || 30);

/** Pure eligibility check — returns null when eligible, else {code, message}. */
function checkEligibility({ donation, campaign, authEmail, now = new Date() }) {
  if (!donation) return { code: "not_found", message: "Donation not found" };
  if (!authEmail || String(donation.donorEmail || "").toLowerCase() !== String(authEmail).toLowerCase()) {
    return { code: "not_owner", message: "You can only refund your own donations" };
  }
  const status = donation.refund?.status || "";
  if (status && status !== "failed") return { code: "already_refunded", message: "This donation has already been refunded" };
  if (now - new Date(donation.createdAt) > windowDays() * DAY) {
    return { code: "window_closed", message: `Donations can be refunded within ${windowDays()} days. Contact support for older donations.` };
  }
  if (gatewayOf(donation) === "unknown") return { code: "not_refundable", message: "This payment method can't be refunded automatically" };
  if (!campaign) return { code: "not_found", message: "Campaign not found" };
  if (campaign.disputeGovernance?.isLocked) {
    return { code: "campaign_frozen", message: "This campaign is under dispute review; refunds are handled by our team." };
  }
  if (Number(campaign.funding?.availableBalance || 0) < Number(donation.amount || 0)) {
    return { code: "insufficient_escrow", message: "These funds have already been disbursed to the cause and can't be refunded automatically." };
  }
  return null;
}

exports.checkEligibility = checkEligibility;

exports.refundPolicy = (req, res) =>
  res.status(200).json({ data: { enabled: enabled(), windowDays: windowDays() } });

exports.requestRefund = async (req, res) => {
  try {
    if (!enabled()) {
      return res.status(403).json({ status: 403, code: "disabled", error: "Self-service refunds aren't available yet. Please contact support." });
    }
    const { donationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(donationId)) {
      return res.status(400).json({ status: 400, error: "Invalid donation ID" });
    }
    const donation = await Donations.findById(donationId).maxTimeMS(3000);
    const campaign = donation
      ? await Campaign.findById(donation.campaignId).select("disputeGovernance funding").maxTimeMS(3000)
      : null;
    const problem = checkEligibility({ donation, campaign, authEmail: req.auth?.email });
    if (problem) {
      const status = problem.code === "not_found" ? 404 : problem.code === "not_owner" ? 403 : 409;
      return res.status(status).json({ status, code: problem.code, error: problem.message });
    }
    const result = await refundDonation({
      donationId,
      includeTip: true,
      requestedBy: "donor",
      reason: String(req.body?.reason || "Donor requested refund").slice(0, 500),
    });
    addActivity("donorRefund", req.auth.email).catch(() => {});
    return res.status(202).json({ status: 202, data: result });
  } catch (error) {
    if (error instanceof RefundError) {
      return res.status(error.status).json({ status: error.status, code: error.code, error: error.message });
    }
    logger.error({ err: error }, "self refund failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
