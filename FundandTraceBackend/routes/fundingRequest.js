const express = require("express");
const router = express.Router();

const fundingRequestController = require("../controller/fundingRequest");
const { requireAuth, requireCampaignOwner } = require("../utility/auth");

router.get("/", fundingRequestController.getAllFundingRequests);
router.get(
  "/singleFundingRequest/:id",
  fundingRequestController.getSingleFundingRequest
);
router.get(
  "/fundingRequest/:id",
  fundingRequestController.getAllCampaignFundingRequests
);
router.get("/campaignTracker/:id", fundingRequestController.trackingFunction);
router.get("/:id", fundingRequestController.getAllUserFundingRequests);

router.post("/addFundingRequest", requireAuth, requireCampaignOwner, fundingRequestController.addFundingRequest);

module.exports = router;
