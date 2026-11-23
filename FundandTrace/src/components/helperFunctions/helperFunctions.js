import axios from "axios";
import { getApiBaseUrl } from "../../utils/api";

const getTimeDiff = (timestamp) => {
  let currentTime = new Date().getTime();
  let time = isNaN(Number(timestamp))
    ? new Date(timestamp).getTime()
    : Number(timestamp);
  let diff = currentTime - time;

  const howLong = Math.floor(diff / (1000 * 60 * 60));

  return howLong < 1
    ? getMin(diff)
    : howLong < 24
    ? `${howLong}h`
    : getDays(howLong);
};

const getMin = (diff) => {
  let mins = Math.floor(diff / (1000 * 60));
  return `${mins}m`;
};

const getDays = (hour) => {
  let days = Math.floor(hour / 24);
  return `${days}d`;
};

/**
 * Compute days remaining for a campaign based on launched date + duration.
 * When a campaign is launched, its createdAt is reset to the launch timestamp
 * (see startCampaignController.launch). For draft/prelaunch campaigns without
 * a launch date, the planned duration is returned instead.
 *
 * @param {object|null} campaign - Campaign document or object
 * @returns {number} Days remaining (0 if expired), or the planned duration if not yet launched.
 */
const getDaysRemaining = (campaign) => {
  if (!campaign) return 0;

  const duration = Number(campaign?.basicInformation?.duration || campaign?.duration) || 30;
  const createdAt = campaign?.createdAt;

  // Draft/prelaunch campaigns haven't been launched yet — show planned duration.
  if (!createdAt) return duration;

  const launchDate = new Date(createdAt).getTime();
  if (isNaN(launchDate)) return duration;

  const now = Date.now();
  const diffMs = now - launchDate;
  const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const remaining = duration - daysElapsed;

  return remaining > 0 ? remaining : 0;
};

const config = () => {
  // Read the persisted admin session defensively: sessionStorage may be empty
  // (no admin logged in), contain malformed JSON (stale/partial write), or a
  // payload without a JWT. In every case return a bare config so the request
  // proceeds unauthenticated and the backend's 401/403 drives the UX, instead
  // of crashing the calling page with a TypeError.
  let JWT = "";
  try {
    const authState = sessionStorage.getItem("persist:adminAuthStateReducer");
    if (authState) {
      const parsed = JSON.parse(authState);
      if (parsed && typeof parsed.JWT === "string") {
        JWT = parsed.JWT.replace(/\"/g, "");
      }
    }
  } catch {
    JWT = "";
  }

  const configg = {
    headers: JWT
      ? {
          Authorization: "Bearer " + JWT,
        }
      : {},
  };
  return configg;
};

const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append("upload_preset", "campaignImage");
    formData.append("file", file);
    const url = await axios.post(
      "https://api.Cloudinary.com/v1_1/wisdomosara/image/upload",
      formData
    );
    return await previewFile(file, url);
  } catch (error) {
    throw error instanceof Error ? error : new Error("Image upload failed");
  }
};

const previewFile = (file, url) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve({ file: reader.result, url });
    reader.onerror = () => reject(new Error("Unable to preview uploaded image"));
    reader.readAsDataURL(file);
  });

const CURRENCY_SYMBOLS = {
  USD: "$",
  GBP: "£",
  NGN: "₦",
  KES: "KSh ",
  GHS: "GH₵",
  EUR: "€",
  CAD: "CA$",
  AUD: "AU$",
  ZAR: "R ",
};

// Base exchange rates relative to USD for instant client-side dual currency previews.
// Filled at build/runtime from NEXT_PUBLIC_FX_RATES_JSON (e.g. '{"USD":1,"GBP":0.79,"NGN":1550}') or fallback.
// This indirection removes hardcoded drift: deploy-time rates win, in-memory fallback keeps UI instant.
// Last updated fallback: 2026-01 – refresh via scripts/update-fx-rates.js or env override.
const DEFAULT_RATES_TO_USD = {
  USD: 1.0,
  GBP: 1.28,
  EUR: 1.08,
  NGN: 0.00065,
  KES: 0.0077,
  GHS: 0.065,
  CAD: 0.74,
  AUD: 0.65,
  ZAR: 0.055,
  UGX: 0.00027,
  TZS: 0.00038,
  RWF: 0.00072,
  XOF: 0.0016,
  XAF: 0.0016,
  EGP: 0.02,
  SEK: 0.095,
  CHF: 1.13,
  AED: 0.27,
  INR: 0.012,
};

const parseEnvRates = () => {
  try {
    const raw = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_FX_RATES_JSON : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const cleaned = {};
      for (const [k, v] of Object.entries(parsed)) {
        const key = String(k).toUpperCase().trim();
        const num = Number(v);
        if (key && Number.isFinite(num) && num > 0) cleaned[key] = num;
      }
      if (Object.keys(cleaned).length) return cleaned;
    }
  } catch {}
  return null;
};

const APPROX_RATES_TO_USD = { ...DEFAULT_RATES_TO_USD, ...(parseEnvRates() || {}) };

// Allow runtime live-rate refresh without rebuild (best-effort, no await in sync helpers).
let liveRatesLoaded = false;
// Date of the rates in use, shown next to estimates ("rate from 24 Nov").
let ratesAsOf = "2026-01-15";
const getRatesAsOf = () => ratesAsOf;
/** Load live display rates once; resolves when done (or immediately if unavailable). */
const loadLiveRates = () => {
  maybeLoadLiveRates();
  return liveRatesPromise || Promise.resolve();
};
let liveRatesPromise = null;
const maybeLoadLiveRates = () => {
  if (liveRatesLoaded || typeof window === "undefined" || typeof fetch === "undefined") return;
  liveRatesLoaded = true;
  // Default: our API's daily rates (GET /api/fx/rates → { data: { ratesToUsd, asOf } }).
  const endpoint = process.env.NEXT_PUBLIC_FX_RATES_URL || `${getApiBaseUrl()}/api/fx/rates`;
  liveRatesPromise = fetch(endpoint)
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data || typeof data !== "object") return;
      if (data.data?.asOf) ratesAsOf = data.data.asOf;
      const src = data.data?.ratesToUsd || data.rates || data;
      for (const [k, v] of Object.entries(src)) {
        const key = String(k).toUpperCase().trim();
        const num = Number(v);
        if (key && Number.isFinite(num) && num > 0) APPROX_RATES_TO_USD[key] = num;
      }
    })
    .catch(() => {});
};

const getCurrency = (currency) => {
  if (!currency) return "$";
  const upper = String(currency).toUpperCase().trim();
  return CURRENCY_SYMBOLS[upper] || upper;
};

/**
 * Symbol to put before an amount: "₦", "$", "£", "KSh ", "GH₵", "XOF ".
 * Missing currency keeps the historical default (₦): older campaigns were
 * created before currency was stored and are all NGN.
 */
const currencyPrefix = (currency) => {
  if (!currency) return "₦";
  const sym = String(getCurrency(currency)).trim();
  return /[A-Za-z]$/.test(sym) ? `${sym} ` : sym;
};

const formatCurrencyAmount = (amount, currency = "USD") => {
  const num = Number(amount) || 0;
  const upper = String(currency).toUpperCase();
  const isZeroDecimal = ["NGN", "JPY", "KES"].includes(upper);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(num);
};

const getDualCurrencyEstimate = (amount, baseCurrency = "USD", targetCurrency = "GBP") => {
  maybeLoadLiveRates();
  const num = Number(amount) || 0;
  if (num <= 0 || !baseCurrency || !targetCurrency) return null;
  const base = String(baseCurrency).toUpperCase();
  const target = String(targetCurrency).toUpperCase();
  if (base === target) return null;

  // Unknown currency → no estimate (it used to be treated as USD, so UGX 50,000 showed as ~$50,000).
  const baseRate = APPROX_RATES_TO_USD[base];
  const targetRate = APPROX_RATES_TO_USD[target];
  if (!baseRate || !targetRate) return null;

  // Convert amount from base to USD, then from USD to target
  const inUSD = num * baseRate;
  const inTarget = inUSD / targetRate;

  return {
    symbol: getCurrency(target),
    amount: formatCurrencyAmount(inTarget, target),
    currency: target,
  };
};

const getProcessorFeeEstimate = (amount, currency = "GBP", paymentMethod = "stripe") => {
  const num = Number(amount) || 0;
  if (num <= 0) return { platformFee: 0, processorFee: 0, total: 0 };
  const curr = String(currency).toUpperCase();

  let processorFee = 0;
  if (paymentMethod === "paystack") {
    // Paystack: 1.5% + ₦100 for local NGN, capped at ₦2000
    // 3.9% for international cards
    if (curr === "NGN") {
      processorFee = Math.min(num * 0.015 + 100, 2000);
    } else {
      processorFee = num * 0.039;
    }
  } else if (paymentMethod === "flutterwave") {
    // 1.4% local African, capped at ₦2000 for NGN
    if (curr === "NGN") {
      processorFee = Math.min(num * 0.014, 2000);
    } else {
      processorFee = num * 0.014;
    }
  } else {
    // Stripe: 1.4% + 20p for UK/GBP, 2.9% + 30c for USD/Intl
    if (curr === "GBP") {
      processorFee = num * 0.014 + 0.20;
    } else if (curr === "EUR") {
      processorFee = num * 0.014 + 0.25;
    } else {
      processorFee = num * 0.029 + 0.30;
    }
  }

  return {
    platformFee: 0, // 100% free platform fee
    processorFee: Number(processorFee.toFixed(2)),
    total: Number((num + processorFee).toFixed(2)),
  };
};

const getPresetDonationAmounts = (currency = "GBP") => {
  const curr = String(currency).toUpperCase();
  switch (curr) {
    case "NGN":
      return [5000, 15000, 50000, 100000];
    case "KES":
      return [1000, 3000, 10000, 25000];
    case "GHS":
      return [100, 250, 500, 1000];
    case "GBP":
      return [10, 25, 50, 100];
    case "EUR":
      return [10, 30, 75, 150];
    case "USD":
    default:
      return [15, 50, 100, 250];
  }
};

const formatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const addCommaToNumber = (number) => {
  return formatter.format(number);
};

const AFRICAN_COUNTRIES = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "Uganda",
  "Rwanda",
  "Tanzania",
  "Egypt",
];

/**
 * Location-aware payment rail selection (FT-001).
 * Nigeria → Paystack, other African countries → Flutterwave, everywhere else → Stripe.
 * @param {string|null|undefined} countryName
 * @returns {"paystack" | "flutterwave" | "stripe"}
 */
const selectPaymentRail = (countryName) => {
  const name = String(countryName || "").trim().toLowerCase();
  if (name === "nigeria") return "paystack";
  if (AFRICAN_COUNTRIES.some((c) => c.toLowerCase() === name)) return "flutterwave";
  return "stripe";
};

/**
 * Format money for display: "₦12,640,000", "$11,870", "£9.40", "KSh 384,000".
 * Never returns NaN/undefined — bad input renders as 0 in the given currency.
 * Whole amounts drop decimals; `compact` gives "₦12.6M" for tight spaces.
 */
const formatMoney = (amount, currency = "USD", { compact = false } = {}) => {
  const num = Number(amount);
  const value = Number.isFinite(num) ? num : 0;
  const code = String(currency || "USD").toUpperCase().trim();
  const symbol = CURRENCY_SYMBOLS[code] ?? `${code} `;
  const whole = Number.isInteger(value) || Math.abs(value) >= 1000;
  const formatted = new Intl.NumberFormat("en-US", compact
    ? { notation: "compact", maximumFractionDigits: 1 }
    : { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(Math.abs(value));
  return `${value < 0 ? "−" : ""}${symbol}${formatted}`;
};

/** Short relative time: "just now", "5m ago", "3h ago", "2d ago", or a date. */
const timeAgo = (date, now = Date.now()) => {
  const t = new Date(date).getTime();
  if (!Number.isFinite(t)) return "";
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 30 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const grabErrorMessage = (error) => {
  const message = error?.response?.data?.error;
  return message;
};

const grabErrorStatus = (error) => {
  const status = error?.response?.status;
  return status;
};

export {
  getTimeDiff,
  getDaysRemaining,
  config,
  uploadImage,
  getCurrency,
  formatCurrencyAmount,
  getDualCurrencyEstimate,
  getProcessorFeeEstimate,
  getPresetDonationAmounts,
  addCommaToNumber,
  formatMoney,
  currencyPrefix,
  timeAgo,
  selectPaymentRail,
  grabErrorMessage,
  grabErrorStatus,
  getRatesAsOf,
  loadLiveRates,
};

