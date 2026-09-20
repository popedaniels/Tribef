// Flutterwave donation flow: initialization, redirect callback, webhook.
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
const { getClientIp, assessDonation, geoMismatchScore } = require("../../utility/fraud");
const { notifyTargetReachedIfNeeded } = require("../../services/targetReached");
const { FLAG_THRESHOLD } = require("../../utility/fraud");

// Rebuild the fraud assessment recorded with the donation, combining the
// initialization snapshot with any gateway-side signals (card country).
function buildFraudSnapshot(flwTx) {
  const meta = flwTx.meta || {};
  const geo = geoMismatchScore(meta.donorCountry, flwTx.customer?.country_code);
  const reasons = String(meta.fraudReasons || "").split("|").filter(Boolean);
  if (geo.reason) reasons.push(geo.reason);
  const score = Number(meta.fraudScore || 0) + geo.score;
  return {
    score,
    reasons,
    flagged: score >= FLAG_THRESHOLD,
    ip: meta.fraudIp || "",
    assessedAt: new Date(),
  };
}

exports.initializePayment = async (req, res, next) => {
  try {
    const payment = req.body.payment;
    const campaignId = payment?.meta?.campaignId;
    const amount = Number(payment?.amount);
    const campaign = await Campaign.findOne({
      _id: campaignId,
      launched: true,
      suspended: false,
    });
    if (!campaign || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ status: 400, error: "Invalid payment request" });
    }

    // Fraud snapshot rides through gateway metadata to the recorder.
    const fraud = await assessDonation({
      email: payment.customer?.email,
      campaignId,
      ip: getClientIp(req),
    });
    payment.meta = {
      ...(payment.meta || {}),
      referralCode: String(req.body?.referralCode || payment.meta?.referralCode || "").slice(0, 64),
      donorCountry: payment.meta?.country || "",
      fraudScore: String(fraud.score),
      fraudReasons: fraud.reasons.join("|").slice(0, 500),
      fraudIp: fraud.ip,
    };

    const options = {
      headers: {
        Authorization: "Bearer " + process.env.FLUTTERWAVE,
      },
    };

    const resp = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      payment,
      options
    );
    resp && addActivity("initializeDonation", payment.customer.email);
    res.send(resp.data.data.link);
  } catch (error) {
    logger.error({ err: error }, "initializePayment failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.paymentFlutterwave = async (req, res, next) => {
  try {
    const { tx_ref, transaction_id, status } = req.query;
    if (status != "successful") {
      return res.redirect(
        `${process.env.MAINURL}/donate/${req.params.id}?status=failed`
      );
    }
    const options = {
      headers: {
        Authorization: "Bearer " + process.env.FLUTTERWAVE,
      },
    };
    const resp = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      options
    );
    if (
      resp.data.data.status != "successful" ||
      String(resp.data.data.meta?.campaignId) !== String(req.params.id)
    ) {
      return res.redirect(
        `${process.env.MAINURL}/donate/${req.params.id}?status=failed`
      );
    }

    // Idempotency guard: prevent duplicate recording and double-crediting
    const existingDonation = await Donations.findOne({
      $or: [
        { transactionId: transaction_id },
        { transactionRef: tx_ref },
      ],
    });

    if (existingDonation) {
      return res.redirect(
        `${process.env.MAINURL || "http://localhost:3000"}/donated/${
          resp.data.data.meta.campaignId
        }?status=successful&name=${encodeURIComponent(resp.data.data.customer.name)}&amount=${
          Number(resp.data.data.meta.amount) - Number(resp.data.data.meta.tip)
        }&email=${encodeURIComponent(resp.data.data.customer.email)}&campaignId=${
          resp.data.data.meta.campaignId
        }&anonymous=${resp.data.data.meta.anonymous}`
      );
    }

    const donatedAmount =
      Number(resp.data.data.meta.amount) - Number(resp.data.data.meta.tip);
    const donation = new Donations({
      campaignId: resp.data.data.meta.campaignId,
      donorEmail: resp.data.data.customer.email,
      donorName: resp.data.data.customer.name,
      amount: donatedAmount,
      transactionId: transaction_id,
      transactionRef: tx_ref,
      flwRef: resp.data.data.flw_ref,
      tip: resp.data.data.meta.tip,
      paymentMethod: "flutterwave",
      paymentOption: "card",
      zipCode: resp.data.data.meta.zipCode,
      createdAt: resp.data.data.customer.created_at || Date.now(),
      anonymous: resp.data.data.meta.anonymous,
      referralCode: String(resp.data.data.meta.referralCode || ""),
      fraud: buildFraudSnapshot(resp.data.data),
    });

    try {
      await donation.save();
    } catch (saveError) {
      // Unique constraint on transactionId/transactionRef: a concurrent
      // duplicate request lost the race — treat as already recorded.
      if (saveError && saveError.code === 11000) {
        return res.redirect(
          `${process.env.MAINURL || "http://localhost:3000"}/donated/${
            resp.data.data.meta.campaignId
          }?status=successful&name=${encodeURIComponent(resp.data.data.customer.name)}&amount=${donatedAmount}&email=${encodeURIComponent(resp.data.data.customer.email)}&campaignId=${resp.data.data.meta.campaignId}&anonymous=${resp.data.data.meta.anonymous}`
        );
      }
      throw saveError;
    }
    addActivity("donation", resp.data.data.customer.email);

    await creditCampaign(resp.data.data.meta.campaignId, donatedAmount);
    notifyTargetReachedIfNeeded(resp.data.data.meta.campaignId);

    const campaign = await Campaign.findById(req.params.id);
    await sendDonationMailSafely(
      {
        email: resp.data.data.customer.email,
        name: resp.data.data.customer.name,
      },
      campaign,
      donatedAmount
    );

    return res.redirect(
      `${process.env.MAINURL || "http://localhost:3000"}/donated/${
        resp.data.data.meta.campaignId
      }?status=successful&name=${encodeURIComponent(resp.data.data.customer.name)}&amount=${donatedAmount}&email=${encodeURIComponent(resp.data.data.customer.email)}&campaignId=${resp.data.data.meta.campaignId}&anonymous=${resp.data.data.meta.anonymous}`
    );
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

/**
 * Flutterwave webhook handler for reliable server-side payment confirmation.
 * POST /api/donations/flutterwave-webhook
 *
 * Verifies the request via the Flutterwave `verif-hash` header, re-verifies the
 * transaction with Flutterwave's API, and applies idempotency on flw_ref so
 * retries never double-credit a campaign.
 */
exports.flutterwaveWebhook = async (req, res) => {
  try {
    const secret = process.env.FLUTTERWAVE;
    const verifHash = process.env.FLUTTERWAVE_VERIF_HASH;
    if (!secret || !verifHash) {
      return res.status(503).json({ status: 503, error: "Flutterwave webhook is not configured" });
    }

    // Flutterwave webhooks carry the dashboard-configured hash in verif-hash.
    const provided = String(req.headers["verif-hash"] || "");
    const expected = String(verifHash);
    if (
      provided.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
    ) {
      return res.status(401).json({ status: 401, error: "Invalid webhook signature" });
    }

    const event = req.body;
    // Only completed/successful charges are actionable; ack the rest.
    if (
      !["charge.completed", "charge.success"].includes(event.event) ||
      event.data?.status !== "successful"
    ) {
      return res.status(200).json({ received: true });
    }

    const tx = event.data;
    const txRef = tx.tx_ref;
    const flwRef = tx.flw_ref;
    const transactionId = String(tx.id || "");
    const metadata = tx.meta || {};
    const campaignId = metadata.campaignId;

    if (!campaignId || !txRef) {
      return res.status(200).json({ received: true });
    }

    // Idempotency guard keyed on flw_ref (plus gateway txn id + ref) so
    // retries and duplicate webhook deliveries never double-credit.
    const existingDonation = await Donations.findOne({
      $or: [{ transactionId }, { transactionRef: txRef }, { flwRef }],
    });
    if (existingDonation) return res.status(200).json({ received: true });

    // Re-verify the transaction with Flutterwave API to confirm the hash is genuine.
    const verifyResp = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      { headers: { Authorization: "Bearer " + secret } }
    );
    if (
      verifyResp.data?.data?.status !== "successful" ||
      String(verifyResp.data?.data?.meta?.campaignId || "") !== String(campaignId)
    ) {
      return res.status(400).json({ status: 400, error: "Transaction verification failed" });
    }

    const totalCharged = Number(tx.amount || 0);
    const donatedAmount = Number(metadata.amount || 0);
    const tip = Number(metadata.tip || 0);
    if (
      !Number.isFinite(donatedAmount) ||
      donatedAmount <= 0 ||
      Math.abs(totalCharged - (donatedAmount + tip)) > 1
    ) {
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
        donorEmail: metadata.email || tx.customer?.email || "",
        donorName: metadata.name || `${tx.customer?.first_name || ""} ${tx.customer?.last_name || ""}`.trim() || "Donor",
        amount: donatedAmount,
        transactionId: transactionId || flwRef,
        transactionRef: txRef,
        flwRef,
        tip,
        paymentMethod: "flutterwave",
        paymentOption: metadata.paymentOption || tx.payment_method || "card",
        zipCode: metadata.zipCode || "",
        createdAt: tx.created_at || Date.now(),
        anonymous: metadata.anonymous === true || metadata.anonymous === "true",
        referralCode: String(metadata.referralCode || ""),
        fraud: buildFraudSnapshot(tx),
      });
    } catch (createError) {
      // Concurrent duplicate delivery — unique constraint, ack quietly.
      if (createError && createError.code === 11000) {
        return res.status(200).json({ received: true });
      }
      throw createError;
    }

    await creditCampaign(campaign._id, donatedAmount);
    notifyTargetReachedIfNeeded(campaign._id);

    addActivity("donation", tx.customer?.email || metadata.customer || "");

    await sendDonationMailSafely(
      {
        email: tx.customer?.email || metadata.customer,
        name: tx.customer?.name || "Donor",
      },
      campaign,
      donatedAmount
    );

    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error({ err: error }, "Flutterwave webhook failed");
    return res.status(500).json({ status: 500, error: "Webhook processing error" });
  }
};
