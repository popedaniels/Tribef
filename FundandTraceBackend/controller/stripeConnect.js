const mongoose = require("mongoose");
const { Campaign } = require("../models/campaignModel");
const logger = require("../utility/logger");

// Follows the same lazy pattern as controller/donations.js and identity.js.
const stripe = process.env.STRIPESECRET
  ? require("stripe")(process.env.STRIPESECRET)
  : null;

const getWebhookSecret = () => process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

/**
 * Stripe Express Connect onboarding + status for a campaign organizer.
 *
 * GET /api/stripeConnect/status/:campaignId
 *   Returns the Stripe Connect payout status for the campaign (owner only).
 */
exports.getConnectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid campaign ID" });
    }
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ status: 503, error: "Database unavailable" });
    }

    const campaign = await Campaign.findById(id).select("stripeConnect organizerId");
    if (!campaign) {
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }

    return res.status(200).json({
      status: 200,
      data: {
        accountId: campaign.stripeConnect?.accountId || "",
        payoutsEnabled: Boolean(campaign.stripeConnect?.payoutsEnabled),
        detailsSubmitted: Boolean(campaign.stripeConnect?.detailsSubmitted),
      },
    });
  } catch (error) {
    logger.error({ err: error }, "getConnectStatus failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

/**
 * Create (or refresh) the Stripe Express account for a campaign and return
 * the Account Link URL the organizer should be redirected to for onboarding.
 *
 * POST /api/stripeConnect/account/:campaignId
 * Body: { country?: "GB" | "US" | ... } — ISO-2 country for the account
 */
exports.createConnectAccount = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ status: 503, error: "Stripe is not configured" });
    }
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid campaign ID" });
    }
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ status: 503, error: "Database unavailable" });
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }
    // Ownership is enforced by requireCampaignOwner middleware, but defend
    // in-depth in case the route is reused without it later.
    const authUserId =
      req.auth?.id || req.auth?.profile?._id || req.auth?.userId;
    if (authUserId && String(campaign.organizerId) !== String(authUserId)) {
      return res.status(403).json({ status: 403, error: "Campaign ownership required" });
    }

    let accountId = campaign.stripeConnect?.accountId || "";

    if (!accountId) {
      const email =
        req.body.email ||
        campaign.team?.primaryContact?.email ||
        campaign.organizer ||
        "";
      const account = await stripe.accounts.create({
        type: "express",
        country: String(req.body.country || "GB").toUpperCase(),
        email,
        capabilities: { transfers: { requested: true } },
        business_type: "individual",
        business_profile: {
          url: process.env.MAINURL || "http://localhost:3000",
          product_description: "Fundraising via Fund&Trace",
        },
        metadata: {
          source: "fundandtrace-express",
          campaignId: String(campaign._id),
        },
      });
      accountId = account.id;
      campaign.stripeConnect.accountId = accountId;
      await campaign.save();
    }

    const returnUrl = `${process.env.MAINURL || "http://localhost:3000"}/dashboard/${id}/fundingRequest?stripe=return`;
    const refreshUrl = `${process.env.MAINURL || "http://localhost:3000"}/dashboard/${id}/fundingRequest?stripe=refresh`;

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return res.status(200).json({
      status: 200,
      data: { url: link.url, accountId },
    });
  } catch (error) {
    logger.error({ err: error.response?.data || error }, "createConnectAccount failed");
    return res.status(500).json({ status: 500, error: "Failed to create Stripe account" });
  }
};

/**
 * Stripe Connect webhook — sync account/payout status onto the campaign.
 *
 * POST /api/stripeConnect/webhook
 * Handles account.updated so payoutsEnabled reflects the organizer's real
 * onboarding progress without an admin needing to look anything up.
 */
exports.connectWebhook = async (req, res) => {
  try {
    const webhookSecret = getWebhookSecret();
    if (!stripe || !webhookSecret) {
      return res.status(503).json({ status: 503, error: "Stripe Connect webhook is not configured" });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers["stripe-signature"],
        webhookSecret
      );
    } catch (err) {
      return res.status(400).json({ status: 400, error: "Invalid webhook signature" });
    }

    if (event.type !== "account.updated") {
      return res.status(200).json({ received: true });
    }

    const account = event.data.object;
    if (!account?.id) {
      return res.status(200).json({ received: true });
    }

    const campaign = await Campaign.findOne({ "stripeConnect.accountId": account.id });
    if (!campaign) {
      // Not one of our campaigns — ack to stop Stripe retrying, log for
      // cross-checking if an account is ever orphaned.
      logger.warn({ accountId: account.id }, "Connect webhook for unknown account");
      return res.status(200).json({ received: true });
    }

    campaign.stripeConnect.payoutsEnabled = Boolean(
      account.payouts_enabled && account.charges_enabled
    );
    campaign.stripeConnect.detailsSubmitted = Boolean(account.details_submitted);
    campaign.stripeConnect.updatedAt = new Date();
    await campaign.save();

    logger.info(
      { campaignId: String(campaign._id), payoutsEnabled: campaign.stripeConnect.payoutsEnabled },
      "Stripe connect account status updated"
    );

    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error({ err: error }, "connectWebhook failed");
    return res.status(500).json({ status: 500, error: "Webhook processing error" });
  }
};