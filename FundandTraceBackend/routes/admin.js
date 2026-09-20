const express = require("express");
const router = express.Router();

const adminController = require("../controller/admin");
const adminUsersController = require("../controller/adminUsers");
const adminFundingRequestController = require("../controller/adminFundingRequests");
const adminRefundsController = require("../controller/adminRefunds");
const { requireAdmin } = require("../utility/auth");

router.post("/login", adminController.adminLogin);
router.use(requireAdmin);

router.get("/overview", adminController.getOverviewDetails);
router.get("/charts", adminController.getChartDetails);
router.get("/campaigns/:query", adminController.getAllCampaigns);
router.get("/campaign/:id", adminController.getSingleCampaign);
router.get("/search/:category", adminController.search);
router.post("/updateProfile/:id", adminController.updateAdminProfile);
router.get("/users/:query", adminUsersController.getAllUsers);
router.get("/users/search/:query", adminUsersController.searchUsersWithName);
router.get("/user/:id", adminUsersController.getUserData);
router.get(
  "/fundingRequests/:query",
  adminFundingRequestController.getAllFundingRequests
);
router.get(
  "/fundingRequest/:id",
  adminFundingRequestController.getSingleFundingRequests
);
router.patch(
  "/fundingRequest/approve/:id",
  adminFundingRequestController.approveFundingRequest
);
router.patch(
  "/fundingRequest/decline/:id",
  adminFundingRequestController.declineFundingRequest
);

router.post("/sendMail", adminController.sendUserMail);
router.post("/suspendCampaign/:id", adminController.suspendCampaign);
router.post("/suspendUser/:id", adminUsersController.suspendUser);
router.post("/unsuspendCampaign/:id", adminController.unsuspendCampaign);
router.post("/unsuspendUser/:id", adminUsersController.unsuspendUser);
router.post(
  "/refunds/stripeRefund/:campaignId/:donationId",
  adminRefundsController.stripeRefund
);
router.post(
  "/refunds/stripeRefundBatch/:campaignId",
  adminRefundsController.stripeRefundBatch
);
router.get("/refunds/donations/:query", adminRefundsController.getAllDonations);
router.get("/fraud/flagged", adminController.listFlaggedDonations);
router.get(
  "/refunds/campaign/:query",
  adminRefundsController.getSingleCampaign
);

module.exports = router;
