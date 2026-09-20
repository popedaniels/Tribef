const express = require("express");
const router = express.Router();
const identityController = require("../controller/identity");
const { requireAuth, requireAdmin } = require("../utility/auth");

router.post("/create-session", requireAuth, identityController.createVerificationSession);
router.get("/status/:userId", requireAuth, identityController.getVerificationStatus);
router.post("/webhook", identityController.identityWebhook);
router.post("/admin-verify/:userId", requireAdmin, identityController.adminVerifyUser);

module.exports = router;
