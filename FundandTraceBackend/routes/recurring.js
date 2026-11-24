const express = require("express");
const router = express.Router();
const { objectIdParam } = require("../utility/validate");

const recurring = require("../controller/recurring");
const { requireAuth } = require("../utility/auth");

// Reject malformed ObjectIds with 400 before any handler runs.
router.param("id", objectIdParam("Campaign ID"));

router.post("/subscribe/:id", ...require("../utility/checkoutGuard").checkoutGuard(), recurring.createSubscriptionSession);
router.post("/cancel/:subscriptionId", requireAuth, recurring.cancelSubscription);
router.get("/mine", requireAuth, recurring.mySubscriptions);

module.exports = router;
