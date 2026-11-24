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

const normCurrency = (c) => String(c || "").trim().toUpperCase();

// Donations are taken only in the campaign's own currency. Balances are plain
// numbers in that currency, so a ₦50,000 payment into a GBP campaign would
// otherwise be booked as £50,000 of escrow. Returns the currency to charge, or
// null when the donor asked for a different one.
const checkoutCurrency = (campaign, requested) => {
  const own = normCurrency(campaign?.funding?.currency);
  const asked = normCurrency(requested);
  if (!own) return asked || null;
  if (asked && asked !== own) return null;
  return own;
};

const currencyMismatch = (res, campaign) =>
  res.status(400).json({
    status: 400,
    code: "currency_mismatch",
    error: `This campaign accepts donations in ${normCurrency(campaign?.funding?.currency)} only.`,
  });

// Atomic campaign credit — never read-modify-write, so concurrent webhooks
// and callbacks cannot lose updates. `ref` is the gateway reference; it keys
// the public ledger entry so a replayed webhook can't double-record.
//
// Defence in depth for the checkout guard: if the gateway reports a currency
// different from the campaign's, nothing is credited and the mismatch is
// logged for manual refund — never booked at face value.
const creditCampaign = async (campaignId, amount, ref = {}) => {
  if (ref.currency) {
    const camp = await Campaign.findById(campaignId).select("funding.currency").lean();
    const own = normCurrency(camp?.funding?.currency);
    if (own && normCurrency(ref.currency) !== own) {
      logger.error(
        { campaignId, amount, paid: normCurrency(ref.currency), campaignCurrency: own, refId: ref.refId },
        "Donation currency does not match campaign currency — NOT credited; refund manually"
      );
      return { acknowledged: false, currencyMismatch: true };
    }
  }
  const result = await Campaign.updateOne(
    { _id: campaignId },
    { $inc: { "funding.amountRaised": amount, "funding.availableBalance": amount } }
  );
  if (ref.refId) {
    await appendEntry({
      campaignId,
      type: "credit",
      amount,
      currency: normCurrency(ref.currency) || undefined,
      refId: ref.refId,
      memo: ref.memo || "Donation",
    });
  } else {
    logger.warn({ campaignId }, "creditCampaign called without a ledger refId");
  }
  return result;
};

// ── Checkout amounts (shared by every gateway) ─────────────────────────────
// The donor's TOTAL = donation + optional tip + processing fee (services/fees).
// The campaign is credited the donation only. The client sends the total, the
// tip and the fee it showed; the server re-computes the fee and refuses a
// mismatch, so a tampered client can neither short the campaign nor overcharge.
const fees = require("../../services/fees");
const ISO2 = /^[A-Z]{2}$/;

function resolveCheckout(req, rail, currency) {
  const meta = req.body.meta || {};
  const total = Number(req.body.amount);
  const tip = Number(meta.tip || 0);
  const clientFee = Number(meta.processingFee || 0);
  const coverFee = meta.coverFee === true || meta.coverFee === "true";
  const method = ["mpesa", "mobilemoney", "card", "bank"].includes(meta.method) ? meta.method : "";
  const cc = String(meta.donorCountry || req.headers["cf-ipcountry"] || req.headers["x-vercel-ip-country"] || "").toUpperCase();
  const donorCountry = ISO2.test(cc) ? cc : "";
  const fail = (error, code) => Object.assign(new Error(error), { status: 400, code });

  if (!Number.isFinite(total) || total <= 0 || total > 100000000) throw fail("Invalid donation amount");
  if (!Number.isFinite(clientFee) || clientFee < 0 || clientFee >= total) throw fail("Invalid processing fee");
  const base = fees.round2(total - clientFee); // donation + tip
  if (!Number.isFinite(tip) || tip < 0 || tip >= base) throw fail("Invalid tip amount");
  const fee = fees.checkClientFee({ rail, currency, base, coverFee, method, donorCountry, clientFee });
  const donation = fees.round2(base - tip);
  if (!(donation > 0)) throw fail("Invalid donation amount");
  return { total: fees.round2(total), donation, tip: fees.round2(tip), fee, method, donorCountry, coverFee };
}

const checkoutError = (res, err) =>
  res.status(err.status || 400).json({ status: err.status || 400, code: err.code, error: err.message, expectedFee: err.expectedFee });

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
  checkoutCurrency,
  currencyMismatch,
  sendDonationMailSafely,
  resolveCheckout,
  checkoutError,
  splitTotal: fees.splitTotal,
};
