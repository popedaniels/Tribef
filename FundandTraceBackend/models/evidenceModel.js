const mongoose = require("mongoose");

// See services/evidence.js for what is sealed and how it is verified.

// A short-lived capture session. It owns the challenge code that must appear
// in the capture, and the token that lets a phone upload on the user's behalf
// (QR hand-off from a desktop) without being signed in.
const CaptureSessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    kind: { type: String, required: true, enum: ["identity", "evidence"] },
    // evidence: "update" (campaign photo/video) | "receipt" (proof of spend)
    purpose: { type: String, default: "" },
    campaignId: { type: String, default: "", index: true },
    fundingRequestId: { type: String, default: "" },
    docType: { type: String, default: "" },
    docCountry: { type: String, default: "" },
    code: { type: String, required: true },
    prompts: { type: [String], default: [] },
    slots: { type: [String], default: [] },
    tokenHash: { type: String, required: true },
    issuedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: ["open", "submitted", "approved", "rejected", "expired"], default: "open", index: true },
    records: [{ slot: String, recordId: String, mime: String, sha256: String }],
    caption: { type: String, default: "" },
    submittedAt: { type: Date, default: null },
    // Identity review (by an admin) — NOT part of the sealed records.
    review: {
      decidedAt: { type: Date, default: null },
      adminId: { type: String, default: "" },
      adminName: { type: String, default: "" },
      decision: { type: String, default: "" },
      reason: { type: String, default: "" },
      nameOnId: { type: String, default: "" },
      checks: {
        codeSpoken: { type: Boolean, default: false },
        promptsFollowed: { type: Boolean, default: false },
        faceMatchesId: { type: Boolean, default: false },
        documentLooksGenuine: { type: Boolean, default: false },
        nameMatchesAccount: { type: Boolean, default: false },
      },
    },
  },
  { versionKey: false }
);
CaptureSessionSchema.index({ kind: 1, status: 1, submittedAt: 1 });

const ClientSchema = new mongoose.Schema(
  {
    capturedAt: { type: Date, default: null },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    durationMs: { type: Number, default: null },
    facingMode: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { _id: false }
);

const SEALED = { immutable: true };

// One sealed capture. Append-only: one global hash chain (seq/prevHash/hash).
const EvidenceRecordSchema = new mongoose.Schema(
  {
    seq: { type: Number, required: true, ...SEALED },
    prevHash: { type: String, required: true, ...SEALED },
    recordHash: { type: String, required: true, ...SEALED },
    hash: { type: String, required: true, ...SEALED },
    signature: { type: String, required: true, ...SEALED },
    keyId: { type: String, required: true, ...SEALED },

    recordId: { type: String, required: true, ...SEALED },
    sessionId: { type: String, required: true, index: true, ...SEALED },
    userId: { type: String, required: true, index: true, ...SEALED },
    kind: { type: String, required: true, ...SEALED },
    purpose: { type: String, default: "", ...SEALED },
    slot: { type: String, required: true, ...SEALED },
    campaignId: { type: String, default: "", index: true, ...SEALED },
    fundingRequestId: { type: String, default: "", ...SEALED },
    visibility: { type: String, enum: ["public", "private"], required: true, ...SEALED },
    mime: { type: String, required: true, ...SEALED },
    bytes: { type: Number, required: true, ...SEALED },
    sha256: { type: String, required: true, ...SEALED },
    challengeCode: { type: String, required: true, ...SEALED },
    prompts: { type: [String], default: [], ...SEALED },
    issuedAt: { type: Date, required: true, ...SEALED },
    receivedAt: { type: Date, required: true, ...SEALED },
    client: { type: ClientSchema, default: () => ({}), ...SEALED },
    locationCoarse: { type: { lat: Number, lng: Number, _id: false }, default: null, ...SEALED },
    locationCommitment: { type: String, default: "", ...SEALED },
    ipCountry: { type: String, default: "", ...SEALED },
    flags: { type: [String], default: [], ...SEALED },

    // Not sealed: where the bytes live, and the precise location (encrypted).
    storageId: { type: String, required: true, ...SEALED },
    preciseLocationEnc: { type: String, default: "", ...SEALED },
    // The only change ever allowed: the file is deleted under the retention
    // policy. The hashes stay, so what existed remains provable.
    mediaDeletedAt: { type: Date, default: null },
    mediaDeletedReason: { type: String, default: "" },
  },
  { versionKey: false }
);
EvidenceRecordSchema.index({ seq: 1 }, { unique: true });
EvidenceRecordSchema.index({ campaignId: 1, visibility: 1, seq: -1 });

// ── Append-only enforcement ────────────────────────────────────────────────
const RETENTION_FIELDS = new Set(["mediaDeletedAt", "mediaDeletedReason"]);
const onlyRetentionFields = (update) => {
  if (!update || typeof update !== "object") return false;
  const keys = [];
  for (const [k, v] of Object.entries(update)) {
    if (k === "$set" && v && typeof v === "object") keys.push(...Object.keys(v));
    else keys.push(k);
  }
  return keys.length > 0 && keys.every((k) => RETENTION_FIELDS.has(k));
};

const immutableError = () => {
  const err = new Error("Evidence records are append-only and cannot be modified or deleted");
  err.code = "EVIDENCE_IMMUTABLE";
  return err;
};

EvidenceRecordSchema.pre("save", function rejectResave(next) {
  if (!this.isNew) {
    const changed = this.modifiedPaths().filter((p) => !RETENTION_FIELDS.has(p));
    if (changed.length) return next(immutableError());
  }
  return next();
});
for (const op of ["updateOne", "updateMany", "findOneAndUpdate"]) {
  EvidenceRecordSchema.pre(op, function guardUpdate(next) {
    return onlyRetentionFields(this.getUpdate()) ? next() : next(immutableError());
  });
}
for (const op of ["replaceOne", "findOneAndReplace", "deleteOne", "deleteMany", "findOneAndDelete"]) {
  EvidenceRecordSchema.pre(op, { document: false, query: true }, function guardDelete(next) {
    return next(immutableError());
  });
}
EvidenceRecordSchema.pre("deleteOne", { document: true, query: false }, function guardDocDelete(next) {
  return next(immutableError());
});

const CaptureSession = mongoose.model("CaptureSession", CaptureSessionSchema);
const EvidenceRecord = mongoose.model("EvidenceRecord", EvidenceRecordSchema);

module.exports = { CaptureSession, EvidenceRecord, onlyRetentionFields };
