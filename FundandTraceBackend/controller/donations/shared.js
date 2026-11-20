// Shared dependencies and helpers for the donation controllers.
const { Campaign } = require("../../models/campaignModel");
const { Donations } = require("../../models/donationsModel");
const { FundingRequests } = require("../../models/fundingRequestModel");
const { addActivity } = require("../../services/activityLog");
const { donationMailService } = require("../../services/donation");
const logger = require("../../utility/logger");

// Same lazy pattern as before: a single Stripe client when configured.
const stripe = process.env.STRIPESECRET
  ? require("stripe")(process.env.STRIPESECRET)
  : null;

const { appendEntry } = require("../../services/ledger");

// Atomic campaign credit — never read-modify-write, so concurrent webhooks
// and callbacks cannot lose updates. `ref` is the gateway reference; it keys
// the public ledger entry so a replayed webhook can't double-record.
const creditCampaign = async (campaignId, amount, ref = {}) => {
  const result = await Campaign.updateOne(
    { _id: campaignId },
    { $inc: { "funding.amountRaised": amount, "funding.availableBalance": amount } }
  );
  if (ref.refId) {
    await appendEntry({
      campaignId,
      type: "credit",
      amount,
      currency: ref.currency,
      refId: ref.refId,
      memo: ref.memo || "Donation",
    });
  } else {
    logger.warn({ campaignId }, "creditCampaign called without a ledger refId");
  }
  return result;
};

// Best-effort donor email; a mail outage must never fail a recorded donation.
const sendDonationMailSafely = async (donor, campaign, amount) => {
  if (!campaign || !donor?.email) return;
  try {
    await donationMailService(donor, campaign, amount);
  } catch (err) {
    logger.warn({ err }, "Donation mail service failed");
  }
};

module.exports = {
  stripe,
  Campaign,
  Donations,
  FundingRequests,
  addActivity,
  logger,
  creditCampaign,
  sendDonationMailSafely,
};
