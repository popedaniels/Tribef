const express = require("express");
const fees = require("../services/fees");
const router = express.Router();

// GET /api/fees/schedule — who pays the card fee and at what rate. The donate
// page runs the same formula; the server re-checks every checkout.
router.get("/schedule", (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).json({ status: 200, data: fees.schedule() });
});

module.exports = router;
