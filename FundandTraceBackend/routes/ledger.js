const express = require("express");
const router = express.Router();
const { objectIdParam } = require("../utility/validate");
const trust = require("../controller/trust");

// Reject malformed ObjectIds with 400 before any handler runs.
router.param("campaignId", objectIdParam("Campaign ID"));

router.get("/:campaignId", trust.ledger);
router.get("/:campaignId/verify", trust.verifyLedger);

module.exports = router;
