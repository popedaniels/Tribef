const express = require("express");
const router = express.Router();
const recurring = require("../controller/recurring");
const { requireAuth } = require("../utility/auth");

router.post("/subscribe/:id", recurring.createSubscriptionSession);
router.post("/cancel/:subscriptionId", requireAuth, recurring.cancelSubscription);
router.get("/mine", requireAuth, recurring.mySubscriptions);

module.exports = router;
