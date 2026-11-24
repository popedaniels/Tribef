// Run-once-per-period jobs, safe across any number of instances.
//
//   await runOncePerPeriod("ledger-anchor", "2026-11-22", () => buildAnchor())
//
// - The first instance to insert JobRun{_id: "<job>:<period>"} runs the job.
// - A failed run can be retried (up to MAX_ATTEMPTS) by a later tick.
// - A run stuck in "running" longer than STALE_MS (crashed process) can be
//   taken over.
const os = require("os");
const { JobRun } = require("../models/jobRunModel");
const logger = require("../utility/logger");

const STALE_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const OWNER = `${os.hostname()}:${process.pid}`;

const utcDate = (d = new Date()) => new Date(d).toISOString().slice(0, 10);

async function claim(job, period, now = new Date()) {
  const _id = `${job}:${period}`;
  try {
    await JobRun.create({ _id, job, period, owner: OWNER, startedAt: now });
    return true;
  } catch (err) {
    if (!err || err.code !== 11000) throw err;
  }
  // Already exists: take it over only if it failed (with attempts left) or is stale.
  const taken = await JobRun.findOneAndUpdate(
    {
      _id,
      attempts: { $lt: MAX_ATTEMPTS },
      $or: [{ status: "failed" }, { status: "running", startedAt: { $lt: new Date(now.getTime() - STALE_MS) } }],
    },
    { $set: { status: "running", owner: OWNER, startedAt: now, error: null }, $inc: { attempts: 1 } },
    { new: true }
  );
  return Boolean(taken);
}

/**
 * @returns {{ran: boolean, result?: any, error?: Error}}
 */
async function runOncePerPeriod(job, period, fn) {
  let mine = false;
  try {
    mine = await claim(job, period);
  } catch (err) {
    logger.error({ err, job, period }, "Job claim failed");
    return { ran: false, error: err };
  }
  if (!mine) return { ran: false };

  const _id = `${job}:${period}`;
  try {
    const result = await fn();
    await JobRun.updateOne({ _id }, { $set: { status: "succeeded", finishedAt: new Date(), result } });
    logger.info({ job, period }, "Job succeeded");
    return { ran: true, result };
  } catch (err) {
    await JobRun.updateOne({ _id }, { $set: { status: "failed", finishedAt: new Date(), error: String(err?.message || err) } }).catch(() => {});
    logger.error({ err, job, period }, "Job failed");
    return { ran: true, error: err };
  }
}

async function recentRuns(job, limit = 14) {
  return JobRun.find(job ? { job } : {}).sort({ startedAt: -1 }).limit(limit).lean();
}

module.exports = { runOncePerPeriod, claim, recentRuns, utcDate, STALE_MS, MAX_ATTEMPTS };
