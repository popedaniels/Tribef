// Admin operations dashboard data: integrity checks, anchors, job history.
const mongoose = require("mongoose");
const { recentRuns } = require("../services/jobs");
const { runIntegrityCheck } = require("../services/integrity");
const { LedgerAnchor } = require("../models/ledgerAnchorModel");
const { publicAnchor } = require("../services/anchoring");
const { recordAdminAction } = require("../services/activityLog");
const logger = require("../utility/logger");

exports.status = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ status: 503, error: "Database unavailable." });
    const [integrity, anchors, jobs] = await Promise.all([
      recentRuns("integrity-check", 14),
      LedgerAnchor.find().sort({ date: -1 }).limit(14).select("-leaves").lean(),
      recentRuns(null, 30),
    ]);
    return res.status(200).json({ data: { integrity, anchors: anchors.map(publicAnchor), jobs } });
  } catch (err) {
    logger.error({ err }, "admin ops status failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

// Run the integrity check now and return the full report (not alerting).
exports.runIntegrity = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ status: 503, error: "Database unavailable." });
    const report = await runIntegrityCheck({ alert: false });
    recordAdminAction(req, "integrity_check_run", { details: report.summary });
    return res.status(200).json({ data: report });
  } catch (err) {
    logger.error({ err }, "manual integrity check failed");
    return res.status(500).json({ status: 500, error: "Integrity check failed to run." });
  }
};
