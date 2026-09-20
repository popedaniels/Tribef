const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const reportSchema = new mongoose.Schema({
  evidence: { type: String, default: "" },
  fullName: { type: String, default: "" },
  subject: { type: String, default: "" },
  message: { type: String, default: "" },
  submittedAt: { type: Date },
  campaignId: { type: ObjectId, ref: "campaign", index: true },
  userId: { type: ObjectId, ref: "User", index: true },
  read: { type: Boolean, default: false, index: true },
  adminActivities: [
    {
      date: Date,
      AdminId: String,
      AdminName: String,
      action: String,
    },
  ],
});

// Indexes for relationship queries
reportSchema.index({ campaignId: 1, submittedAt: -1 });
reportSchema.index({ userId: 1, submittedAt: -1 });

const Report = mongoose.model("report", reportSchema);

module.exports = {
  Report,
};
