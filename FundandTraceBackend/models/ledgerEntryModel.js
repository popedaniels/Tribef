const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

// Append-only, hash-chained money ledger (one chain per campaign).
// See services/ledger.js. Entries are never updated or deleted; corrections
// are new entries (e.g. a "payout_reversal").
const LedgerEntrySchema = new mongoose.Schema(
  {
    campaignId: { type: ObjectId, ref: "campaign", required: true },
    seq: { type: Number, required: true },
    type: {
      type: String,
      required: true,
      enum: ["credit", "payout", "payout_reversal", "refund"],
    },
    // Signed effect on the escrow balance in major units (credit +, payout/refund −).
    amount: { type: Number, required: true },
    currency: { type: String, default: "" },
    // Idempotency key: the gateway reference / funding request id / refund id.
    refId: { type: String, required: true },
    memo: { type: String, default: "" },
    at: { type: Date, required: true },
    prevHash: { type: String, required: true },
    hash: { type: String, required: true },
  },
  { versionKey: false }
);

LedgerEntrySchema.index({ campaignId: 1, seq: 1 }, { unique: true });
LedgerEntrySchema.index({ campaignId: 1, type: 1, refId: 1 }, { unique: true });

const LedgerEntry = mongoose.model("LedgerEntry", LedgerEntrySchema);

module.exports = { LedgerEntry };
