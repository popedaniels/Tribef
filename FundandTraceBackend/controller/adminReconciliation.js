// Admin view of gateway reconciliation (services/reconciliation.js).
const mongoose = require("mongoose");
const { ReconciliationReport } = require("../models/reconciliationReportModel");
const logger = require("../utility/logger");

exports.list = async (req, res) => {
  try {
    const reports = await ReconciliationReport.find({}).sort({ ranAt: -1 }).limit(60).lean();
    return res.json({ status: 200, data: reports });
  } catch (err) {
    logger.error({ err }, "reconciliation list failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.run = async (req, res) => {
  try {
    const days = Math.min(30, Math.max(1, Number(req.body?.days) || 2));
    const report = await require("../services/reconciliation").runReconciliation({ days });
    if (report.skipped) return res.status(409).json({ status: 409, error: "A reconciliation is already running." });
    return res.json({ status: 200, data: report });
  } catch (err) {
    logger.error({ err }, "reconciliation run failed");
    return res.status(500).json({ status: 500, error: "Reconciliation failed. Check the logs." });
  }
};

// Record what was found and done about a report's discrepancies.
exports.resolve = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ status: 400, error: "Invalid id" });
    const note = String(req.body?.note || "").trim().slice(0, 2000);
    if (note.length < 10) return res.status(400).json({ status: 400, error: "Say what you found and did (at least 10 characters)." });
    const adminName = `${req.admin?.firstName || ""} ${req.admin?.lastName || ""}`.trim() || "Admin";
    const r = await ReconciliationReport.updateOne({ _id: req.params.id }, { $set: { resolution: { note, adminName, at: new Date() } } });
    if (!r.matchedCount) return res.status(404).json({ status: 404, error: "Report not found" });
    return res.json({ status: 200 });
  } catch (err) {
    logger.error({ err }, "reconciliation resolve failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
