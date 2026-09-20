const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const waitlistSchema = new mongoose.Schema({
  email: { type: String, default: "" },
  campaignId: { type: ObjectId, ref: "campaign", index: true },
});

// Indexes for relationship queries
waitlistSchema.index({ campaignId: 1, email: 1 });

const Waitlist = mongoose.model("waitlist", waitlistSchema);

module.exports = {
  Waitlist,
};
