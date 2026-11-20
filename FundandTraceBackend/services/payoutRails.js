// Bank payout rails for African currencies (gap E-6).
//
//   Stripe Connect  — GBP / USD / EUR to the organiser's Express account
//   Flutterwave     — POST /v3/transfers  (NGN, GHS, KES, UGX, TZS, ZAR, RWF, XAF, XOF…)
//   Paystack        — POST /transferrecipient → POST /transfer  (NGN, GHS, ZAR, KES)
//
// Transfers are asynchronous at both providers: the final state arrives by
// webhook (Flutterwave `transfer.completed`, Paystack `transfer.success` /
// `transfer.failed` / `transfer.reversed`) and is applied by
// applyTransferOutcome() in controller/donations/payout.js.
//
// References are deterministic per funding request so a retried call can't
// create a second transfer: Flutterwave rejects duplicate references and
// Paystack requires 16–50 character unique references.

const axios = require("axios");

const FLW_BASE = "https://api.flutterwave.com/v3";
const PAYSTACK_BASE = "https://api.paystack.co";

const FLUTTERWAVE_CURRENCIES = ["NGN", "GHS", "KES", "UGX", "TZS", "ZAR", "RWF", "XAF", "XOF", "ZMW", "MWK", "EGP"];
const PAYSTACK_CURRENCIES = ["NGN", "GHS", "ZAR", "KES"];

// ISO country used by the bank-list endpoints for each payout currency.
const COUNTRY_FOR_CURRENCY = {
  NGN: "NG",
  GHS: "GH",
  KES: "KE",
  UGX: "UG",
  TZS: "TZ",
  ZAR: "ZA",
  RWF: "RW",
  XAF: "CM",
  XOF: "SN",
  ZMW: "ZM",
  MWK: "MW",
  EGP: "EG",
};
const PAYSTACK_COUNTRY_NAMES = { NG: "nigeria", GH: "ghana", ZA: "south africa", KE: "kenya" };
const PAYSTACK_RECIPIENT_TYPE = { NGN: "nuban", GHS: "ghipss", ZAR: "basa", KES: "mobile_money" };

const flwConfigured = () => Boolean(process.env.FLUTTERWAVE);
const paystackConfigured = () => Boolean(process.env.PAYSTACK_SECRET);

const flw = () =>
  axios.create({
    baseURL: FLW_BASE,
    timeout: 20000,
    headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE}` },
  });
const paystack = () =>
  axios.create({
    baseURL: PAYSTACK_BASE,
    timeout: 20000,
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` },
  });

/** Which bank rail can pay this currency? Flutterwave first (wider coverage). */
function railFor(currency) {
  const c = String(currency || "").toUpperCase();
  if (FLUTTERWAVE_CURRENCIES.includes(c) && flwConfigured()) return "flutterwave";
  if (PAYSTACK_CURRENCIES.includes(c) && paystackConfigured()) return "paystack";
  return null;
}

const payoutReference = (fundingRequestId) => `ft-payout-${fundingRequestId}`; // 34 chars

/**
 * Start a bank transfer.
 * @returns {{provider, reference, providerId, status}} status: "pending" | "successful" | "failed"
 */
async function sendBankTransfer({ fundingRequestId, amount, currency, bankCode, accountNumber, accountName, narration }) {
  const c = String(currency || "").toUpperCase();
  const rail = railFor(c);
  if (!rail) {
    const err = new Error(`No bank payout rail is configured for ${c}`);
    err.status = 422;
    throw err;
  }
  if (!bankCode || !accountNumber) {
    const err = new Error("Bank code and account number are required for a bank payout");
    err.status = 422;
    throw err;
  }
  const reference = payoutReference(fundingRequestId);

  if (rail === "flutterwave") {
    const { data } = await flw().post("/transfers", {
      account_bank: String(bankCode),
      account_number: String(accountNumber),
      amount: Math.round(Number(amount) * 100) / 100,
      currency: c,
      debit_currency: c,
      narration: String(narration || "Fund&Trace payout").slice(0, 100),
      reference,
      ...(process.env.BACKENDURL ? { callback_url: `${process.env.BACKENDURL}/api/donations/flutterwave-webhook` } : {}),
    });
    const t = data?.data || {};
    return {
      provider: "flutterwave",
      reference,
      providerId: String(t.id || ""),
      status: /fail/i.test(t.status || "") ? "failed" : /success/i.test(t.status || "") ? "successful" : "pending",
    };
  }

  // Paystack: recipient, then transfer.
  const { data: recipientResp } = await paystack().post("/transferrecipient", {
    type: PAYSTACK_RECIPIENT_TYPE[c] || "nuban",
    name: String(accountName || "Beneficiary").slice(0, 100),
    account_number: String(accountNumber),
    bank_code: String(bankCode),
    currency: c,
  });
  const recipient = recipientResp?.data?.recipient_code;
  const { data } = await paystack().post("/transfer", {
    source: "balance",
    amount: Math.round(Number(amount) * 100),
    recipient,
    reference,
    currency: c,
    reason: String(narration || "Fund&Trace payout").slice(0, 100),
  });
  const t = data?.data || {};
  return {
    provider: "paystack",
    reference,
    providerId: String(t.transfer_code || t.id || ""),
    status: t.status === "success" ? "successful" : t.status === "failed" ? "failed" : "pending",
  };
}

/** Banks for a payout country, normalised to [{code, name}]. */
async function listBanks(country) {
  const cc = String(country || "").toUpperCase();
  if (flwConfigured()) {
    const { data } = await flw().get(`/banks/${encodeURIComponent(cc)}`);
    return (data?.data || []).map((b) => ({ code: String(b.code), name: b.name })).sort((a, b) => a.name.localeCompare(b.name));
  }
  if (paystackConfigured() && PAYSTACK_COUNTRY_NAMES[cc]) {
    const { data } = await paystack().get("/bank", { params: { country: PAYSTACK_COUNTRY_NAMES[cc], perPage: 500 } });
    return (data?.data || []).map((b) => ({ code: String(b.code), name: b.name })).sort((a, b) => a.name.localeCompare(b.name));
  }
  const err = new Error("No payout provider is configured");
  err.status = 503;
  throw err;
}

/** Look up the account holder's name so organisers can confirm before saving. */
async function resolveAccount({ bankCode, accountNumber }) {
  if (flwConfigured()) {
    const { data } = await flw().post("/accounts/resolve", {
      account_number: String(accountNumber),
      account_bank: String(bankCode),
    });
    return { accountName: data?.data?.account_name || "" };
  }
  if (paystackConfigured()) {
    const { data } = await paystack().get("/bank/resolve", {
      params: { account_number: String(accountNumber), bank_code: String(bankCode) },
    });
    return { accountName: data?.data?.account_name || "" };
  }
  const err = new Error("No payout provider is configured");
  err.status = 503;
  throw err;
}

module.exports = {
  railFor,
  sendBankTransfer,
  listBanks,
  resolveAccount,
  payoutReference,
  COUNTRY_FOR_CURRENCY,
  FLUTTERWAVE_CURRENCIES,
  PAYSTACK_CURRENCIES,
};
