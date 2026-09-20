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

// Atomic campaign credit — never read-modify-write, so concurrent webhooks
// and callbacks cannot lose updates.
const creditCampaign = (campaignId, amount) =>
  Campaign.updateOne(
    { _id: campaignId },
    { $inc: { "funding.amountRaised": amount, "funding.availableBalance": amount } }
  );

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
