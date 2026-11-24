const isEmail = require("../../utility/isEmail");
// Paystack donation flow: initialization, redirect callback, webhook.
const { default: axios } = require("axios");
const { FROZEN_MESSAGE } = require("../../utility/campaignState");
const crypto = require("crypto");

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
  splitTotal,
  prepareExtras,
  saveExtras,
} = require("./shared");
const { getClientIp, assessDonation, withCardSignals, FLAG_THRESHOLD } = require("../../utility/fraud");

// Fraud snapshot for a confirmed Paystack payment: the score taken at
// initialisation plus card signals from the gateway.
function paystackFraud(metadata, txData) {
  const score = Number(metadata.fraudScore || 0);
  return withCardSignals(
    {
      score,
      reasons: String(metadata.fraudReasons || "").split("|").filter(Boolean),
      flagged: score >= FLAG_THRESHOLD,
      ip: metadata.fraudIp || "",
      assessedAt: new Date(),
    },
    "paystack",
    txData,
    metadata.donorEmail
  );
}
const { notifyTargetReachedIfNeeded } = require("../../services/targetReached");

const PAYSTACK_BASE = "https://api.paystack.co";
const paystackSecret = () => process.env.PAYSTACK_SECRET;

const paystackHeaders = () => ({
  Authorization: `Bearer ${paystackSecret()}`,
  "Content-Type": "application/json",
});

// Supported currencies that Paystack accepts directly.
// All amounts must be in the smallest unit (kobo / pesewas / cents).
const PAYSTACK_CURRENCIES = ["NGN", "GHS", "ZAR", "KES", "USD"];

/**
 * Initialize a Paystack transaction and return the authorization URL.
 * POST /api/donations/initializePaystack/:campaignId
 */
exports.initializePaystackPayment = async (req, res) => {
  try {
    if (!paystackSecret()) {
      return res.status(503).json({ status: 503, error: "Paystack is not configured" });
    }

    const campaign = await Campaign.findOne({
      _id: req.params.id,
      launched: true,
      suspended: false,
    }).maxTimeMS(3000);
    if (!campaign) {
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }
    // Dispute freeze: don't take new money into a campaign under review.
    if (campaign.disputeGovernance?.isLocked) {
      return res.status(423).json({ status: 423, code: "campaign_frozen", error: FROZEN_MESSAGE });
    }

    // Contract shared by every gateway (shared.resolveCheckout): `amount` is the
    // TOTAL the donor pays = donation + optional tip + card fee; the campaign
    // is credited the donation only.
    const currency = checkoutCurrency(campaign, req.body.currency);
    if (!currency) return currencyMismatch(res, campaign);
    let co, extras;
    try {
      co = resolveCheckout(req, "paystack", currency);
      extras = await prepareExtras(req.body.meta, campaign);
    } catch (err) {
      return checkoutError(res, err);
    }
    const { tip } = co;
    if (!PAYSTACK_CURRENCIES.includes(currency)) {
      return res.status(400).json({ status: 400, error: `Paystack does not support ${currency}. Supported: ${PAYSTACK_CURRENCIES.join(", ")}` });
    }
    if (req.body.customer?.email && !isEmail(req.body.customer.email)) {
      return res.status(400).json({ status: 400, error: "Invalid donor email" });
    }

    const txRef = req.body.tx_ref || `fundandtrace-ps-${Date.now()}`;
    const donation = co.donation;
    const totalAmount = Math.round(co.total * 100); // Paystack expects smallest currency unit
    // Mobile money (M-PESA, MoMo): open Paystack straight on that channel.
    const channels = co.method === "mpesa" || co.method === "mobilemoney" ? ["mobile_money"] : undefined;
    const callbackUrl = `${process.env.BACKENDURL || "http://localhost:5000"}/api/donations/paystack/${req.params.id}`;

    // Fraud snapshot rides through transaction metadata to the recorder.
    const fraud = await assessDonation({
      email: req.body.customer?.email,
      campaignId: req.params.id,
      ip: getClientIp(req),
    });

    const resp = await axios.post(
      `${PAYSTACK_BASE}/transaction/initialize`,
      {
        email: req.body.customer?.email,
        amount: totalAmount,
        currency,
        reference: txRef,
        callback_url: callbackUrl,
        ...(channels ? { channels } : {}),
        metadata: {
          campaignId: req.params.id,
          donorEmail: req.body.customer?.email,
          donorName: req.body.customer?.name,
          amount: String(donation), // what the campaign receives
          tip: String(tip),
          fee: String(co.fee), // card/processing fee added to the donor's total
          method: co.method,
          paymentMethod: "paystack",
          paymentOption: "card",
          zipCode: req.body.meta?.zipCode || "",
          anonymous: String(Boolean(req.body.meta?.anonymous)),
          referralCode: String(req.body.meta?.referralCode || "").slice(0, 64),
          fraudScore: String(fraud.score),
          fraudReasons: fraud.reasons.join("|").slice(0, 500),
          fraudIp: fraud.ip,
        },
      },
      { headers: paystackHeaders() }
    );

    if (!resp.data?.status || !resp.data?.data?.authorization_url) {
      return res.status(502).json({ status: 502, error: "Paystack initialization failed" });
    }

    await saveExtras(`paystack:${resp.data.data.reference || txRef}`, campaign._id, extras);
    if (req.body.customer?.email) {
      addActivity("initializeDonation", req.body.customer.email);
    }

    return res.status(200).json({
      authorizationUrl: resp.data.data.authorization_url,
      reference: resp.data.data.reference,
      accessCode: resp.data.data.access_code,
    });
  } catch (error) {
    logger.error({ err: error.response?.data || error }, "Paystack initialization failed");
    return res.status(500).json({ status: 500, error: "Payment initialization failed" });
  }
};

/**
 * Paystack callback — verify the transaction and record the donation.
 * GET /api/donations/paystack/:campaignId?reference=...&trxref=...
 */
exports.paymentPaystack = async (req, res) => {
  try {
    if (!paystackSecret()) {
      return res.redirect(`${process.env.MAINURL || "http://localhost:3000"}/?status=payment_unavailable`);
    }

    const reference = req.query.reference || req.query.trxref;
    if (!reference) {
      return res.redirect(`${process.env.MAINURL || "http://localhost:3000"}/donate/${req.params.id}?status=failed`);
    }

    const resp = await axios.get(
      `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: paystackHeaders() }
    );

    const txData = resp.data?.data;
    if (!resp.data?.status || txData?.status !== "success") {
      return res.redirect(`${process.env.MAINURL || "http://localhost:3000"}/donate/${req.params.id}?status=failed`);
    }

    const metadata = txData.metadata || {};
    if (String(metadata.campaignId) !== String(req.params.id)) {
      return res.redirect(`${process.env.MAINURL || "http://localhost:3000"}/donate/${req.params.id}?status=failed`);
    }

    // Idempotency guard: prevent duplicate recording and double-crediting
    const existingDonation = await Donations.findOne({
      $or: [
        { transactionId: reference },
        { transactionRef: reference },
      ],
    });

    if (existingDonation) {
      const donatedAmount = Number(metadata.amount || 0);
      return res.redirect(
        `${process.env.MAINURL || "http://localhost:3000"}/donated/${metadata.campaignId}?status=successful&name=${encodeURIComponent(metadata.donorName || "Donor")}&amount=${donatedAmount}&email=${encodeURIComponent(metadata.donorEmail || "")}&campaignId=${metadata.campaignId}&anonymous=${metadata.anonymous || "false"}`
      );
    }

    // Verify amount matches (Paystack returns amount in smallest unit):
    // total = donation + tip + fee.
    const split = splitTotal({
      total: (txData.amount || 0) / 100,
      donation: Number(metadata.amount || 0),
      tip: Number(metadata.tip || 0),
      fee: Number(metadata.fee || 0),
    });
    const donatedAmount = split.donation;
    const { tip, fee } = split;
    if (!split.ok) {
      return res.redirect(`${process.env.MAINURL || "http://localhost:3000"}/donate/${req.params.id}?status=failed`);
    }

    const donation = new Donations({
      campaignId: req.params.id,
      donorEmail: metadata.donorEmail,
      donorName: metadata.donorName || txData.customer?.first_name || "Donor",
      amount: donatedAmount,
      transactionId: reference,
      transactionRef: reference,
      tip,
      processingFee: fee,
      paymentMethod: "paystack",
      paymentOption: txData.channel || "card",
      zipCode: metadata.zipCode || "",
      createdAt: txData.paid_at || Date.now(),
      anonymous: metadata.anonymous === "true",
      referralCode: String(metadata.referralCode || ""),
      fraud: await paystackFraud(metadata, txData),
    });

    await donation.save();
    addActivity("donation", metadata.donorEmail);

    const campaign = await Campaign.findById(req.params.id);
    if (campaign) {
      await sendDonationMailSafely(
        { email: metadata.donorEmail, name: metadata.donorName },
        campaign,
        donatedAmount
      );

      await creditCampaign(campaign._id, donatedAmount, {
        refId: `paystack:${reference}`,
        currency: txData.currency,
      });
      notifyTargetReachedIfNeeded(campaign._id);
    }

    return res.redirect(
      `${process.env.MAINURL || "http://localhost:3000"}/donated/${req.params.id}?status=successful&name=${encodeURIComponent(metadata.donorName || "Donor")}&amount=${donatedAmount}&email=${encodeURIComponent(metadata.donorEmail || "")}&campaignId=${req.params.id}&anonymous=${metadata.anonymous || "false"}`
    );
  } catch (error) {
    logger.error({ err: error.response?.data || error }, "Paystack verification failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

/**
 * Paystack webhook handler for server-side payment confirmation.
 * POST /api/donations/paystack-webhook
 */
exports.paystackWebhook = async (req, res) => {
  try {
    if (!paystackSecret()) {
      return res.status(503).json({ status: 503, error: "Paystack is not configured" });
    }

    // Verify the HMAC-SHA512 signature over the RAW request body (captured in
    // server.js). Re-serialising the parsed JSON can differ byte-for-byte from
    // what Paystack signed (unicode escapes, number formats), which would
    // reject genuine payment events.
    const raw = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const hash = crypto.createHmac("sha512", paystackSecret()).update(raw).digest("hex");
    const provided = String(req.headers["x-paystack-signature"] || "");

    if (provided.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(hash))) {
      return res.status(401).json({ status: 401, error: "Invalid webhook signature" });
    }

    const event = req.body;

    // Bank payout outcome (services/payoutRails.js). Same signed endpoint.
    if (["transfer.success", "transfer.failed", "transfer.reversed"].includes(event.event) && event.data?.reference) {
      const { applyTransferOutcome } = require("./payout");
      await applyTransferOutcome({ reference: event.data.reference, status: event.event.split(".")[1] });
      return res.status(200).json({ received: true });
    }

    if (event.event !== "charge.success") {
      return res.status(200).json({ received: true });
    }

    const txData = event.data;
    const metadata = txData.metadata || {};
    const campaignId = metadata.campaignId;

    if (!campaignId || txData.status !== "success") {
      return res.status(200).json({ received: true });
    }

    // Idempotency guard
    const existingDonation = await Donations.findOne({
      $or: [
        { transactionId: txData.reference },
        { transactionRef: txData.reference },
      ],
    });
    if (existingDonation) return res.status(200).json({ received: true });

    const split = splitTotal({
      total: (txData.amount || 0) / 100,
      donation: Number(metadata.amount || 0),
      tip: Number(metadata.tip || 0),
      fee: Number(metadata.fee || 0),
    });
    const donatedAmount = split.donation;
    const { tip, fee } = split;
    if (!split.ok) {
      return res.status(400).json({ status: 400, error: "Invalid donation amount" });
    }

    const campaign = await Campaign.findOne({
      _id: campaignId,
      launched: true,
      suspended: false,
    }).maxTimeMS(3000);
    if (!campaign) {
      return res.status(400).json({ status: 400, error: "Campaign not found" });
    }

    try {
      await Donations.create({
        campaignId,
        donorEmail: metadata.donorEmail,
        donorName: metadata.donorName || txData.customer?.first_name || "Donor",
        amount: donatedAmount,
        transactionId: txData.reference,
        transactionRef: txData.reference,
        tip,
        processingFee: fee,
        paymentMethod: "paystack",
        paymentOption: txData.channel || "card",
        zipCode: metadata.zipCode || "",
        createdAt: txData.paid_at || Date.now(),
        anonymous: metadata.anonymous === "true",
        referralCode: String(metadata.referralCode || ""),
        fraud: await paystackFraud(metadata, txData),
      });
    } catch (createError) {
      // Concurrent duplicate delivery — already recorded, ack quietly.
      if (createError && createError.code === 11000) {
        return res.status(200).json({ received: true });
      }
      throw createError;
    }

    await creditCampaign(campaign._id, donatedAmount, {
      refId: `paystack:${txData.reference}`,
      currency: txData.currency,
    });
    notifyTargetReachedIfNeeded(campaign._id);

    await sendDonationMailSafely(
      { email: metadata.donorEmail, name: metadata.donorName },
      campaign,
      donatedAmount
    );

    addActivity("donation", metadata.donorEmail);
    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error({ err: error }, "Paystack webhook failed");
    return res.status(500).json({ status: 500, error: "Webhook processing error" });
  }
};
