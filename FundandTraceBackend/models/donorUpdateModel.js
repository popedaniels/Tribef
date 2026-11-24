// Outbox for donor update emails ("your money was paid out", "receipt added").
// One document per event; services/donorUpdates.js sends in batches from the
// scheduler so a payout never waits on email, and the unique key makes each
// event send at most once.
const mongoose = require("mongoose");

const DonorUpdateSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // "<type>:<fundingRequestId>"
    type: { type: String, enum: ["payout", "receipt"], required: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    fundingRequestId: { type: mongoose.Schema.Types.ObjectId, required: true },
    status: { type: String, enum: ["queued", "sending", "done"], default: "queued", index: true },
    leaseUntil: { type: Date, default: null },
    cursor: { type: String, default: "" }, // last email sent (recipients are processed in sorted order)
    sent: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    skippedOptOut: { type: Number, default: 0 },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const EmailOptOutSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, default: null }, // null = all campaign updates
    at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);
EmailOptOutSchema.index({ email: 1, campaignId: 1 }, { unique: true });

const DonorUpdate = mongoose.model("DonorUpdate", DonorUpdateSchema);
const EmailOptOut = mongoose.model("EmailOptOut", EmailOptOutSchema);
module.exports = { DonorUpdate, EmailOptOut };
