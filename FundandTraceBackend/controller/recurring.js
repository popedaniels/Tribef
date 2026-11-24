const isEmail = require("../utility/isEmail");
// Recurring (monthly) giving via Stripe Checkout subscription mode.
// Recording and crediting happen exclusively in the signed Stripe webhook
// (see donations/stripe.js), mirroring the one-time donation flow.
const { Campaign } = require("../models/campaignModel");
const { FROZEN_MESSAGE } = require("../utility/campaignState");
const { Subscription } = require("../models/subscriptionModel");
const { addActivity } = require("../services/activityLog");
const logger = require("../utility/logger");
const { getClientIp, assessDonation } = require("../utility/fraud");
const { stripe, checkoutCurrency, currencyMismatch } = require("./donations/shared");

const SUPPORTED_CURRENCIES = ["gbp", "usd", "ngn"];

// POST /api/recurring/subscribe/:campaignId
exports.createSubscriptionSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ status: 503, error: "Stripe is not configured" });
    }
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      launched: true,
      suspended: false,
    });
    if (!campaign) {
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }
    // Dispute freeze: don't take new money into a campaign under review.
    if (campaign.disputeGovernance?.isLocked) {
      return res.status(423).json({ status: 423, code: "campaign_frozen", error: FROZEN_MESSAGE });
    }

    const amount = Number(req.body.amount);
    const tip = Number(req.body.meta?.tip || 0);
    const charged = checkoutCurrency(campaign, req.body.currency);
    if (!charged) return currencyMismatch(res, campaign);
    const currency = charged.toLowerCase();
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
      return res.status(400).json({ status: 400, error: "Invalid donation amount" });
    }
    // Tips are a one-off concept; recurring plans charge the plan amount only.
    // Fail loudly rather than silently dropping the donor's tip.
    if (!Number.isFinite(tip) || tip !== 0) {
      return res.status(400).json({
        status: 400,
        error: "Tips cannot be applied to monthly donations; set tip to 0",
      });
    }
    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      return res.status(400).json({ status: 400, error: "Unsupported currency" });
    }
    const email = req.body.customer?.email;
    if (!email || !isEmail(email)) {
      return res.status(400).json({ status: 400, error: "Valid donor email required for monthly giving" });
    }

    // Fraud snapshot rides through gateway metadata to the webhook recorder.
    const fraud = await assessDonation({
      email,
      campaignId: req.params.id,
      ip: getClientIp(req),
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: Math.round(amount * 100),
            recurring: { interval: "month" },
            product_data: {
              name: `Monthly donation — ${req.body.customizations?.title || campaign.basicInformation.campaignTitle}`,
            },
          },
        },
      ],
      // Note: one-off tips are not supported on subscriptions with the
      // pinned Stripe API version — donors give the recurring amount only.
      subscription_data: {
        metadata: {
          campaignId: req.params.id,
          subscriberEmail: email,
          subscriberName: req.body.customer?.name || "",
          amount: String(amount),
          tip: String(tip),
          currency,
          anonymous: String(Boolean(req.body.meta?.anonymous)),
          referralCode: String(req.body.meta?.referralCode || "").slice(0, 64),
          fraudScore: String(fraud.score),
          fraudReasons: fraud.reasons.join("|").slice(0, 500),
          fraudIp: fraud.ip,
        },
      },
      client_reference_id: req.body.transactionRef || `fundandtrace-recur-${Date.now()}`,
      mode: "subscription",
      cancel_url: `${process.env.MAINURL || "http://localhost:3000"}/donate/${req.params.id}?status=failed`,
      success_url: `${process.env.MAINURL || "http://localhost:3000"}/donated/${req.params.id}?status=subscription_started`,
    });

    addActivity("initializeRecurringDonation", email);
    return res.status(200).json({ id: session.id });
  } catch (error) {
    logger.error({ err: error }, "createSubscriptionSession failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

// POST /api/recurring/cancel/:subscriptionId (requireAuth)
exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.subscriptionId);
    if (subscription && subscription.gateway !== "paystack" && !stripe) {
      return res.status(503).json({ status: 503, error: "Stripe is not configured" });
    }
    if (!subscription) {
      return res.status(404).json({ status: 404, error: "Subscription not found" });
    }

    const requesterEmail =
      (req.auth && req.auth.email) ||
      (req.auth && req.auth.profile && req.auth.profile.email);
    if (
      !requesterEmail ||
      subscription.subscriberEmail.toLowerCase() !== String(requesterEmail).toLowerCase()
    ) {
      return res.status(403).json({ status: 403, error: "Not your subscription" });
    }
    if (["canceled", "canceling"].includes(subscription.status)) {
      return res.status(409).json({ status: 409, error: "Subscription already canceled" });
    }

    if (subscription.gateway === "paystack") {
      // Paystack has no "cancel at period end": disabling stops future charges.
      try {
        await require("./recurringPaystack").disablePaystackSubscription(subscription);
      } catch (err) {
        return res.status(err.status || 502).json({ status: err.status || 502, error: err.status ? err.message : "Paystack couldn't cancel the subscription. Please try again." });
      }
      subscription.status = "canceled";
      subscription.canceledAt = new Date();
      await subscription.save();
      addActivity("cancelRecurringDonation", subscription.subscriberEmail);
      return res.status(200).json({ success: true, message: "Monthly gift cancelled" });
    }

    // Donor-friendly: keep donations flowing until the end of the paid period.
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    subscription.status = "canceling";
    subscription.canceledAt = new Date();
    await subscription.save();

    addActivity("cancelRecurringDonation", subscription.subscriberEmail);
    return res.status(200).json({ success: true, message: "Subscription cancels at period end" });
  } catch (error) {
    logger.error({ err: error }, "cancelSubscription failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

// GET /api/recurring/mine (requireAuth)
exports.mySubscriptions = async (req, res) => {
  try {
    const requesterEmail =
      (req.auth && req.auth.email) ||
      (req.auth && req.auth.profile && req.auth.profile.email);
    if (!requesterEmail) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    // Only what the donor needs to manage their giving; never fraud signals
    // (IP) or internal Stripe customer ids.
    const subs = await Subscription.find({
      subscriberEmail: requesterEmail,
    })
      .select("campaignId amount tip processingFee currency interval status totalDonated createdAt canceledAt anonymous gateway nextPaymentDate")
      .populate("campaignId", "basicInformation.campaignTitle basicInformation.campaignImage")
      .sort({ createdAt: -1 });
    return res.status(200).json({ data: subs });
  } catch (error) {
    logger.error({ err: error }, "mySubscriptions failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
