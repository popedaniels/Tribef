const express = require("express");
const router = express.Router();

const waitlistController = require("../controller/waitlist");

router.post("/:email", waitlistController.addEmail);

module.exports = router;
