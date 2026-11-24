#!/usr/bin/env node
// Provider sandbox checks: run the app's own payment code against the REAL
// Stripe / Paystack / Flutterwave test-mode APIs. Unit tests mock providers,
// so they can't catch a request the provider rejects; this does.
//
// Two parts (run either or both):
//
// 1) Provider contract — no database needed. Uses services/payoutRails.js
//    and the Stripe SDK directly with your TEST keys:
//      node scripts/sandbox-e2e.js contract [--country NG] [--bank-code 044 --account 0690000031]
//    (take a test bank code + account number from the provider's test-data docs)
//
// 2) Checkout end to end — against a running staging API with a test campaign:
//      node scripts/sandbox-e2e.js checkout --api https://staging-api.example.com --campaign <id> [--wait 10]
//    Starts a checkout on every rail that supports the campaign's currency,
//    prints the payment links (pay with the providers' test cards), then polls
//    the public ledger until each donation is credited, proving that
//    webhook → credit → ledger works.
//
// Refuses to run with live keys. Exit code 0 = all passed.
require("dotenv").config();

const args = process.argv.slice(2);
const mode = args[0];
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i > -1 ? args[i + 1] : def;
};

const results = [];
const pass = (name, detail = "") => (results.push({ ok: true, name }), console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`));
const fail = (name, err) => {
  const msg = err?.response?.data ? JSON.stringify(err.response.data).slice(0, 300) : err?.message || String(err);
  results.push({ ok: false, name, msg });
  console.log(`  ✗ ${name} — ${msg}`);
};
const skip = (name, why) => console.log(`  – ${name} (skipped: ${why})`);

function assertTestKeys() {
  const live = [];
  const stripe = process.env.STRIPE_SECRET_KEY || process.env.STRIPESECRET || "";
  if (/^sk_live_|^rk_live_/.test(stripe)) live.push("Stripe");
  if (/^sk_live_/.test(process.env.PAYSTACK_SECRET || "")) live.push("Paystack");
  const flw = process.env.FLUTTERWAVE || process.env.FLW_SECRET_KEY || "";
  if (flw && !/_TEST/i.test(flw)) live.push("Flutterwave");
  if (live.length) {
    console.error(`Refusing to run: live keys detected for ${live.join(", ")}. Use test-mode keys only.`);
    process.exit(2);
  }
}

async function contract() {
  const rails = require("../services/payoutRails");
  const country = String(opt("country", "NG")).toUpperCase();
  console.log(`\nProvider contract (${country})`);

  // Banks list (Flutterwave if configured, else Paystack).
  let banks = [];
  try {
    banks = await rails.listBanks(country);
    if (!Array.isArray(banks) || !banks.length) throw new Error("empty bank list");
    if (!banks.every((b) => b.code && b.name)) throw new Error("banks missing code/name");
    pass("List banks", `${banks.length} banks`);
  } catch (e) {
    fail("List banks", e);
  }

  const bankCode = opt("bank-code");
  const account = opt("account");
  if (bankCode && account) {
    try {
      const r = await rails.resolveAccount({ bankCode, accountNumber: account });
      if (!r?.accountName) throw new Error("no account name returned");
      pass("Resolve account name", r.accountName);
    } catch (e) {
      fail("Resolve account name", e);
    }
    const currency = { NG: "NGN", GH: "GHS", KE: "KES", ZA: "ZAR" }[country] || "NGN";
    try {
      const t = await rails.sendBankTransfer({
        fundingRequestId: `sandbox${Date.now()}`,
        amount: 100,
        currency,
        bankCode,
        accountNumber: account,
        accountName: "Sandbox Test",
        narration: "Fund&Trace sandbox check",
      });
      if (!t?.reference) throw new Error("no reference returned");
      pass("Bank transfer accepted", `${t.provider} ${t.reference} status=${t.status}`);
    } catch (e) {
      fail("Bank transfer accepted", e);
    }
  } else {
    skip("Resolve account + bank transfer", "pass --bank-code and --account from the provider's test data");
  }

  // Stripe: the same session shape createStripeSession builds, plus a refund
  // with an idempotency key (as services/refunds.js does).
  const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPESECRET;
  if (stripeKey) {
    const stripe = require("stripe")(stripeKey);
    try {
      const s = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [{ price_data: { currency: "gbp", product_data: { name: "Fund&Trace sandbox donation" }, unit_amount: 2150 }, quantity: 1 }],
        metadata: { campaignId: "sandbox", tip: "1.50", amount: "20.00" },
        success_url: "https://example.com/ok",
        cancel_url: "https://example.com/cancel",
      });
      pass("Stripe Checkout session", s.id);
    } catch (e) {
      fail("Stripe Checkout session", e);
    }
    try {
      const pi = await stripe.paymentIntents.create({
        amount: 2000,
        currency: "gbp",
        payment_method: "pm_card_visa",
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      });
      const key = `refund-sandbox-${pi.id}`;
      const r1 = await stripe.refunds.create({ payment_intent: pi.id, amount: 2000 }, { idempotencyKey: key });
      const r2 = await stripe.refunds.create({ payment_intent: pi.id, amount: 2000 }, { idempotencyKey: key });
      if (r1.id !== r2.id) throw new Error("idempotency key did not deduplicate the refund");
      pass("Stripe refund is idempotent", r1.id);
    } catch (e) {
      fail("Stripe refund is idempotent", e);
    }
  } else {
    skip("Stripe", "STRIPE_SECRET_KEY not set");
  }
}

async function checkout() {
  const axios = require("axios");
  const api = String(opt("api", "")).replace(/\/$/, "");
  const id = opt("campaign");
  const waitMin = Number(opt("wait", 10));
  if (!api || !id) {
    console.error("checkout needs --api <url> --campaign <id>");
    process.exit(2);
  }
  console.log(`\nCheckout end to end against ${api}`);
  const { data } = await axios.get(`${api}/api/campaigns/campaign/${id}`);
  const c = data.data;
  const currency = String(c.funding.currency).toUpperCase();
  const before = (await axios.get(`${api}/api/ledger/${id}?limit=100000`)).data.data.entries.length;
  const donation = currency === "NGN" ? 1000 : currency === "KES" ? 200 : 10;
  const tip = currency === "NGN" ? 75 : currency === "KES" ? 15 : 0.75;
  const customer = { email: `sandbox+${Date.now()}@fundandtrace.com`, name: "Sandbox Donor" };

  // Fees: use the server's own published schedule, so this exercises the
  // same contract as the donate page (total = donation + tip + fee).
  const sched = (await axios.get(`${api}/api/fees/schedule`)).data.data;
  process.env.FEE_SCHEDULE_JSON = JSON.stringify(sched.rules);
  for (const [r, m] of Object.entries(sched.modes)) process.env[`FEE_MODE_${r.toUpperCase()}`] = m;
  const fees = require("../services/fees");
  const order = (rail) => {
    const fee = fees.quote({ rail, currency, base: donation + tip, coverFee: rail === "stripe" }).fee;
    const amount = Math.round((donation + tip + fee) * 100) / 100;
    return { amount, fee, meta: { campaignId: id, tip, amount, processingFee: fee, coverFee: rail === "stripe", country: "Nigeria", anonymous: false } };
  };
  const { amount, meta } = order("paystack");
  const links = [];

  // Wrong currency must be refused (guards against crediting e.g. NGN to a GBP campaign).
  try {
    await axios.post(`${api}/api/donations/initializePaystack/${id}`, { amount, currency: currency === "USD" ? "GBP" : "USD", meta, customer });
    fail("Wrong currency refused", new Error("checkout accepted a different currency"));
  } catch (e) {
    if (e.response?.data?.code === "currency_mismatch") pass("Wrong currency refused");
    else fail("Wrong currency refused", e);
  }

  // A tampered fee must be refused (the server recomputes it).
  if (sched.modes.paystack === "required" && ["NGN", "GHS", "ZAR", "KES", "USD"].includes(currency)) {
    try {
      const o2 = order("paystack");
      await axios.post(`${api}/api/donations/initializePaystack/${id}`, { amount: o2.amount - o2.fee, currency, meta: { ...o2.meta, processingFee: 0, amount: o2.amount - o2.fee }, customer });
      fail("Tampered card fee refused", new Error("checkout accepted a zero fee"));
    } catch (e) {
      if (e.response?.data?.code === "fee_mismatch") pass("Tampered card fee refused");
      else fail("Tampered card fee refused", e);
    }
  }

  const psRef = `sbx${Date.now()}`;
  const tries = [
    ["Paystack", ["NGN", "GHS", "ZAR", "KES", "USD"], () => { const o = order("paystack"); return axios.post(`${api}/api/donations/initializePaystack/${id}`, { amount: o.amount, currency, meta: o.meta, customer, tx_ref: psRef }).then((r) => r.data.authorizationUrl); }],
    ["Flutterwave", ["NGN", "GHS", "KES", "UGX", "TZS", "RWF", "ZAR", "USD", "GBP", "EUR"], () => { const o = order("flutterwave"); return axios.post(`${api}/api/donations/initialize`, { payment: { tx_ref: `sbx${Date.now()}`, amount: o.amount, currency, redirect_url: `${api}/api/donations/flutterwave/${id}`, meta: o.meta, customer } }).then((r) => r.data); }],
    ["Stripe", ["GBP", "USD", "NGN"], () => { const o = order("stripe"); return axios.post(`${api}/api/donations/createStripeSession/${id}`, { amount: o.amount, currency, meta: o.meta, customer }).then((r) => r.data.url || `session ${r.data.id}`); }],
  ];
  for (const [name, currencies, start] of tries) {
    if (!currencies.includes(currency)) {
      skip(`${name} checkout`, `doesn't take ${currency}`);
      continue;
    }
    try {
      const link = await start();
      if (!link) throw new Error("no payment link returned");
      pass(`${name} checkout created`);
      links.push([name, link]);
    } catch (e) {
      fail(`${name} checkout created`, e);
    }
  }

  if (!links.length) return;
  console.log("\nPay each link with the provider's TEST card (e.g. Stripe 4242 4242 4242 4242; Paystack/Flutterwave test cards from their docs):");
  links.forEach(([n, l]) => console.log(`  ${n}: ${l}`));
  console.log(`\nWaiting up to ${waitMin} min for ${links.length} donation(s) to reach the ledger…`);
  const deadline = Date.now() + waitMin * 60e3;
  let credited = 0;
  while (Date.now() < deadline) {
    const entries = (await axios.get(`${api}/api/ledger/${id}?limit=100000`)).data.data.entries;
    credited = entries.slice(before).filter((e) => e.type === "credit").length;
    if (credited >= links.length) break;
    await new Promise((r) => setTimeout(r, 10000));
  }
  const entries = (await axios.get(`${api}/api/ledger/${id}?limit=100000`)).data.data.entries.slice(before);
  if (credited >= links.length) pass("Webhooks credited every donation", `${credited} ledger credit(s)`);
  else fail("Webhooks credited every donation", new Error(`${credited}/${links.length} credited before timeout`));
  const wrong = entries.filter((e) => e.type === "credit" && Math.abs(e.amount - donation) > 0.01);
  if (entries.length && !wrong.length) pass("Campaign credited the donation without the tip or card fee", `${donation} ${currency} each`);
  else if (wrong.length) fail("Campaign credited the donation without the tip or card fee", new Error(`got ${wrong.map((e) => e.amount).join(", ")}`));

  // Did Paystack charge what we added? A higher actual fee means the rates
  // changed, or "Pass fees to customers" is ON in the dashboard (double fee).
  if (links.some(([n]) => n === "Paystack") && process.env.PAYSTACK_SECRET) {
    try {
      const v = (await axios.get(`https://api.paystack.co/transaction/verify/${psRef}`, { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` } })).data.data;
      const charged = Number(v.amount) / 100;
      const actualFee = Number(v.fees || 0) / 100;
      const added = order("paystack").fee;
      if (Math.abs(charged - amount) > 0.01) fail("Paystack charged exactly our total", new Error(`charged ${charged}, expected ${amount}: is "Pass fees to customers" ON?`));
      else pass("Paystack charged exactly our total", `${charged} ${currency}`);
      if (actualFee <= added + 0.01) pass("Fee we added covers Paystack's actual fee", `added ${added}, Paystack took ${actualFee}`);
      else fail("Fee we added covers Paystack's actual fee", new Error(`added ${added}, Paystack took ${actualFee}: update RULES / FEE_SCHEDULE_JSON`));
    } catch (e) {
      skip("Paystack fee reconciliation", e.response?.data?.message || e.message);
    }
  }
  const v = (await axios.get(`${api}/api/ledger/${id}/verify`)).data.data;
  if (v.valid !== false) pass("Ledger chain still verifies");
  else fail("Ledger chain still verifies", new Error(JSON.stringify(v)));
}

(async () => {
  assertTestKeys();
  if (mode === "contract") await contract();
  else if (mode === "checkout") await checkout();
  else {
    console.log("Usage: node scripts/sandbox-e2e.js contract|checkout [options]  (see the header of this file)");
    process.exit(2);
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error(e?.response?.data || e);
  process.exit(1);
});
