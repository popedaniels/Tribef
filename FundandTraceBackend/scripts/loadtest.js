#!/usr/bin/env node
// Load and concurrency test for the API (gap 4). Two phases:
//
// 1) Read load: the public endpoints a busy campaign page hits (campaign,
//    ledger, transparency, giving, fee schedule) under N concurrent
//    connections. Fails if p95 latency or the error rate exceed the budget.
// 2) Webhook storm: K signed Paystack charge.success events, each delivered
//    3 times concurrently (providers retry). The campaign must be credited
//    exactly once per donation and its ledger must still verify.
//
//   API=http://localhost:5000 PAYSTACK_SECRET=sk_test_x CAMPAIGN_ID=<id> \
//     node scripts/loadtest.js [--duration 30] [--connections 50] [--donations 200]
//
// Needs a NON-production API (seed with scripts/drill-seed.js) started with
// RATE_LIMIT_DISABLED=true, and the same PAYSTACK_SECRET as the API.
const crypto = require("crypto");
const autocannon = require("autocannon");

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const API = (process.env.API || "http://localhost:5000").replace(/\/$/, "");
const CAMPAIGN = process.env.CAMPAIGN_ID;
const SECRET = process.env.PAYSTACK_SECRET;
const DURATION = Number(arg("duration", 30));
const CONNECTIONS = Number(arg("connections", 50));
const DONATIONS = Number(arg("donations", 200));
const P95_BUDGET_MS = Number(process.env.P95_BUDGET_MS || 500);
const MAX_ERROR_RATE = Number(process.env.MAX_ERROR_RATE || 0.001);

const results = [];
const check = (ok, name, detail) => {
  results.push({ ok, name, detail });
  console.log(`${ok ? "✔" : "✘"} ${name}${detail ? ` (${detail})` : ""}`);
};
const getJson = async (path) => (await fetch(API + path)).json();

async function readLoad() {
  const paths = [`/api/campaigns/campaign/${CAMPAIGN}`, `/api/ledger/${CAMPAIGN}?limit=50`, `/api/campaigns/${CAMPAIGN}/transparency`, `/api/giving/campaign/${CAMPAIGN}`, "/api/fees/schedule"];
  const r = await autocannon({
    url: API,
    connections: CONNECTIONS,
    duration: DURATION,
    requests: paths.map((path) => ({ method: "GET", path })),
  });
  const total = r.requests.total || 1;
  const bad = r.non2xx + r.errors + r.timeouts;
  console.log(`  ${total} requests, ${Math.round(r.requests.average)} req/s, p50 ${r.latency.p50} ms, p97.5 ${r.latency.p97_5} ms, p99 ${r.latency.p99} ms`);
  // autocannon reports p90 and p97.5; p97.5 is a stricter stand-in for p95.
  check(r.latency.p97_5 <= P95_BUDGET_MS, `p95 latency within ${P95_BUDGET_MS} ms`, `p97.5 = ${r.latency.p97_5} ms`);
  check(bad / total <= MAX_ERROR_RATE, `error rate ≤ ${MAX_ERROR_RATE * 100}%`, `${bad} of ${total} (non-2xx ${r.non2xx}, errors ${r.errors}, timeouts ${r.timeouts})`);
}

async function webhookStorm() {
  const before = (await getJson(`/api/campaigns/campaign/${CAMPAIGN}`)).data;
  const raisedBefore = Number(before.funding.amountRaised || 0);
  const currency = before.funding.currency || "NGN";
  const run = crypto.randomBytes(4).toString("hex");
  const amountOf = (i) => 1000 + (i % 7) * 250;
  const deliveries = [];
  for (let i = 0; i < DONATIONS; i += 1) {
    const amount = amountOf(i);
    const body = JSON.stringify({
      event: "charge.success",
      data: {
        status: "success",
        reference: `lt-${run}-${i}`,
        amount: amount * 100,
        currency,
        channel: "card",
        paid_at: new Date().toISOString(),
        customer: { first_name: "Load" },
        metadata: { campaignId: CAMPAIGN, donorEmail: `load+${i}@example.com`, donorName: "Load Test", amount: String(amount), tip: "0", fee: "0", anonymous: "false" },
      },
    });
    const sig = crypto.createHmac("sha512", SECRET).update(body).digest("hex");
    for (let k = 0; k < 3; k += 1) deliveries.push({ body, sig }); // provider retries
  }
  // Shuffle so duplicates of the same event race each other.
  for (let i = deliveries.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deliveries[i], deliveries[j]] = [deliveries[j], deliveries[i]];
  }
  const t0 = Date.now();
  let failed = 0;
  const lanes = 25;
  let next = 0;
  await Promise.all(
    Array.from({ length: lanes }, async () => {
      while (next < deliveries.length) {
        const d = deliveries[next++];
        const res = await fetch(`${API}/api/donations/paystack-webhook`, { method: "POST", headers: { "content-type": "application/json", "x-paystack-signature": d.sig }, body: d.body }).catch(() => null);
        if (!res || res.status !== 200) failed += 1;
      }
    })
  );
  const secs = (Date.now() - t0) / 1000;
  console.log(`  ${deliveries.length} deliveries in ${secs.toFixed(1)} s (${Math.round(deliveries.length / secs)}/s)`);
  check(failed === 0, "every webhook delivery acknowledged (200)", `${failed} failed`);

  const expected = Array.from({ length: DONATIONS }, (_, i) => amountOf(i)).reduce((a, b) => a + b, 0);
  const after = (await getJson(`/api/campaigns/campaign/${CAMPAIGN}`)).data;
  const credited = Math.round((Number(after.funding.amountRaised) - raisedBefore) * 100) / 100;
  check(credited === expected, "credited exactly once per donation despite 3x concurrent delivery", `${credited} credited, ${expected} expected`);
  const ledger = (await getJson(`/api/ledger/${CAMPAIGN}?limit=100000`)).data.entries.filter((e) => String(e.refId).startsWith(`paystack:lt-${run}-`));
  check(ledger.length === DONATIONS, "one ledger credit per donation", `${ledger.length} of ${DONATIONS}`);
  const v = (await getJson(`/api/ledger/${CAMPAIGN}/verify`)).data;
  check(v.valid !== false, "ledger hash chain still verifies", v.valid === false ? JSON.stringify(v) : `${v.count ?? ""} entries`);
}

(async () => {
  if (!CAMPAIGN || !SECRET) {
    console.error("Set CAMPAIGN_ID and PAYSTACK_SECRET (see the header of this file).");
    process.exit(2);
  }
  if (/sk_live_/.test(SECRET)) {
    console.error("Refusing to run with a live Paystack key.");
    process.exit(2);
  }
  console.log(`\nRead load: ${CONNECTIONS} connections for ${DURATION} s against ${API}`);
  await readLoad();
  console.log(`\nWebhook storm: ${DONATIONS} donations × 3 concurrent deliveries`);
  await webhookStorm();
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${failed ? "FAILED" : "PASSED"}: ${results.length - failed}/${results.length} checks`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
