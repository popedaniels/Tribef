const express = require("express");
const router = express.Router();

const startCampaignController = require("../controller/startCampaign");
const { requireAuth, requireCampaignOwner } = require("../utility/auth");

router.use(requireAuth);
router.post("/", requireCampaignOwner, startCampaignController.create);
router.post("/saveCampaign", requireCampaignOwner, startCampaignController.save);
router.post("/basicInformation", requireCampaignOwner, startCampaignController.basicInfo);
router.post("/content", requireCampaignOwner, startCampaignController.content);
router.post("/team", requireCampaignOwner, startCampaignController.team);
router.post("/funding", requireCampaignOwner, startCampaignController.funding);
router.post("/settings", requireCampaignOwner, startCampaignController.settings);
router.post("/launch", requireCampaignOwner, startCampaignController.launch);

module.exports = router;
