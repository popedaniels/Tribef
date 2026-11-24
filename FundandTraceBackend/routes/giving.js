const express = require("express");
const router = express.Router();
const giving = require("../controller/giving");
const { requireAuth, requireCampaignOwner } = require("../utility/auth");

router.get("/campaign/:id", giving.campaignGiving);
router.post("/campaign/:id/teams", requireAuth, requireCampaignOwner, giving.createTeam);
router.delete("/campaign/:id/teams/:teamId", requireAuth, requireCampaignOwner, giving.deleteTeam);
router.get("/statement/:year", requireAuth, giving.donorStatement);
router.get("/gift-aid/export", requireAuth, giving.giftAidExport);

module.exports = router;
