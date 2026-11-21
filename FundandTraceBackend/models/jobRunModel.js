const mongoose = require("mongoose");

// One document per (job, period), e.g. "ledger-anchor:2026-11-22".
// The unique _id is the lock: across any number of API instances, exactly one
// insert wins, so a daily job runs once per day even under PM2 cluster mode
// and survives restarts (no Redis required).
const JobRunSchema = new mongoose.Schema(
  {
    _id: { type: String },
    job: { type: String, required: true },
    period: { type: String, required: true },
    status: { type: String, enum: ["running", "succeeded", "failed"], default: "running" },
    owner: { type: String, default: "" },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date },
    result: { type: mongoose.Schema.Types.Mixed },
    error: { type: String },
    attempts: { type: Number, default: 1 },
  },
  { versionKey: false }
);

JobRunSchema.index({ job: 1, startedAt: -1 });

const JobRun = mongoose.model("JobRun", JobRunSchema);

module.exports = { JobRun };
