const express = require("express");
const router = express.Router();
const { objectIdParam } = require("../utility/validate");

const identityController = require("../controller/identity");
const { requireAuth, requireAdmin } = require("../utility/auth");

// Reject malformed ObjectIds with 400 before any handler runs.
router.param("userId", objectIdParam("User ID"));

router.get("/options", identityController.options);
router.post("/create-session", requireAuth, identityController.createVerificationSession);
router.get("/status/:userId", requireAuth, identityController.getVerificationStatus);
router.post("/webhook", identityController.identityWebhook);
router.post(
  "/database-check",
  requireAuth,
  require("../utility/security").rateLimiter({ windowMs: 60 * 60 * 1000, max: 5, name: "id-database-check" }),
  identityController.databaseCheck
);
router.post(
  "/admin-verify/:userId",
  requireAdmin,
  require("../utility/adminAudit").auditAdminMutations,
  identityController.adminVerifyUser
);

module.exports = router;
