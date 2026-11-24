const express = require("express");
const router = express.Router();
const { objectIdParam } = require("../utility/validate");

const discovery = require("../controller/discovery");
const { requireAuth } = require("../utility/auth");

// Reject malformed ObjectIds with 400 before any handler runs.
router.param("id", objectIdParam("Campaign ID"));

router.get("/search", discovery.search);
router.get("/trending", discovery.trending);
router.get("/sitemap", discovery.sitemap);
router.get("/similar/:id", discovery.similar);
// Owner-or-admin referral stats (ownership resolved inside the controller).
router.get("/referrals/:id", requireAuth, discovery.referralStats);

module.exports = router;
