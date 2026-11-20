const express = require("express");
const router = express.Router();

const campaignController = require("../controller/campaign");
const { requireAuth, requireCampaignOwner } = require("../utility/auth");
const { validate, objectIdParam } = require("../utility/validate");
const { addCommentSchema, addUpdateSchema, disputeSchema } = require("../utility/schemas");

// Reject malformed ObjectIds with 400 before any handler runs.
router.param("id", objectIdParam("Campaign ID"));

router.get("/", campaignController.getAllCampaigns);
router.get("/:id", campaignController.getAllUserCampaigns);
router.get("/campaign/:id", campaignController.getSingleCampaign);
router.get("/searchByCategory/:category", campaignController.searchByCategory);
router.get("/searchByName/:page", campaignController.searchByName);
router.post("/campaign/addComment/:id", requireAuth, validate(addCommentSchema), campaignController.addComment);
router.post("/campaign/addUpdate/:id", requireAuth, requireCampaignOwner, validate(addUpdateSchema), campaignController.addUpdate);
router.post("/:id/dispute", requireAuth, validate(disputeSchema), campaignController.fileDispute);
router.get("/:id/dispute-status", campaignController.getDisputeStatus);
router.get("/:id/transparency", require("../controller/trust").transparencyScore);
router.delete("/draft/delete/:id", requireAuth, requireCampaignOwner, campaignController.deleteDraft);

module.exports = router;
