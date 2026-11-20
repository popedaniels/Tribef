const express = require("express");
const router = express.Router();
const { objectIdParam } = require("../utility/validate");

const identityController = require("../controller/identity");
const { requireAuth, requireAdmin } = require("../utility/auth");

// Reject malformed ObjectIds with 400 before any handler runs.
router.param("userId", objectIdParam("User ID"));

router.post("/create-session", requireAuth, identityController.createVerificationSession);
router.get("/status/:userId", requireAuth, identityController.getVerificationStatus);
router.post("/webhook", identityController.identityWebhook);
router.post("/admin-verify/:userId", requireAdmin, identityController.adminVerifyUser);

module.exports = router;
