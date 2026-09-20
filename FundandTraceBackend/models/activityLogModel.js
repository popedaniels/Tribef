const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const ActivityLogSchema = new mongoose.Schema({
  userId: { type: ObjectId, ref: "User", index: true },
  user: String, // legacy: keep for backward compatibility with existing logs
  type: String,
  campaignId: { type: ObjectId, ref: "campaign", index: true },
  createdAt: { type: Date, default: Date.now() },
});

// Indexes for relationship queries
ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ campaignId: 1, createdAt: -1 });
ActivityLogSchema.index({ type: 1, createdAt: -1 });

const ActivityLog = mongoose.model("ActivityLog", ActivityLogSchema);

module.exports = {
  ActivityLog,
};
