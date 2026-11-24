// Ledger entries that couldn't be appended at the time (extreme contention or
// a database blip). The money movement already happened, so the entry must
// not be lost: services/ledger.js drains this outbox (on the next append for
// the campaign and every scheduler tick) until it's empty.
const mongoose = require("mongoose");

const LedgerOutboxSchema = new mongoose.Schema(
  {
    campaignId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "" },
    refId: { type: String, required: true },
    memo: { type: String, default: "" },
    at: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastError: { type: String, default: "" },
  },
  { timestamps: true }
);
LedgerOutboxSchema.index({ campaignId: 1, type: 1, refId: 1 }, { unique: true });

const LedgerOutbox = mongoose.model("LedgerOutbox", LedgerOutboxSchema);
module.exports = { LedgerOutbox };
