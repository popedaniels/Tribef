// Flutterwave donation flow: initialization, redirect callback, webhook.
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
    // Dispute freeze: don't take new money into a campaign under review.
    if (campaign.disputeGovernance?.isLocked) {
      return res.status(423).json({ status: 423, code: "campaign_frozen", error: FROZEN_MESSAGE });
    }

    const currency = checkoutCurrency(campaign, payment.currency);
    if (!currency) return currencyMismatch(res, campaign);
    payment.currency = currency;

    // Same contract as Stripe/Paystack (shared.resolveCheckout): `amount` is
    // the TOTAL charged = donation + tip + card fee; the campaign receives the
    // donation. meta.amount always mirrors the total.
    let co, extras;
    try {
      co = resolveCheckout({ body: { amount, meta: payment.meta || {} }, headers: req.headers }, "flutterwave", currency);
      extras = await prepareExtras(payment.meta, campaign);
    } catch (err) {
      return checkoutError(res, err);
    }
    payment.amount = co.total;
    // Gift Aid address and team stay on our server, not in gateway metadata.
    if (payment.meta) {
      delete payment.meta.giftAid;
      delete payment.meta.teamId;
    }
    if (extras && !payment.tx_ref) payment.tx_ref = `fundandtrace-flw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    payment.meta = { ...(payment.meta || {}), amount: String(co.total), tip: String(co.tip), fee: String(co.fee), method: co.method };
    // Mobile money: open Flutterwave straight on the right wallet.
    const MOMO = { KES: "mpesa", GHS: "mobilemoneyghana", UGX: "mobilemoneyuganda", RWF: "mobilemoneyrwanda", ZMW: "mobilemoneyzambia", XOF: "mobilemoneyfranco", XAF: "mobilemoneyfranco", TZS: "mobilemoneytanzania" };
    if ((co.method === "mpesa" || co.method === "mobilemoney") && MOMO[currency]) payment.payment_options = MOMO[currency];

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
    await saveExtras(`flw:${payment.tx_ref}`, campaign._id, extras);
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
          splitTotal({ total: Number(resp.data.data.meta.amount), tip: Number(resp.data.data.meta.tip || 0), fee: Number(resp.data.data.meta.fee || 0) }).donation
        }&email=${encodeURIComponent(resp.data.data.customer.email)}&campaignId=${
          resp.data.data.meta.campaignId
        }&anonymous=${resp.data.data.meta.anonymous}`
      );
    }

    // The amount Flutterwave actually collected must match the total we set at
    // initialization (meta is ours, but a payment can be started directly with
    // the public key and arbitrary meta), and be in the campaign's currency.
    const fwMeta = resp.data.data.meta || {};
    const split = splitTotal({ total: Number(fwMeta.amount), tip: Number(fwMeta.tip || 0), fee: Number(fwMeta.fee || 0) });
    const paidTotal = Number(resp.data.data.amount);
    const fwCampaign = await Campaign.findById(req.params.id).select("funding.currency").lean();
    if (
      !split.ok ||
      !Number.isFinite(paidTotal) ||
      Math.abs(paidTotal - split.total) > 0.01 ||
      (fwCampaign?.funding?.currency && String(resp.data.data.currency).toUpperCase() !== String(fwCampaign.funding.currency).toUpperCase())
    ) {
      logger.error({ transaction_id, paidTotal, meta: fwMeta }, "Flutterwave redirect: paid amount/currency does not match — not credited");
      return res.redirect(`${process.env.MAINURL}/donate/${req.params.id}?status=failed`);
    }
    const donatedAmount = split.donation;
    const donation = new Donations({
      campaignId: resp.data.data.meta.campaignId,
      donorEmail: resp.data.data.customer.email,
      donorName: resp.data.data.customer.name,
      amount: donatedAmount,
      transactionId: transaction_id,
      transactionRef: tx_ref,
      flwRef: resp.data.data.flw_ref,
      tip: split.tip,
      processingFee: split.fee,
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

    await creditCampaign(resp.data.data.meta.campaignId, donatedAmount, {
      refId: `flw:${transaction_id || tx_ref}`,
      currency: resp.data.data.currency,
    });
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

    // Bank payout outcome (services/payoutRails.js). Same signed endpoint.
    if (event.event === "transfer.completed" && event.data?.reference) {
      const { applyTransferOutcome } = require("./payout");
      await applyTransferOutcome({ reference: event.data.reference, status: String(event.data.status || "") });
      return res.status(200).json({ received: true });
    }

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

    // meta.amount is the total charged (see initializePayment); the campaign
    // receives total - tip - fee.
    const totalCharged = Number(tx.amount || 0);
    const metaTotal = Number(metadata.amount || 0);
    const split = splitTotal({ total: metaTotal, tip: Number(metadata.tip || 0), fee: Number(metadata.fee || 0) });
    const donatedAmount = split.donation;
    const { tip, fee } = split;
    if (!split.ok || !Number.isFinite(totalCharged) || Math.abs(totalCharged - metaTotal) > 1) {
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
        processingFee: fee,
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

    await creditCampaign(campaign._id, donatedAmount, {
      refId: `flw:${transactionId || flwRef || txRef}`,
      currency: tx.currency,
    });
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
