#!/usr/bin/env node
// Live FX check (gap 4), run daily by .github/workflows/fx-check.yml:
//  1. Our provider (FX_RATES_SOURCE, default open.er-api.com) answers and
//     parses (services/fx.parseProvider), with every core currency.
//  2. An independent source agrees within FX_CROSS_TOLERANCE (default 5%)
//     on each core currency — catches a stale or broken feed.
//  3. If PRODUCTION_API_URL is set, production serves live, fresh rates.
const axios = require("axios");
const fx = require("../services/fx");

const TOL = Number(process.env.FX_CROSS_TOLERANCE || 0.05);
const PRIMARY = process.env.FX_RATES_SOURCE || "https://open.er-api.com/v6/latest/USD";
const SECOND = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json";
let failed = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "✔" : "✘"} ${msg}`);
  if (!cond) failed += 1;
};

(async () => {
  const primary = fx.parseProvider((await axios.get(PRIMARY, { timeout: 10000 })).data);
  ok(Boolean(primary), `primary source parses (${PRIMARY})`);
  if (!primary) process.exit(1);
  const ageH = (Date.now() - new Date(`${primary.asOf}T00:00:00Z`)) / 36e5;
  ok(ageH <= 48, `primary rates are fresh (as of ${primary.asOf})`);
  for (const c of fx.CORE) ok(primary.ratesToUsd[c] > 0, `primary has ${c}`);

  // Independent source: units of currency per 1 USD, lower-case codes.
  const second = (await axios.get(SECOND, { timeout: 10000 })).data?.usd || {};
  for (const c of fx.CORE) {
    const perUsd = Number(second[c.toLowerCase()]);
    if (!(perUsd > 0)) {
      console.log(`– ${c}: not in the second source`);
      continue;
    }
    const a = 1 / primary.ratesToUsd[c];
    const diff = Math.abs(a / perUsd - 1);
    ok(diff <= TOL, `${c}: ${a.toFixed(c === "GBP" || c === "EUR" ? 4 : 2)} vs ${perUsd.toFixed(c === "GBP" || c === "EUR" ? 4 : 2)} per USD (${(diff * 100).toFixed(2)}% apart)`);
  }

  const api = process.env.PRODUCTION_API_URL;
  if (api) {
    const snap = (await axios.get(`${api.replace(/\/$/, "")}/api/fx/rates`, { timeout: 10000 })).data?.data || {};
    ok(snap.source === "live", `production serves live rates (source: ${snap.source})`);
    ok(!snap.stale, `production rates are fresh (as of ${snap.asOf})`);
  }
  console.log(failed ? `\nFAILED: ${failed} check(s)` : "\nPASSED");
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error("fx-check error:", e.message);
  process.exit(1);
});
