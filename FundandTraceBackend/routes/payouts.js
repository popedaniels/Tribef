// Bank lists and account-name checks for African bank payouts.
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../utility/auth");
const { listBanks, resolveAccount, COUNTRY_FOR_CURRENCY, railFor } = require("../services/payoutRails");
const logger = require("../utility/logger");

const CACHE_MS = 12 * 60 * 60 * 1000;
const bankCache = new Map();

// GET /api/payouts/options?currency=NGN -> which rail can pay this currency
router.get("/options", (req, res) => {
  const currency = String(req.query.currency || "").toUpperCase();
  const rail = railFor(currency);
  return res.status(200).json({
    data: { currency, rail, country: COUNTRY_FOR_CURRENCY[currency] || null, bankPayoutsAvailable: Boolean(rail) },
  });
});

// GET /api/payouts/banks?country=NG
router.get("/banks", async (req, res) => {
  const country = String(req.query.country || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) {
    return res.status(400).json({ status: 400, error: "country must be a 2-letter ISO code" });
  }
  const cached = bankCache.get(country);
  if (cached && Date.now() - cached.at < CACHE_MS) return res.status(200).json({ data: cached.banks });
  try {
    const banks = await listBanks(country);
    bankCache.set(country, { at: Date.now(), banks });
    res.set("Cache-Control", "public, max-age=3600");
    return res.status(200).json({ data: banks });
  } catch (error) {
    logger.warn({ err: error.response?.data || error.message, country }, "listBanks failed");
    return res.status(error.status || 502).json({ status: error.status || 502, error: "Couldn't load banks right now." });
  }
});

// POST /api/payouts/resolve-account { bankCode, accountNumber }
router.post("/resolve-account", requireAuth, async (req, res) => {
  const bankCode = String(req.body?.bankCode || "");
  const accountNumber = String(req.body?.accountNumber || "").replace(/\s+/g, "");
  if (!bankCode || !/^[0-9A-Za-z]{6,20}$/.test(accountNumber)) {
    return res.status(400).json({ status: 400, error: "bankCode and a valid accountNumber are required" });
  }
  try {
    const result = await resolveAccount({ bankCode, accountNumber });
    if (!result.accountName) return res.status(404).json({ status: 404, error: "Account not found at that bank" });
    return res.status(200).json({ data: result });
  } catch (error) {
    const status = error.status || (error.response?.status === 400 || error.response?.status === 422 ? 404 : 502);
    return res.status(status).json({ status, error: status === 404 ? "Account not found at that bank" : "Couldn't verify the account right now." });
  }
});

module.exports = router;
