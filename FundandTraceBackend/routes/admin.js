const express = require("express");
const router = express.Router();
const { objectIdParam } = require("../utility/validate");

const adminController = require("../controller/admin");
const adminUsersController = require("../controller/adminUsers");
const adminFundingRequestController = require("../controller/adminFundingRequests");
const adminRefundsController = require("../controller/adminRefunds");
const { requireAdmin } = require("../utility/auth");

// Reject malformed ObjectIds with 400 before any handler runs.
router.param("id", objectIdParam("ID"));

router.post("/login", adminController.adminLogin);
router.use(requireAdmin);
// Audit trail for every successful admin mutation (who, what, which record).
router.use(require("../utility/adminAudit").auditAdminMutations);

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
router.get("/fundingRequest/:id/review", adminFundingRequestController.reviewFundingRequest);
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

// Dispute resolution (unlock or pro-rata refund of the remaining escrow).
const adminDisputes = require("../controller/adminDisputes");
router.get("/disputes/frozen", adminDisputes.listFrozenCampaigns);

// Operations: daily integrity checks, ledger anchors, scheduled job history.
const adminOps = require("../controller/adminOps");
router.get("/ops/status", adminOps.status);
router.post("/ops/integrity/run", adminOps.runIntegrity);
router.post("/disputes/:id/resolve", adminDisputes.resolveDispute);

// Admin audit trail.
router.get("/audit", async (req, res) => {
  try {
    const { ActivityLog } = require("../models/activityLogModel");
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const filter = { type: /^admin:/ };
    if (req.query.targetId) filter.targetId = String(req.query.targetId);
    const [entries, count] = await Promise.all([
      ActivityLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * 50).limit(50).maxTimeMS(3000),
      ActivityLog.countDocuments(filter).maxTimeMS(3000),
    ]);
    return res.status(200).json({ data: { entries, count, page } });
  } catch (error) {
    return res.status(500).json({ status: 500, error: "Server error." });
  }
});

module.exports = router;
