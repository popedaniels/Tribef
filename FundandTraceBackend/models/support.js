const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const supportSchema = new mongoose.Schema({
  email: { type: String, default: "", index: true },
  fullName: { type: String, default: "" },
  subject: { type: String, default: "" },
  message: { type: String, default: "" },
  submittedAt: { type: Date },
  campaignId: { type: ObjectId, ref: "campaign", index: true },
  read: { type: Boolean, default: false, index: true },
  response: [
    {
      adminId: { type: ObjectId, ref: "user", index: true },
      adminName: String,
      action: String,
      responsedAt: { type: Date },
      responseText: { type: String, default: "" },
    },
  ],
});

// Indexes for relationship queries
supportSchema.index({ campaignId: 1, submittedAt: -1 });
supportSchema.index({ read: 1, submittedAt: -1 });

const Support = mongoose.model("support", supportSchema);

module.exports = {
  Support,
};
