// Approximate conversion to GBP for internal dashboards (never for charging).
// Uses services/fx.js (daily live rates, dated fallback). Previously this had
// 2021 rates for GBP/USD/NGN only and returned undefined for anything else,
// which turned dashboard totals into NaN as soon as a KES/GHS/EUR campaign existed.
const fx = require("./services/fx");
const logger = require("./utility/logger");

exports.convertToPounds = (amount, currency) => {
  // Campaigns created before currency was stored are all NGN.
  const from = currency ? String(currency).toUpperCase() : "NGN";
  const value = fx.convert(Number(amount) || 0, from, "GBP");
  if (value === null) {
    logger.warn({ currency: from }, "No FX rate for currency; counted as 0 in GBP totals");
    return 0;
  }
  return Math.trunc(value);
};
