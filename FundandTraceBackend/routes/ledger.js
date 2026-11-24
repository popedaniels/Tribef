const express = require("express");
const router = express.Router();
const { objectIdParam } = require("../utility/validate");
const trust = require("../controller/trust");

// Reject malformed ObjectIds with 400 before any handler runs.
router.param("campaignId", objectIdParam("Campaign ID"));

// Daily anchors (static paths first so they aren't parsed as campaign ids).
router.get("/anchors", trust.listAnchors);
router.get("/anchors/:date", trust.getAnchor);

router.get("/:campaignId", trust.ledger);
router.get("/:campaignId/proof", trust.anchorProof);
router.get("/:campaignId/verify", trust.verifyLedger);

module.exports = router;
