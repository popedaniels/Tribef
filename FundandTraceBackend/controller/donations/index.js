// Donation controllers, grouped by payment processor.
// Re-exported as a single module so routes/donations.js can keep using
// `donationController.<handler>` unchanged.
const flutterwave = require("./flutterwave");
const stripe = require("./stripe");
const payout = require("./payout");
const paystack = require("./paystack");
const queries = require("./queries");

module.exports = {
  // Flutterwave
  initializePayment: flutterwave.initializePayment,
  paymentFlutterwave: flutterwave.paymentFlutterwave,
  flutterwaveWebhook: flutterwave.flutterwaveWebhook,

  // Stripe Checkout
  createStripeSession: stripe.createStripeSession,
  paymentStripe: stripe.paymentStripe,
  stripeCheckoutWebhook: stripe.stripeCheckoutWebhook,

  // Stripe Connect disbursements
  stripePayoutWebhook: payout.stripePayoutWebhook,

  // Paystack
  initializePaystackPayment: paystack.initializePaystackPayment,
  paymentPaystack: paystack.paymentPaystack,
  paystackWebhook: paystack.paystackWebhook,

  // Queries
  getDonations: queries.getDonations,
};
