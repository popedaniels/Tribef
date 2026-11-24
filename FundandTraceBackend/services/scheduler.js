// In-process scheduler for daily jobs. Every API instance runs the ticker;
// services/jobs.js guarantees each job runs once per UTC day across all of
// them (and retries a failed run on a later tick).
//
//   ENABLE_SCHEDULER=false   turn off (e.g. if you run jobs from cron instead)
//   DAILY_JOBS_HOUR_UTC=1    earliest hour (UTC) daily jobs may start
//   RECONCILE_DAILY=true     also reconcile against the payment gateways
const mongoose = require("mongoose");
const { runOncePerPeriod, utcDate } = require("./jobs");
const logger = require("../utility/logger");

const TICK_MS = 10 * 60 * 1000;

function dailyJobs() {
  const jobs = [
    // Integrity first: the anchor refuses to commit to a broken ledger anyway,
    // but this way the alert names the problem.
    ["integrity-check", () => require("./integrity").runIntegrityCheck().then((r) => r.summary)],
    [
      "ledger-anchor",
      (day) =>
        require("./anchoring")
          .createAnchor(day)
          .then((a) => ({ root: a.root, digest: a.digest, campaigns: a.leafCount, published: (a.publications || []).map((p) => `${p.target}:${p.ok ? "ok" : "failed"}`) })),
    ],
  ];
  // Live FX check: fresh rates, sane moves; alerts via ALERT_WEBHOOK_URL.
  jobs.push(["fx-check", () => require("./fx").dailyCheck()]);
  if (process.env.RECONCILE_DAILY === "true") {
    jobs.push(["gateway-reconciliation", () => require("./reconciliation").runReconciliation({ days: 1 })]);
  }
  return jobs;
}

async function tick(now = new Date()) {
  if (mongoose.connection.readyState !== 1) return [];
  const hour = Number(process.env.DAILY_JOBS_HOUR_UTC ?? 1);
  if (now.getUTCHours() < hour) return [];
  const day = utcDate(now);
  const results = [];
  for (const [name, fn] of dailyJobs()) {
    // Sequential on purpose: keeps database load low and ordering predictable.
    results.push([name, await runOncePerPeriod(name, day, () => fn(day))]);
  }
  return results;
}

function startScheduler() {
  if (process.env.ENABLE_SCHEDULER === "false" || process.env.NODE_ENV === "test") return null;
  const run = () => tick().catch((err) => logger.error({ err }, "Scheduler tick failed"));
  const first = setTimeout(run, 60 * 1000);
  const timer = setInterval(run, TICK_MS);
  first.unref();
  timer.unref();
  logger.info({ everyMinutes: TICK_MS / 60000 }, "Scheduler started");
  return { stop: () => (clearTimeout(first), clearInterval(timer)) };
}

module.exports = { startScheduler, tick, dailyJobs };
