const express = require("express");
const router = express.Router();

const donationController = require("../controller/donations");
const { requireAuth, requireInternalWebhook } = require("../utility/auth");

router.get("/flutterwave/:id", donationController.paymentFlutterwave);
router.get("/allDonations/:email", requireAuth, donationController.getDonations);
router.get("/:donationId/receipt", requireAuth, require("../controller/donations/receipts").getReceipt);
// Donor self-service refunds (ENABLE_SELF_REFUNDS=true).
const selfRefund = require("../controller/donations/selfRefund");
const { rateLimiter } = require("../utility/security");
router.get("/refund-policy", selfRefund.refundPolicy);
router.post(
  "/:donationId/refund",
  requireAuth,
  rateLimiter({ windowMs: 24 * 60 * 60 * 1000, max: 5, name: "refund" }),
  selfRefund.requestRefund
);
router.post("/initialize", donationController.initializePayment);
router.post("/createStripeSession/:id", donationController.createStripeSession);
router.post("/stripeWebhook/:id", requireInternalWebhook, donationController.stripePayoutWebhook);

router.get("/saveStripe/:sessionId", donationController.paymentStripe);
router.post("/stripe-webhook", donationController.stripeCheckoutWebhook);
router.post("/flutterwave-webhook", donationController.flutterwaveWebhook);
router.post("/initializePaystack/:id", donationController.initializePaystackPayment);
router.get("/paystack/:id", donationController.paymentPaystack);
router.post("/paystack-webhook", donationController.paystackWebhook);
// router.post("/login", userController.login);

module.exports = router;
