const express = require("express");
const router = express.Router();
const discovery = require("../controller/discovery");
const { requireAuth } = require("../utility/auth");

router.get("/search", discovery.search);
router.get("/trending", discovery.trending);
router.get("/similar/:id", discovery.similar);
// Owner-or-admin referral stats (ownership resolved inside the controller).
router.get("/referrals/:id", requireAuth, discovery.referralStats);

module.exports = router;
