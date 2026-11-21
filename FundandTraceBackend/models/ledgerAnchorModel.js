const mongoose = require("mongoose");

// A daily, externally published commitment to the head of every campaign's
// ledger. See services/anchoring.js.
const LeafSchema = new mongoose.Schema(
  {
    campaignId: { type: String, required: true },
    seq: { type: Number, required: true },
    head: { type: String, required: true },
  },
  { _id: false }
);

const PublicationSchema = new mongoose.Schema(
  {
    target: { type: String, required: true }, // "github" | "opentimestamps" | "log"
    ok: { type: Boolean, default: false },
    ref: { type: String, default: "" }, // commit URL, calendar URL…
    proof: { type: String, default: "" }, // e.g. base64 OpenTimestamps receipt
    error: { type: String, default: "" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const LedgerAnchorSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true }, // YYYY-MM-DD (UTC)
    version: { type: Number, default: 1 },
    root: { type: String, required: true },
    // The anchors themselves form a chain: rewriting one breaks every later one.
    prevDigest: { type: String, required: true },
    // SHA-256 of `message` — the 32 bytes that are timestamped externally.
    digest: { type: String, required: true },
    // Human-readable statement that is published (and hashed into `digest`).
    message: { type: String, required: true },
    leafCount: { type: Number, required: true },
    leaves: { type: [LeafSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
    publications: { type: [PublicationSchema], default: [] },
  },
  { versionKey: false }
);

const LedgerAnchor = mongoose.model("LedgerAnchor", LedgerAnchorSchema);

module.exports = { LedgerAnchor };
