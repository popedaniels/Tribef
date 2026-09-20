// Paystack donation flow: initialization, redirect callback, webhook.
const { default: axios } = require("axios");
const crypto = require("crypto");

const {
  Campaign,
  Donations,
  addActivity,
  logger,
  creditCampaign,
  sendDonationMailSafely,
} = require("./shared");
const { getClientIp, assessDonation } = require("../../utility/fraud");
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

    const amount = Number(req.body.amount);
    const tip = Number(req.body.meta?.tip || 0);
    const currency = String(req.body.currency || campaign.funding.currency || "NGN").toUpperCase();
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) {
      return res.status(400).json({ status: 400, error: "Invalid donation amount" });
    }
    if (!Number.isFinite(tip) || tip < 0 || tip > amount) {
      return res.status(400).json({ status: 400, error: "Invalid tip amount" });
    }
    if (!PAYSTACK_CURRENCIES.includes(currency)) {
      return res.status(400).json({ status: 400, error: `Paystack does not support ${currency}. Supported: ${PAYSTACK_CURRENCIES.join(", ")}` });
    }
    if (req.body.customer?.email && !/^\S+@\S+\.\S+$/.test(req.body.customer.email)) {
      return res.status(400).json({ status: 400, error: "Invalid donor email" });
    }

    const txRef = req.body.tx_ref || `fundandtrace-ps-${Date.now()}`;
    const totalAmount = Math.round((amount + tip) * 100); // Paystack expects smallest currency unit
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
        metadata: {
          campaignId: req.params.id,
          donorEmail: req.body.customer?.email,
          donorName: req.body.customer?.name,
          amount: String(amount),
          tip: String(tip),
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

    const donatedAmount = Number(metadata.amount || 0);
    const tip = Number(metadata.tip || 0);

    // Verify amount matches (Paystack returns amount in smallest unit)
    const verifiedAmount = (txData.amount || 0) / 100;
    if (!Number.isFinite(donatedAmount) || donatedAmount <= 0 ||
        Math.abs(verifiedAmount - (donatedAmount + tip)) > 1) {
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
      paymentMethod: "paystack",
      paymentOption: txData.channel || "card",
      zipCode: metadata.zipCode || "",
      createdAt: txData.paid_at || Date.now(),
      anonymous: metadata.anonymous === "true",
      referralCode: String(metadata.referralCode || ""),
      fraud: {
        score: Number(metadata.fraudScore || 0),
        reasons: String(metadata.fraudReasons || "").split("|").filter(Boolean),
        flagged: Number(metadata.fraudScore || 0) >= 50,
        ip: metadata.fraudIp || "",
        assessedAt: new Date(),
      },
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

      await creditCampaign(campaign._id, donatedAmount);
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

    // Verify webhook signature using HMAC SHA512
    const hash = crypto
      .createHmac("sha512", paystackSecret())
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).json({ status: 401, error: "Invalid webhook signature" });
    }

    const event = req.body;
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

    const donatedAmount = Number(metadata.amount || 0);
    const tip = Number(metadata.tip || 0);
    const verifiedAmount = (txData.amount || 0) / 100;

    if (!Number.isFinite(donatedAmount) || donatedAmount <= 0 ||
        Math.abs(verifiedAmount - (donatedAmount + tip)) > 1) {
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
        paymentMethod: "paystack",
        paymentOption: txData.channel || "card",
        zipCode: metadata.zipCode || "",
        createdAt: txData.paid_at || Date.now(),
        anonymous: metadata.anonymous === "true",
        referralCode: String(metadata.referralCode || ""),
        fraud: {
          score: Number(metadata.fraudScore || 0),
          reasons: String(metadata.fraudReasons || "").split("|").filter(Boolean),
          flagged: Number(metadata.fraudScore || 0) >= 50,
          ip: metadata.fraudIp || "",
          assessedAt: new Date(),
        },
      });
    } catch (createError) {
      // Concurrent duplicate delivery — already recorded, ack quietly.
      if (createError && createError.code === 11000) {
        return res.status(200).json({ received: true });
      }
      throw createError;
    }

    await creditCampaign(campaign._id, donatedAmount);
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
