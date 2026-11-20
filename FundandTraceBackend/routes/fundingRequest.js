const express = require("express");
const router = express.Router();
const { objectIdParam } = require("../utility/validate");

const fundingRequestController = require("../controller/fundingRequest");
const { requireAuth, requireCampaignOwner } = require("../utility/auth");

// Reject malformed ObjectIds with 400 before any handler runs.
router.param("id", objectIdParam("ID"));

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
// Organiser uploads proof of spend for a completed payout.
router.post("/:id/receipt", requireAuth, require("../controller/trust").uploadReceipt);

module.exports = router;
