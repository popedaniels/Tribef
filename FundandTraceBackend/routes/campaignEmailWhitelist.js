const express = require("express");
const router = express.Router();

const campaignEmailWhitelistController = require("../controller/campaignEmailWhitelist");
const { requireAuth, requireCampaignOwner } = require("../utility/auth");

router.post(
  "/",
  requireAuth,
  requireCampaignOwner,
  campaignEmailWhitelistController.addEmailToWhitelist
);
router.get(
  "/",
  requireAuth,
  requireCampaignOwner,
  campaignEmailWhitelistController.removeEmailToWhitelist
);

module.exports = router;
