const express = require("express");
const router = express.Router();
const { objectIdParam } = require("../utility/validate");

const charityController = require("../controller/charity");

// Reject malformed ObjectIds with 400 before any handler runs.
router.param("id", objectIdParam("Charity ID"));

router.get("/", charityController.getCharities);
router.get("/charity/:id", charityController.getCharity);
router.get("/charity/checkCharity/:regNo", charityController.checkCharity);

module.exports = router;
