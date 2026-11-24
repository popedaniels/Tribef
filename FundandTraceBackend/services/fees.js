// Who pays the card/processing fee, and how much.
//
// Fund&Trace charges NO platform fee. The payment processor's fee is either
// added to what the donor pays (so the campaign receives 100% of the gift), or
// offered as an opt-in, depending on the payment method and the law where the
// donor pays:
//
//   • Paystack / Flutterwave (Nigeria, Ghana, Kenya…): the fee is ADDED to the
//     donor's total at cost, shown before they pay ("required").
//   • Stripe (UK/EU/US cards): adding a surcharge for paying by consumer card
//     is banned in the UK (Consumer Rights (Payment Surcharges) Regulations
//     2012; the ban covers donations) and the EU, and a pre-ticked "extra"
//     isn't valid consent (Consumer Contracts Regulations 2013 reg. 40). So the
//     donor is OFFERED an unticked "cover the card fee" option ("optional").
//
// Rates are the processors' published LOCAL rates (checked 24 Nov 2026), so a
// donor is never charged more than the fee would be on a local card; when a
// foreign card costs more, the platform absorbs the difference. Override any
// rule with FEE_SCHEDULE_JSON (same shape as RULES) and the mode per rail with
// FEE_MODE_PAYSTACK / FEE_MODE_FLUTTERWAVE / FEE_MODE_STRIPE (required |
// optional | off). The frontend fetches GET /api/fees/schedule and runs the
// same formula, and the server re-computes and rejects any mismatch.

const round2 = (n) => Math.round(Number(n) * 100) / 100;

// pct in percent; fixed/cap/waiveFixedBelow in the charge currency.
const RULES = {
  paystack: {
    NGN: { pct: 1.5, fixed: 100, waiveFixedBelow: 2500, cap: 2000, label: "Paystack, Nigerian cards/bank: 1.5% + ₦100 (₦100 waived under ₦2,500), capped at ₦2,000" },
    GHS: { pct: 1.95, label: "Paystack Ghana: 1.95% (cards and mobile money)" },
    KES: { pct: 2.9, label: "Paystack Kenya: 2.9% on cards", methods: { mpesa: { pct: 1.5, label: "Paystack Kenya: 1.5% on M-PESA" } } },
    ZAR: { pct: 2.9, fixed: 1, label: "Paystack South Africa: 2.9% + R1" },
    USD: { pct: 3.9, label: "Paystack, USD cards: 3.9%" },
  },
  flutterwave: {
    NGN: { pct: 2.0, cap: 2000, label: "Flutterwave Nigeria: 2% (1.4% + 0.6%), capped at ₦2,000" },
    "*": { pct: 2.9, label: "Flutterwave: 2.9% (cards and mobile money outside Nigeria)" },
  },
  stripe: {
    GBP: {
      pct: 1.5,
      fixed: 0.2,
      label: "Stripe, UK cards: 1.5% + 20p",
      byDonorRegion: {
        eea: { pct: 2.5, fixed: 0.2, label: "Stripe, EEA cards: 2.5% + 20p" },
        intl: { pct: 3.25, fixed: 0.2, label: "Stripe, international cards: 3.25% + 20p" },
      },
    },
    USD: { pct: 3.25, fixed: 0.25, fx: 2, label: "Stripe, cards in USD: 3.25% + 2% conversion + ~20p" },
    NGN: { pct: 3.25, fixed: 0, fx: 2, label: "Stripe, cards in NGN: 3.25% + 2% conversion" },
  },
};

const DEFAULT_MODES = { paystack: "required", flutterwave: "required", stripe: "optional" };
const MODES = ["required", "optional", "off"];

const EEA = new Set("AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO".split(" "));

function rules() {
  if (!process.env.FEE_SCHEDULE_JSON) return RULES;
  try {
    const over = JSON.parse(process.env.FEE_SCHEDULE_JSON);
    const merged = JSON.parse(JSON.stringify(RULES));
    for (const [rail, byCur] of Object.entries(over || {})) merged[rail] = { ...(merged[rail] || {}), ...byCur };
    return merged;
  } catch {
    return RULES;
  }
}

function modeFor(rail) {
  const v = String(process.env[`FEE_MODE_${String(rail).toUpperCase()}`] || "").toLowerCase();
  return MODES.includes(v) ? v : DEFAULT_MODES[rail] || "off";
}

/** The rule that applies (rail, currency, payment method, donor country). */
function ruleFor({ rail, currency, method = "", donorCountry = "" }) {
  const byCur = rules()[rail];
  if (!byCur) return null;
  const cur = String(currency || "").toUpperCase();
  let rule = byCur[cur] || byCur["*"];
  if (!rule) return null;
  if (method && rule.methods?.[method]) rule = { ...rule, ...rule.methods[method] };
  const cc = String(donorCountry || "").toUpperCase();
  if (rule.byDonorRegion && cc && cc !== "GB") {
    rule = { ...rule, ...(EEA.has(cc) ? rule.byDonorRegion.eea : rule.byDonorRegion.intl) };
  }
  return rule;
}

/**
 * Fee such that, after the processor takes its cut of the TOTAL, the campaign
 * (and tip) receive exactly `base`. Pure and deterministic; the frontend has
 * an identical copy (src/utils/fees.ts) checked against shared fixtures.
 */
function grossUp(base, rule) {
  const b = Number(base);
  if (!(b > 0) || !rule) return 0;
  const p = (Number(rule.pct || 0) + Number(rule.fx || 0)) / 100;
  const fixed = Number(rule.fixed || 0);
  const solve = (f) => (b + f) / (1 - p);
  let total = solve(fixed);
  // Paystack NG waives the flat fee on small charges.
  if (rule.waiveFixedBelow && solve(0) < rule.waiveFixedBelow) total = solve(0);
  let fee = total - b;
  if (rule.cap && fee > rule.cap) fee = rule.cap;
  // Round UP to the cent so the campaign is never short by rounding.
  return Math.ceil(fee * 100 - 1e-9) / 100;
}

/**
 * Fee for a checkout.
 * @returns {{mode, fee, rule:{pct,fixed,cap,label}|null}}
 *   fee is what is ADDED to the donor's total (0 when mode is off, or
 *   optional and the donor didn't opt in).
 */
function quote({ rail, currency, base, coverFee = false, method = "", donorCountry = "" }) {
  const mode = modeFor(rail);
  const rule = ruleFor({ rail, currency, method, donorCountry });
  const full = grossUp(base, rule);
  const applies = mode === "required" || (mode === "optional" && coverFee === true);
  return { mode, fee: applies ? full : 0, offered: full, rule: rule ? { pct: rule.pct, fixed: rule.fixed || 0, cap: rule.cap || null, fx: rule.fx || 0, label: rule.label } : null };
}

/**
 * Validate the client's view of the fee against ours. Returns the fee to use,
 * or throws {status:400, code:"fee_mismatch"}.
 */
function checkClientFee({ clientFee, ...q }) {
  const { fee } = quote(q);
  const c = Number(clientFee || 0);
  if (!Number.isFinite(c) || Math.abs(c - fee) > 0.01) {
    const err = new Error(`The card fee changed to ${fee.toFixed(2)}. Please review your donation and try again.`);
    err.status = 400;
    err.code = "fee_mismatch";
    err.expectedFee = fee;
    throw err;
  }
  return fee;
}

/** Public schedule for the donate page (same numbers the server uses). */
function schedule() {
  const r = rules();
  return {
    platformFeePercent: 0,
    modes: { paystack: modeFor("paystack"), flutterwave: modeFor("flutterwave"), stripe: modeFor("stripe") },
    rules: r,
    eea: [...EEA],
    checkedOn: "2026-11-24",
  };
}

/**
 * Split a verified gateway total into what the campaign gets. Every webhook
 * and redirect handler uses this, so the arithmetic lives in one place.
 * `donation` is the credited amount from metadata when present; otherwise it
 * is derived from the total (Flutterwave carries the total in meta.amount).
 */
function splitTotal({ total, donation, tip = 0, fee = 0 }) {
  const t = round2(total);
  const tp = round2(tip || 0);
  const f = round2(fee || 0);
  const d = donation === undefined || donation === null ? round2(t - tp - f) : round2(donation);
  const ok = [t, tp, f, d].every(Number.isFinite) && tp >= 0 && f >= 0 && d > 0 && Math.abs(t - (d + tp + f)) <= 0.01;
  return { ok, donation: d, tip: tp, fee: f, total: t };
}

/**
 * Estimated processor cost of a charge of `total` (for margin reporting).
 * Without the donor's card country, Stripe is costed at the domestic rate, so
 * this is a lower bound for foreign cards.
 */
function processorCost({ rail, currency, total, method = "", donorCountry = "" }) {
  const rule = ruleFor({ rail, currency, method, donorCountry });
  const t = Number(total);
  if (!rule || !(t > 0)) return 0;
  const p = (Number(rule.pct || 0) + Number(rule.fx || 0)) / 100;
  const fixed = rule.waiveFixedBelow && t < rule.waiveFixedBelow ? 0 : Number(rule.fixed || 0);
  let cost = t * p + fixed;
  if (rule.cap && cost > rule.cap) cost = rule.cap;
  return round2(cost);
}

module.exports = { RULES, DEFAULT_MODES, grossUp, quote, checkClientFee, schedule, splitTotal, ruleFor, modeFor, round2, processorCost };
