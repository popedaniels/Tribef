// One refund pipeline for admin refunds, donor self-service refunds and
// dispute-driven pro-rata refunds (docs/SELF_SERVICE_REFUNDS.md).
//
//   1. claim the donation atomically      (no double refunds)
//   2. reserve escrow with a $gte guard    (never refund money already paid out;
//                                           the old admin refund could drive the
//                                           balance negative)
//   3. call the gateway with an idempotency key
//   4. record + ledger, or release everything on failure
//
// Gateways: Stripe (payment_intent), Flutterwave (/v3/transactions/:id/refund),
// Paystack (/refund with the transaction reference).

const axios = require("axios");
const { Campaign } = require("../models/campaignModel");
const { Donations } = require("../models/donationsModel");
const { appendEntry } = require("./ledger");
const logger = require("../utility/logger");

const stripe = process.env.STRIPESECRET ? require("stripe")(process.env.STRIPESECRET) : null;

const round2 = (n) => Math.round(Number(n) * 100) / 100;

class RefundError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const REFUNDABLE_STATUS = { $or: [{ "refund.status": { $in: ["", null, "failed"] } }, { "refund.status": { $exists: false } }] };

const gatewayOf = (donation) => {
  const m = String(donation.paymentMethod || "").toLowerCase();
  if (m.startsWith("stripe")) return "stripe";
  if (m === "flutterwave") return "flutterwave";
  if (m === "paystack") return "paystack";
  return "unknown";
};

async function callGateway(donation, gatewayAmount, currency, idempotencyKey) {
  const gateway = gatewayOf(donation);
  if (gateway === "stripe") {
    if (!stripe) throw new RefundError(503, "gateway_unconfigured", "Stripe is not configured");
    if (!donation.paymentId) throw new RefundError(422, "not_refundable", "No Stripe payment to refund");
    const refund = await stripe.refunds.create(
      { payment_intent: donation.paymentId, amount: Math.round(gatewayAmount * 100) },
      { idempotencyKey }
    );
    return { refundId: refund.id, status: refund.status === "succeeded" ? "succeeded" : "pending" };
  }
  if (gateway === "flutterwave") {
    if (!process.env.FLUTTERWAVE) throw new RefundError(503, "gateway_unconfigured", "Flutterwave is not configured");
    const id = donation.transactionId;
    if (!id) throw new RefundError(422, "not_refundable", "No Flutterwave transaction to refund");
    const resp = await axios.post(
      `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(id)}/refund`,
      { amount: round2(gatewayAmount) },
      { headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE}` }, timeout: 15000 }
    );
    const data = resp.data?.data || {};
    return { refundId: String(data.id || ""), status: /complete|success/i.test(data.status || "") ? "succeeded" : "pending" };
  }
  if (gateway === "paystack") {
    if (!process.env.PAYSTACK_SECRET) throw new RefundError(503, "gateway_unconfigured", "Paystack is not configured");
    const reference = donation.transactionRef || donation.transactionId;
    if (!reference) throw new RefundError(422, "not_refundable", "No Paystack transaction to refund");
    const resp = await axios.post(
      "https://api.paystack.co/refund",
      { transaction: reference, amount: Math.round(gatewayAmount * 100), currency: currency || undefined },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` }, timeout: 15000 }
    );
    const data = resp.data?.data || {};
    return { refundId: String(data.id || ""), status: /processed|success/i.test(data.status || "") ? "succeeded" : "pending" };
  }
  throw new RefundError(422, "not_refundable", `Unsupported payment method: ${donation.paymentMethod || "unknown"}`);
}

/**
 * Refund (part of) a donation.
 * @param {object} opts
 * @param {string} opts.donationId
 * @param {number} [opts.escrowAmount]  amount to take back out of escrow (default: full donation.amount)
 * @param {boolean} [opts.includeTip]    also refund the tip to the donor (self-service full refunds)
 * @param {"admin"|"donor"|"dispute"} opts.requestedBy
 * @param {{id?:string,name?:string}} [opts.actor]
 * @param {string} [opts.reason]
 */
async function refundDonation({ donationId, escrowAmount, includeTip = false, requestedBy, actor = {}, reason = "" }) {
  // 1) claim
  const donation = await Donations.findOneAndUpdate(
    { _id: donationId, ...REFUNDABLE_STATUS },
    {
      $set: {
        "refund.status": "processing",
        "refund.reason": String(reason || "").slice(0, 500),
        "refund.requestedBy": requestedBy,
        "refund.adminId": actor.id ? String(actor.id) : "",
        "refund.adminName": actor.name || "",
        "refund.createdAt": new Date(),
      },
    },
    { new: true }
  );
  if (!donation) {
    const exists = await Donations.exists({ _id: donationId });
    throw exists
      ? new RefundError(409, "already_refunded", "This donation has already been refunded or is being refunded")
      : new RefundError(404, "not_found", "Donation not found");
  }

  const amount = round2(escrowAmount === undefined ? donation.amount : escrowAmount);
  const gatewayAmount = round2(amount + (includeTip ? Number(donation.tip || 0) : 0));
  let reserved = false;

  const release = async (status = "failed") => {
    if (reserved) {
      await Campaign.updateOne(
        { _id: donation.campaignId },
        { $inc: { "funding.amountRaised": amount, "funding.availableBalance": amount } }
      ).catch((err) => logger.error({ err }, "Failed to release refund reservation"));
    }
    await Donations.updateOne({ _id: donation._id }, { $set: { "refund.status": status } }).catch(() => {});
  };

  try {
    if (!(amount > 0) || amount > Number(donation.amount)) {
      throw new RefundError(422, "invalid_amount", "Refund amount must be between 0 and the donation amount");
    }
    const campaign = await Campaign.findById(donation.campaignId).select("funding.currency");
    const currency = campaign?.funding?.currency || "";

    // 2) reserve — only money still in escrow can be returned
    const reservation = await Campaign.updateOne(
      { _id: donation.campaignId, "funding.availableBalance": { $gte: amount } },
      { $inc: { "funding.amountRaised": -amount, "funding.availableBalance": -amount } }
    );
    if (!reservation.modifiedCount && !reservation.nModified) {
      throw new RefundError(409, "insufficient_escrow", "These funds have already been disbursed and can't be refunded automatically");
    }
    reserved = true;

    // 3) gateway (idempotent per donation)
    const result = await callGateway(donation, gatewayAmount, currency, `refund-${donation._id}`);

    // 4) record
    await Donations.updateOne(
      { _id: donation._id },
      {
        $set: {
          "refund.status": result.status,
          "refund.amount": gatewayAmount,
          "refund.escrowAmount": amount,
          "refund.refundId": result.refundId,
        },
      }
    );
    await appendEntry({
      campaignId: donation.campaignId,
      type: "refund",
      amount,
      currency,
      refId: `refund:${donation._id}`,
      memo: requestedBy === "dispute" ? "Dispute refund (pro-rata)" : requestedBy === "donor" ? "Donor refund" : "Admin refund",
    });
    return { donationId: String(donation._id), amount: gatewayAmount, escrowAmount: amount, status: result.status, refundId: result.refundId };
  } catch (err) {
    await release("failed");
    if (err instanceof RefundError) throw err;
    logger.error({ err: err.response?.data || err.message, donationId }, "Gateway refund failed");
    throw new RefundError(502, "gateway_error", "The payment provider rejected the refund. Please try again later.");
  }
}

module.exports = { refundDonation, RefundError, gatewayOf, REFUNDABLE_STATUS };

/**
 * Return everything still in escrow to donors, pro-rata to what each gave.
 * Used by dispute resolution ("fraud confirmed") and the admin batch refund.
 * Money already disbursed can't be clawed back automatically, so each donor
 * receives amount × (availableBalance / total eligible donations), capped at 100 %.
 */
async function proRataRefundCampaign(campaignId, { requestedBy = "dispute", actor = {}, reason = "" } = {}) {
  const campaign = await Campaign.findById(campaignId).select("funding");
  if (!campaign) throw new RefundError(404, "not_found", "Campaign not found");

  const donations = await Donations.find({ campaignId, ...REFUNDABLE_STATUS }).select("amount paymentMethod");
  const eligible = donations.filter((d) => Number(d.amount) > 0 && gatewayOf(d) !== "unknown");
  const total = round2(eligible.reduce((sum, d) => sum + Number(d.amount), 0));
  const available = round2(campaign.funding?.availableBalance || 0);
  if (!eligible.length || total <= 0 || available <= 0) {
    return { ratio: 0, refunded: [], failed: [], totalRefunded: 0, available, eligibleTotal: total };
  }
  const ratio = Math.min(1, available / total);

  const refunded = [];
  const failed = [];
  for (const d of eligible) {
    // Floor to the cent so rounding can never exceed the escrow balance.
    const share = Math.floor(Number(d.amount) * ratio * 100) / 100;
    if (share <= 0) continue;
    try {
      refunded.push(
        await refundDonation({ donationId: d._id, escrowAmount: share, requestedBy, actor, reason })
      );
    } catch (err) {
      failed.push({ donationId: String(d._id), error: err.message, code: err.code || "error" });
    }
  }
  const totalRefunded = round2(refunded.reduce((sum, r) => sum + r.escrowAmount, 0));
  if (!failed.length) {
    await Campaign.updateOne({ _id: campaignId }, { $set: { "funding.refunded": true } });
  }
  return { ratio: Math.round(ratio * 10000) / 10000, refunded, failed, totalRefunded, available, eligibleTotal: total };
}

module.exports.proRataRefundCampaign = proRataRefundCampaign;
