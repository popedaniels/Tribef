// Stored result of each gateway reconciliation run (services/reconciliation.js),
// shown on /admin/reconciliation. Kept for 400 days.
const mongoose = require("mongoose");

const ReconciliationReportSchema = new mongoose.Schema(
  {
    ranAt: { type: Date, required: true, index: true },
    windowDays: Number,
    discrepancies: { type: Number, default: 0, index: true },
    gateways: { type: mongoose.Schema.Types.Mixed, default: {} },
    errors: { type: [mongoose.Schema.Types.Mixed], default: [] },
    resolution: {
      note: { type: String, default: "" },
      adminName: { type: String, default: "" },
      at: { type: Date, default: null },
    },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 400 },
  },
  { versionKey: false, suppressReservedKeysWarning: true }
);

const ReconciliationReport = mongoose.model("ReconciliationReport", ReconciliationReportSchema);
module.exports = { ReconciliationReport };
