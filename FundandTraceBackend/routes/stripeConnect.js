const express = require("express");
const router = express.Router();

const stripeConnectController = require("../controller/stripeConnect");
const { requireAuth, requireCampaignOwner } = require("../utility/auth");

router.get(
  "/status/:id",
  requireAuth,
  stripeConnectController.getConnectStatus
);
router.post(
  "/account/:id",
  requireAuth,
  requireCampaignOwner,
  stripeConnectController.createConnectAccount
);
router.post("/webhook", stripeConnectController.connectWebhook);

module.exports = router;