#!/usr/bin/env node
// Production go/no-go check. Run against the production environment before
// every launch or major deploy:
//
//   node scripts/preflight.js                  # configuration only (no network)
//   node scripts/preflight.js --online         # also checks the database, processors, webhooks and URLs
//   node scripts/preflight.js --online --json  # machine-readable
//   node scripts/preflight.js --env-file /path/to/prod.env --frontend-env ../FundandTrace/.env.production
//
// Exits 1 if any check FAILs. WARNs need a decision but don't block.
// It never prints secret values, only which variable is wrong.
const fs = require("fs");
const path = require("path");

const PASS = "pass";
const WARN = "warn";
const FAIL = "fail";

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
};

function parseEnvFile(file) {
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return out;
}

const PLACEHOLDER = /(replace|example|changeme|your[_-]?secret|user:password@|00000000000000000000|_replace_me)/i;
const hex = (n) => new RegExp(`^[0-9a-fA-F]{${n}}$`);

/** Pure: configuration checks. `env` is the backend env, `fe` the frontend env (optional). */
function offlineChecks(env, fe = null, appKeys = null) {
  const r = [];
  const add = (status, area, check, fix = "") => r.push({ status, area, check, fix });
  const has = (k) => Boolean(env[k]) && !PLACEHOLDER.test(env[k]);
  const need = (k, area, why) => add(has(k) ? PASS : FAIL, area, `${k} is set`, has(k) ? "" : why);
  const want = (k, area, why) => add(has(k) ? PASS : WARN, area, `${k} is set`, has(k) ? "" : why);

  // Core
  add(env.NODE_ENV === "production" ? PASS : FAIL, "Core", "NODE_ENV=production", "Set NODE_ENV=production (enables fail-fast config, secure cookies, HSTS).");
  need("MONGOURL", "Core", "Database connection string.");
  add(has("TOKEN_SECRET") && env.TOKEN_SECRET.length >= 64 ? PASS : FAIL, "Core", "TOKEN_SECRET is ≥ 64 chars", "openssl rand -hex 64");
  add(has("RESET_TOKEN_SECRET") && env.RESET_TOKEN_SECRET.length >= 64 && env.RESET_TOKEN_SECRET !== env.TOKEN_SECRET ? PASS : FAIL, "Core", "RESET_TOKEN_SECRET is ≥ 64 chars and differs from TOKEN_SECRET", "openssl rand -hex 64");
  add(hex(64).test(env.SECURITY_KEY || "") ? PASS : FAIL, "Core", "SECURITY_KEY is 32 bytes hex", "openssl rand -hex 32 (and run the encryption migration if you rotate it)");
  add(has("INTERNAL_WEBHOOK_SECRET") && env.INTERNAL_WEBHOOK_SECRET.length >= 32 ? PASS : FAIL, "Core", "INTERNAL_WEBHOOK_SECRET is ≥ 32 chars", "openssl rand -hex 32");
  for (const k of ["MAINURL", "BACKENDURL"]) add(/^https:\/\/[^/]+/.test(env[k] || "") && !/localhost|127\.0\.0\.1/.test(env[k]) ? PASS : FAIL, "Core", `${k} is a public https URL`, "Use the production https origin.");
  want("REDIS_URL", "Core", "Without Redis, rate limits are per instance; set it if you run more than one.");

  // Payments: live keys, no test/live mixing.
  const live = { stripe: /^sk_live_/.test(env.STRIPESECRET || ""), paystack: /^sk_live_/.test(env.PAYSTACK_SECRET || ""), flutterwave: /^FLWSECK-(?!TEST)/.test(env.FLUTTERWAVE || "") };
  const test = { stripe: /^sk_test_/.test(env.STRIPESECRET || ""), paystack: /^sk_test_/.test(env.PAYSTACK_SECRET || ""), flutterwave: /FLWSECK_TEST/.test(env.FLUTTERWAVE || "") };
  const rails = Object.keys(live).filter((k) => live[k] || test[k]);
  add(rails.length ? PASS : FAIL, "Payments", "At least one payment processor is configured", "Set STRIPESECRET, PAYSTACK_SECRET and/or FLUTTERWAVE.");
  for (const k of rails) add(live[k] ? PASS : FAIL, "Payments", `${k} uses a LIVE secret key`, "Test keys take no real money. Use the live key in production.");
  if (live.stripe || test.stripe) {
    add(/^whsec_/.test(env.STRIPE_WEBHOOK_SECRET || "") ? PASS : FAIL, "Payments", "STRIPE_WEBHOOK_SECRET is a whsec_ secret", "Donations are only recorded by the signed webhook.");
    want("STRIPE_CONNECT_WEBHOOK_SECRET", "Payments", "Needed for Connect payout status.");
  }
  if (live.flutterwave || test.flutterwave) need("FLUTTERWAVE_VERIF_HASH", "Payments", "Webhook signature hash from the Flutterwave dashboard.");
  if (fe) {
    const pk = fe.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || fe.NEXT_PUBLIC_STRIPE_KEY || "";
    if (pk) add(/^pk_live_/.test(pk) === live.stripe ? PASS : FAIL, "Payments", "Frontend Stripe publishable key matches the backend mode (live/test)", "A test pk with a live sk (or vice versa) breaks checkout.");
    const api = fe.NEXT_PUBLIC_API_URL || "";
    if (api) add(api.replace(/\/$/, "") === String(env.BACKENDURL || "").replace(/\/$/, "") ? PASS : WARN, "Core", "Frontend NEXT_PUBLIC_API_URL equals BACKENDURL", "Check the frontend points at this API.");
  }

  // Fees (legal)
  add((env.FEE_MODE_STRIPE || "optional") !== "required" ? PASS : FAIL, "Fees", "Stripe card fee is not a mandatory surcharge", "UK/EU law bans card surcharges (incl. donations). Use FEE_MODE_STRIPE=optional or off.");
  if (env.FEE_SCHEDULE_JSON) {
    let ok = true;
    try {
      JSON.parse(env.FEE_SCHEDULE_JSON);
    } catch {
      ok = false;
    }
    add(ok ? PASS : FAIL, "Fees", "FEE_SCHEDULE_JSON is valid JSON", "Fix or remove the override; checkouts would use the defaults.");
  }
  add(WARN, "Fees", "Paystack 'Pass fees to customers' is OFF and Flutterwave's fee bearer is the merchant (manual check)", "Otherwise donors are charged the fee twice. Runbook §3a.10.");

  // Trust features
  need("EVIDENCE_SIGNING_KEY", "Trust", "node scripts/generate-evidence-key.js. Without it, live capture is refused in production.");
  need("LEDGER_START_DATE", "Trust", "The deploy date; earlier campaigns skip the balance comparison.");
  want("ANCHOR_GITHUB_REPO", "Trust", "Daily ledger anchors are only stored locally without it.");
  if (has("ANCHOR_GITHUB_REPO")) need("ANCHOR_GITHUB_TOKEN", "Trust", "Token with contents:write on the anchor repo.");
  add(["submitted", "verified"].includes(env.REQUIRE_KYC_TO_LAUNCH) ? PASS : WARN, "Trust", "Organisers must pass an ID check to launch (REQUIRE_KYC_TO_LAUNCH)", "Set to 'submitted' (or 'verified') once /admin/identity is staffed.");
  want("ID_MEDIA_RETENTION_DAYS", "Trust", "Agree the ID-media retention period with counsel.");
  add(Number(env.PAYOUT_SECOND_APPROVAL_OVER || 0) > 0 ? PASS : WARN, "Trust", "Large payouts need a second admin (PAYOUT_SECOND_APPROVAL_OVER)", "Set a threshold so one compromised admin can't release large sums.");

  // Operations
  want("SENTRY_DSN", "Ops", "Errors are only in logs without it.");
  want("ALERT_WEBHOOK_URL", "Ops", "Integrity and payout alerts go nowhere without it.");
  add(has("SMTP_URL") || has("OAUTH_REFRESH_TOKEN") ? (has("SMTP_URL") ? PASS : WARN) : FAIL, "Ops", "Transactional email uses SMTP (SES/Postmark/Resend)", "Gmail OAuth caps volume and its token can expire, which stops receipts silently.");
  if (has("SMTP_URL")) want("EMAIL_FROM", "Ops", "From address on receipts.");
  add(has("STORAGE_BUCKET") ? PASS : WARN, "Ops", "Evidence and uploads go to object storage (STORAGE_BUCKET)", "Without it files live on the container's disk and are lost on redeploy.");

  // Leftovers
  // Only the app's own variables (from .env.example), not unrelated process env.
  const placeholders = Object.keys(env).filter((k) => (!appKeys || appKeys.has(k)) && env[k] && PLACEHOLDER.test(env[k]));
  add(placeholders.length ? FAIL : PASS, "Core", "No .env.example placeholder values left", placeholders.length ? `Replace: ${placeholders.join(", ")}` : "");
  return r;
}

async function onlineChecks(env) {
  const r = [];
  const add = (status, area, check, fix = "") => r.push({ status, area, check, fix });
  const axios = require("axios");
  const get = (url, headers = {}) => axios.get(url, { headers, timeout: 10000, validateStatus: () => true, maxRedirects: 0 });

  // Database
  try {
    const mongoose = require("mongoose");
    await mongoose.connect(env.MONGOURL, { serverSelectionTimeoutMS: 8000 });
    const db = mongoose.connection.db;
    const hello = await db.admin().command({ hello: 1 });
    add(hello.setName ? PASS : WARN, "Database", "Connected; replica set (needed for backups/failover)", hello.setName ? "" : "Standalone server: use a replica set (Atlas M10+).");
    const idx = await db.collection("ledgerentries").indexes().catch(() => []);
    add(idx.some((i) => i.unique && i.key.refId === 1) ? PASS : FAIL, "Database", "Ledger unique index exists", "Start the app once (indexes build at boot) or run syncIndexes.");
    const status = await db.command({ connectionStatus: 1, showPrivileges: true }).catch(() => null);
    const privs = (status?.authInfo?.authenticatedUserPrivileges || []).flatMap((p) => p.actions || []);
    add(privs.includes("dropDatabase") || privs.includes("dropCollection") ? WARN : PASS, "Database", "App database user can't drop collections", "Use a least-privilege role (readWrite without drop) and insert+find only on evidencerecords.");
    await mongoose.disconnect();
  } catch (e) {
    add(FAIL, "Database", "Database reachable", e.message);
  }

  // Processors
  if (env.PAYSTACK_SECRET) {
    const res = await get("https://api.paystack.co/balance", { Authorization: `Bearer ${env.PAYSTACK_SECRET}` }).catch((e) => ({ status: 0, e }));
    add(res.status === 200 ? PASS : FAIL, "Payments", "Paystack key is accepted", `HTTP ${res.status}`);
  }
  if (env.FLUTTERWAVE) {
    const res = await get("https://api.flutterwave.com/v3/balances", { Authorization: `Bearer ${env.FLUTTERWAVE}` }).catch((e) => ({ status: 0, e }));
    add(res.status === 200 ? PASS : FAIL, "Payments", "Flutterwave key is accepted", `HTTP ${res.status}`);
  }
  if (env.STRIPESECRET) {
    try {
      const stripe = require("stripe")(env.STRIPESECRET);
      await stripe.balance.retrieve();
      add(PASS, "Payments", "Stripe key is accepted");
      const base = String(env.BACKENDURL || "").replace(/\/$/, "");
      const eps = (await stripe.webhookEndpoints.list({ limit: 100 })).data;
      const want = [
        ["/api/donations/stripe-webhook", "checkout.session.completed"],
        ["/api/stripeConnect/webhook", "account.updated"],
      ];
      for (const [p, ev] of want) {
        const ep = eps.find((e) => e.url === base + p && e.status === "enabled");
        const ok = ep && (ep.enabled_events.includes("*") || ep.enabled_events.includes(ev));
        add(ok ? PASS : FAIL, "Payments", `Stripe webhook ${p} registered for ${ev}`, ok ? "" : "Add it in the Stripe dashboard (Developers → Webhooks).");
      }
    } catch (e) {
      add(FAIL, "Payments", "Stripe key is accepted", e.message);
    }
  }

  // Public URLs
  for (const [k, p] of [["BACKENDURL", "/api/health"], ["MAINURL", "/"]]) {
    const base = String(env[k] || "").replace(/\/$/, "");
    if (!base) continue;
    const res = await get(base + p).catch((e) => ({ status: 0, headers: {}, e }));
    add(res.status === 200 ? PASS : FAIL, "URLs", `${k}${p} returns 200`, `HTTP ${res.status}`);
    if (res.status === 200) add(/max-age=\d{7,}/.test(res.headers["strict-transport-security"] || "") ? PASS : WARN, "URLs", `${k} sends HSTS`, "Add Strict-Transport-Security at the edge.");
  }
  return r;
}

function print(results, json) { // eslint-disable-line no-param-reassign
  if (json) {
    process.stdout.write(JSON.stringify(results, null, 2) + "\n");
    return;
  }
  const order = [...new Set(results.map((c) => c.area))];
  results = [...results].sort((a, b) => order.indexOf(a.area) - order.indexOf(b.area));
  const icon = { pass: "\x1b[32m✔\x1b[0m", warn: "\x1b[33m!\x1b[0m", fail: "\x1b[31m✘\x1b[0m" };
  let area = "";
  for (const c of results) {
    if (c.area !== area) {
      area = c.area;
      console.log(`\n${area}`);
    }
    console.log(`  ${icon[c.status]} ${c.check}${c.status !== PASS && c.fix ? `\n      → ${c.fix}` : ""}`);
  }
  const n = (s) => results.filter((c) => c.status === s).length;
  console.log(`\n${n(FAIL) ? "\x1b[31mNOT READY\x1b[0m" : "\x1b[32mREADY\x1b[0m"}: ${n(PASS)} pass, ${n(WARN)} warn, ${n(FAIL)} fail\n`);
}

if (require.main === module) {
  (async () => {
    const file = arg("--env-file") || path.resolve(__dirname, "..", ".env");
    const env = { ...(fs.existsSync(file) ? parseEnvFile(file) : {}), ...process.env };
    const feFile = arg("--frontend-env");
    const fe = feFile && fs.existsSync(feFile) ? parseEnvFile(feFile) : null;
    const example = path.resolve(__dirname, "..", ".env.example");
    const appKeys = fs.existsSync(example) ? new Set(Object.keys(parseEnvFile(example))) : null;
    let results = offlineChecks(env, fe, appKeys);
    if (process.argv.includes("--online")) results = results.concat(await onlineChecks(env));
    print(results, process.argv.includes("--json"));
    process.exit(results.some((c) => c.status === FAIL) ? 1 : 0);
  })();
}

module.exports = { offlineChecks, parseEnvFile };
