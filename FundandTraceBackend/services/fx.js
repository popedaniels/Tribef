// Approximate exchange rates for DISPLAY and internal reporting only.
// Never used to decide what a donor is charged or what a campaign is
// credited: money always moves in the campaign's own currency.
//
// Rates are "USD per one unit" (GBP 1.27 means £1 = $1.27). Live rates come
// from FX_RATES_SOURCE (default: open.er-api.com, free, no key, updated daily)
// at most every FX_REFRESH_HOURS; if that fails we keep the last good rates,
// then the dated fallback table below. Callers never wait on the network
// except the first /api/fx/rates request, which waits up to 3 s.
const axios = require("axios");
const logger = require("../utility/logger");

// Fallback, dated so the UI can say how old it is. Refresh when you touch this file.
const FALLBACK = {
  asOf: "2026-01-15",
  ratesToUsd: {
    USD: 1,
    GBP: 1.28,
    EUR: 1.08,
    NGN: 0.00065,
    KES: 0.0077,
    GHS: 0.065,
    UGX: 0.00027,
    TZS: 0.00038,
    RWF: 0.00072,
    ZAR: 0.055,
    ZMW: 0.037,
    XOF: 0.0016,
    XAF: 0.0016,
    EGP: 0.02,
    CAD: 0.74,
    AUD: 0.65,
  },
};

const state = { ratesToUsd: { ...FALLBACK.ratesToUsd }, asOf: FALLBACK.asOf, source: "fallback", fetchedAt: 0, inflight: null };
const refreshMs = () => Math.max(1, Number(process.env.FX_REFRESH_HOURS || 12)) * 3600 * 1000;

/** Parse common provider shapes into ratesToUsd. Exported for tests. */
function parseProvider(data) {
  if (!data || typeof data !== "object") return null;
  const base = String(data.base_code || data.base || "USD").toUpperCase();
  const perBase = data.rates || data.conversion_rates;
  if (!perBase || typeof perBase !== "object") return null;
  const baseInUsd = base === "USD" ? 1 : 1 / Number(perBase.USD);
  if (!Number.isFinite(baseInUsd) || baseInUsd <= 0) return null;
  const out = {};
  for (const [code, perUnitOfBase] of Object.entries(perBase)) {
    const n = Number(perUnitOfBase);
    if (/^[A-Z]{3}$/.test(code) && Number.isFinite(n) && n > 0) out[code] = baseInUsd / n;
  }
  if (!out.GBP || !out.NGN) return null; // sanity: must cover our core currencies
  const asOf = data.time_last_update_unix ? new Date(data.time_last_update_unix * 1000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  return { ratesToUsd: out, asOf };
}

async function refresh({ http = axios, force = false } = {}) {
  if (process.env.NODE_ENV === "test" && !force) return state;
  if (!force && Date.now() - state.fetchedAt < refreshMs()) return state;
  if (state.inflight) return state.inflight;
  const url = process.env.FX_RATES_SOURCE || "https://open.er-api.com/v6/latest/USD";
  state.inflight = http
    .get(url, { timeout: 5000 })
    .then((res) => {
      const parsed = parseProvider(res.data);
      if (!parsed) throw new Error("unrecognised FX response");
      Object.assign(state, { ratesToUsd: { ...FALLBACK.ratesToUsd, ...parsed.ratesToUsd }, asOf: parsed.asOf, source: "live" });
      return state;
    })
    .catch((err) => {
      logger.warn({ err: String(err.message || err) }, "FX refresh failed; keeping previous rates");
      return state;
    })
    .finally(() => {
      state.fetchedAt = Date.now();
      state.inflight = null;
    });
  return state.inflight;
}

const rateToUsd = (code) => state.ratesToUsd[String(code || "").toUpperCase()];

/**
 * Convert for display/reporting. Unknown currency → null (callers decide),
 * never NaN. Kicks off a background refresh when rates are stale.
 */
function convert(amount, from, to) {
  refresh().catch(() => {});
  const a = Number(amount);
  const f = rateToUsd(from);
  const t = rateToUsd(to);
  if (!Number.isFinite(a) || !f || !t) return null;
  return (a * f) / t;
}

const snapshot = () => ({ base: "USD", ratesToUsd: { ...state.ratesToUsd }, asOf: state.asOf, source: state.source });

/** Test helper. */
function _set(ratesToUsd, asOf = "2026-11-01", source = "live") {
  Object.assign(state, { ratesToUsd: { ...FALLBACK.ratesToUsd, ...ratesToUsd }, asOf, source, fetchedAt: Date.now() });
}

module.exports = { FALLBACK, parseProvider, refresh, convert, snapshot, _set };
