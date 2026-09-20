const express = require("express");
const router = express.Router();

const charityController = require("../controller/charity");

router.get("/", charityController.getCharities);
router.get("/charity/:id", charityController.getCharity);
router.get("/charity/checkCharity/:regNo", charityController.checkCharity);

module.exports = router;
