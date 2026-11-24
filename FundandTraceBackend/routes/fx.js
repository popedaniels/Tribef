const express = require("express");
const fx = require("../services/fx");
const router = express.Router();

// GET /api/fx/rates — approximate rates for showing amounts in a visitor's
// own currency. Display only; never used for charging.
router.get("/rates", async (req, res) => {
  const first = fx.snapshot().source === "fallback";
  const pending = fx.refresh();
  // Only the very first call waits (up to 3 s) for live rates.
  if (first) await Promise.race([pending, new Promise((r) => setTimeout(r, 3000))]);
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  return res.status(200).json({ status: 200, data: fx.snapshot() });
});

module.exports = router;
