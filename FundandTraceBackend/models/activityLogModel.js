const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const ActivityLogSchema = new mongoose.Schema({
  userId: { type: ObjectId, ref: "User", index: true },
  user: String, // legacy: keep for backward compatibility with existing logs
  type: String,
  campaignId: { type: ObjectId, ref: "campaign", index: true },
  // Admin audit trail: who did what to which record.
  actorId: { type: ObjectId, ref: "User", index: true },
  actorName: String,
  targetType: String,
  targetId: String,
  details: mongoose.Schema.Types.Mixed,
  // Function default: the old `Date.now()` was evaluated once at boot, so
  // every log entry got the server start time.
  createdAt: { type: Date, default: Date.now },
});

// Indexes for relationship queries
ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ campaignId: 1, createdAt: -1 });
ActivityLogSchema.index({ type: 1, createdAt: -1 });
ActivityLogSchema.index({ actorId: 1, createdAt: -1 });

const ActivityLog = mongoose.model("ActivityLog", ActivityLogSchema);

module.exports = {
  ActivityLog,
};
