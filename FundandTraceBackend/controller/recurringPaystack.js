// Monthly giving on Paystack (NGN, GHS, KES, ZAR, USD).
//
// Each subscription gets its own Paystack plan whose amount is the donation
// plus the card fee (passed on at cost, as on one-off Paystack gifts). The
// first charge goes through the normal signed charge.success webhook with
// our metadata; renewals arrive as charge.success carrying the plan code and
// are matched to the Subscription here (handlePaystackSubscriptionEvent).
const { default: axios } = require("axios");
const isEmail = require("../utility/isEmail");
const { FROZEN_MESSAGE } = require("../utility/campaignState");
const { Subscription } = require("../models/subscriptionModel");
const { getClientIp, assessDonation, FLAG_THRESHOLD } = require("../utility/fraud");
const {
  Campaign,
  Donations,
  addActivity,
  logger,
  creditCampaign,
  checkoutCurrency,
  currencyMismatch,
  sendDonationMailSafely,
  resolveCheckout,
  checkoutError,
} = require("./donations/shared");

const BASE = "https://api.paystack.co";
const CURRENCIES = ["NGN", "GHS", "ZAR", "KES", "USD"];
const headers = () => ({ Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`, "Content-Type": "application/json" });
const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

// POST /api/recurring/paystack/:id  (body: same shape as a one-off Paystack checkout, tip 0)
exports.createPaystackSubscription = async (req, res) => {
  try {
    if (!process.env.PAYSTACK_SECRET) return res.status(503).json({ status: 503, error: "Paystack is not configured" });
    const campaign = await Campaign.findOne({ _id: req.params.id, launched: true, suspended: false }).maxTimeMS(3000);
    if (!campaign) return res.status(404).json({ status: 404, error: "Campaign not found" });
    if (campaign.disputeGovernance?.isLocked) return res.status(423).json({ status: 423, code: "campaign_frozen", error: FROZEN_MESSAGE });

    const currency = checkoutCurrency(campaign, req.body.currency);
    if (!currency) return currencyMismatch(res, campaign);
    if (!CURRENCIES.includes(currency)) return res.status(400).json({ status: 400, error: `Monthly giving on Paystack isn't available in ${currency}` });
    let co;
    try {
      co = resolveCheckout(req, "paystack", currency);
    } catch (err) {
      return checkoutError(res, err);
    }
    if (co.tip !== 0) return res.status(400).json({ status: 400, error: "Tips can't be added to monthly gifts; set tip to 0" });
    const email = String(req.body.customer?.email || "").trim();
    if (!isEmail(email)) return res.status(400).json({ status: 400, error: "Valid donor email required for monthly giving" });

    const fraud = await assessDonation({ email, campaignId: req.params.id, ip: getClientIp(req) });
    const title = String(campaign.basicInformation?.campaignTitle || "campaign").slice(0, 60);
    const { data: planResp } = await axios.post(
      `${BASE}/plan`,
      { name: `Fund&Trace monthly: ${title}`, amount: Math.round(co.total * 100), interval: "monthly", currency, description: `Donation ${co.donation} + card fee ${co.fee}` },
      { headers: headers(), timeout: 10000 }
    );
    const planCode = planResp?.data?.plan_code;
    if (!planCode) return res.status(502).json({ status: 502, error: "Paystack couldn't set up the monthly plan" });

    const sub = await Subscription.create({
      campaignId: campaign._id,
      subscriberEmail: email.toLowerCase(),
      subscriberName: String(req.body.customer?.name || "").slice(0, 120),
      amount: co.donation,
      processingFee: co.fee,
      tip: 0,
      currency: currency.toLowerCase(),
      interval: "month",
      anonymous: Boolean(req.body.meta?.anonymous),
      referralCode: String(req.body.meta?.referralCode || "").slice(0, 64),
      gateway: "paystack",
      paystackPlanCode: planCode,
      status: "incomplete",
      fraudSnapshot: { score: fraud.score, reasons: fraud.reasons, ip: fraud.ip },
    });

    const reference = `fundandtrace-psm-${sub._id}`;
    const { data } = await axios.post(
      `${BASE}/transaction/initialize`,
      {
        email,
        amount: Math.round(co.total * 100),
        currency,
        plan: planCode,
        reference,
        callback_url: `${process.env.MAINURL || "http://localhost:3000"}/donated/${req.params.id}?status=subscription_started`,
        metadata: {
          campaignId: String(campaign._id),
          subscriptionId: String(sub._id),
          donorEmail: email,
          donorName: req.body.customer?.name || "",
          amount: String(co.donation),
          tip: "0",
          fee: String(co.fee),
          paymentMethod: "paystack",
          recurring: "true",
          anonymous: String(Boolean(req.body.meta?.anonymous)),
          referralCode: String(req.body.meta?.referralCode || "").slice(0, 64),
          fraudScore: String(fraud.score),
          fraudReasons: fraud.reasons.join("|").slice(0, 500),
          fraudIp: fraud.ip,
        },
      },
      { headers: headers(), timeout: 10000 }
    );
    if (!data?.data?.authorization_url) return res.status(502).json({ status: 502, error: "Paystack initialization failed" });
    addActivity("initializeRecurringDonation", email);
    return res.status(200).json({ authorizationUrl: data.data.authorization_url, reference });
  } catch (error) {
    logger.error({ err: error.response?.data || error }, "Paystack subscription init failed");
    return res.status(500).json({ status: 500, error: "Payment initialization failed" });
  }
};

/**
 * Subscription events from the signed Paystack webhook.
 * Returns true when the event was handled here (the caller then acks).
 */
exports.handlePaystackSubscriptionEvent = async (event) => {
  const d = event?.data || {};
  const planCode = d.plan?.plan_code || d.plan_code || (typeof d.plan === "string" ? d.plan : "");

  if (event.event === "subscription.create" && planCode) {
    await Subscription.updateOne(
      { gateway: "paystack", paystackPlanCode: planCode },
      {
        $set: {
          paystackSubscriptionCode: d.subscription_code || "",
          paystackEmailToken: d.email_token || "",
          nextPaymentDate: d.next_payment_date ? new Date(d.next_payment_date) : null,
          status: "active",
        },
      }
    );
    return true;
  }
  if (["subscription.disable", "subscription.not_renew"].includes(event.event)) {
    const code = d.subscription_code;
    if (code) {
      await Subscription.updateOne(
        { gateway: "paystack", paystackSubscriptionCode: code },
        { $set: { status: event.event === "subscription.disable" ? "canceled" : "canceling", canceledAt: new Date() } }
      );
    }
    return true;
  }
  if (event.event === "invoice.payment_failed") {
    const code = d.subscription?.subscription_code || d.subscription_code;
    if (code) await Subscription.updateOne({ gateway: "paystack", paystackSubscriptionCode: code }, { $set: { status: "past_due" } });
    return true;
  }

  // Renewal charge: a successful charge on one of our plans. The first charge
  // carries our metadata and is recorded by the normal path, which then calls
  // markFirstCharge; renewals usually don't, so they're recorded here.
  if (event.event === "charge.success" && planCode && d.status === "success" && !d.metadata?.campaignId) {
    const sub = await Subscription.findOne({ gateway: "paystack", paystackPlanCode: planCode });
    if (!sub) return false;
    if (String(d.customer?.email || "").toLowerCase() !== String(sub.subscriberEmail).toLowerCase()) {
      logger.error({ planCode, reference: d.reference }, "Paystack renewal email doesn't match the subscription; not credited");
      return true;
    }
    if (await Donations.findOne({ $or: [{ transactionId: d.reference }, { transactionRef: d.reference }] })) return true;
    const charged = round2((d.amount || 0) / 100);
    const expected = round2(Number(sub.amount) + Number(sub.processingFee || 0));
    if (Math.abs(charged - expected) > 0.01 || String(d.currency || "").toUpperCase() !== String(sub.currency).toUpperCase()) {
      logger.error({ planCode, reference: d.reference, charged, expected }, "Paystack renewal amount/currency mismatch; not credited");
      return true;
    }
    const campaign = await Campaign.findOne({ _id: sub.campaignId, launched: true, suspended: false }).maxTimeMS(3000);
    if (!campaign) {
      logger.warn({ planCode, reference: d.reference }, "Paystack renewal for an unavailable campaign; not credited (refund it)");
      return true;
    }
    const { withCardSignals } = require("../utility/fraud");
    const snap = sub.fraudSnapshot || {};
    try {
      await Donations.create({
        campaignId: sub.campaignId,
        donorEmail: sub.subscriberEmail,
        donorName: sub.subscriberName || "Donor",
        amount: sub.amount,
        tip: 0,
        processingFee: sub.processingFee || 0,
        transactionId: d.reference,
        transactionRef: d.reference,
        paymentMethod: "paystack",
        paymentOption: d.channel || "card",
        createdAt: d.paid_at || Date.now(),
        anonymous: sub.anonymous,
        referralCode: sub.referralCode || "",
        fraud: await withCardSignals(
          { score: snap.score || 0, reasons: snap.reasons || [], flagged: (snap.score || 0) >= FLAG_THRESHOLD, ip: snap.ip || "", assessedAt: new Date() },
          "paystack",
          d,
          sub.subscriberEmail
        ),
      });
    } catch (err) {
      if (err?.code === 11000) return true;
      throw err;
    }
    await creditCampaign(sub.campaignId, sub.amount, { refId: `paystack:${d.reference}`, currency: d.currency, memo: "Recurring donation" });
    require("../services/targetReached").notifyTargetReachedIfNeeded(sub.campaignId);
    await Subscription.updateOne({ _id: sub._id }, { $inc: { totalDonated: sub.amount }, $set: { status: "active" } });
    addActivity("recurringDonation", sub.subscriberEmail);
    await sendDonationMailSafely({ email: sub.subscriberEmail, name: sub.subscriberName }, campaign, sub.amount);
    return true;
  }
  return false;
};

/** After the normal webhook records a first charge that belongs to a plan. */
exports.markFirstCharge = async (metadata, amount) => {
  if (!metadata?.subscriptionId) return;
  await Subscription.updateOne({ _id: metadata.subscriptionId, gateway: "paystack" }, { $set: { status: "active" }, $inc: { totalDonated: Number(amount) || 0 } }).catch(
    (err) => logger.warn({ err }, "Couldn't mark Paystack subscription active")
  );
};

/** Cancel a Paystack subscription (donor-initiated). */
exports.disablePaystackSubscription = async (sub) => {
  const full = await Subscription.findById(sub._id).select("+paystackEmailToken");
  if (!full?.paystackSubscriptionCode || !full.paystackEmailToken) {
    const err = new Error("This monthly gift is still being set up. Try again in a few minutes.");
    err.status = 409;
    throw err;
  }
  await axios.post(`${BASE}/subscription/disable`, { code: full.paystackSubscriptionCode, token: full.paystackEmailToken }, { headers: headers(), timeout: 10000 });
};
