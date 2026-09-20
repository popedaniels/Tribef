const express = require("express");
const router = express.Router();
const twoFactor = require("../controller/twoFactor");
const { requireAuth } = require("../utility/auth");

// Enrolment and status require an authenticated session.
router.post("/setup", requireAuth, twoFactor.setup);
router.post("/enable", requireAuth, twoFactor.enable);
router.post("/disable", requireAuth, twoFactor.disable);
router.get("/status", requireAuth, twoFactor.status);

// Completing a login needs no session — the short-lived challenge token is
// the credential, so this route stays public (authLimiter applied upstream).
router.post("/challenge", twoFactor.challenge);

module.exports = router;
