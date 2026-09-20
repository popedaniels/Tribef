const express = require("express");
const router = express.Router();

const donationController = require("../controller/donations");
const { requireAuth, requireInternalWebhook } = require("../utility/auth");

router.get("/flutterwave/:id", donationController.paymentFlutterwave);
router.get("/allDonations/:email", requireAuth, donationController.getDonations);
router.get("/:donationId/receipt", requireAuth, require("../controller/donations/receipts").getReceipt);
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
