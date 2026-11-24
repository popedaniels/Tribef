// Live, tamper-evident evidence (identity checks, campaign photos/videos, receipts).
//
// What this does and does not prove — stated plainly because it's shown to donors:
//
//  • The file was captured with the camera inside our app during a capture
//    session we opened. There is no file picker; the server issues a one-time
//    code (and, for identity, random head-movement prompts) that must appear in
//    the video, so an old recording can't be reused. A rooted phone or a
//    virtual camera can still feed fake frames — which is why identity videos
//    are reviewed by a person and the code must be spoken on camera.
//  • The time is OUR clock (receivedAt), not the phone's. The phone's clock is
//    recorded too, and a large difference is flagged.
//  • After we receive the bytes, neither the file nor its metadata can be
//    changed without detection:
//      recordHash = SHA-256("ft-evidence-record:v1:" + canonical(sealed fields))
//                   — sealed fields include the SHA-256 of the file itself
//      hash       = SHA-256("ft-evidence-chain:v1:" + seq + ":" + prevHash + ":" + recordHash)
//      signature  = Ed25519(recordHash) with the Fund&Trace evidence key
//    Records form one append-only chain whose head is included in the daily
//    ledger anchor (GitHub + Bitcoin via OpenTimestamps). Editing a record,
//    its file, or deleting one breaks the chain and the published anchor.
//
// Location is optional and only what the phone reports. Publicly we show it
// rounded to ~1 km; the precise value is sealed as a salted commitment so it
// can be proven later without publishing a home address.

const crypto = require("crypto");
const logger = require("../utility/logger");

const GENESIS = "0".repeat(64);
const sha256 = (data) => crypto.createHash("sha256").update(data).digest("hex");

// ── Capture sessions ───────────────────────────────────────────────────────
const SESSION_TTL_MS = 20 * 60 * 1000;
// No 0/O/1/I/L — read aloud and written down without ambiguity.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const PROMPTS = [
  "Turn your head slowly to the left",
  "Turn your head slowly to the right",
  "Look up, then back at the camera",
  "Smile",
  "Blink twice",
];
// Always asked in identity videos, so the reviewer can compare face and document.
const ID_PROMPT = "Hold your ID next to your face";

const randomCode = (length = 6, rand = crypto.randomInt) =>
  Array.from({ length }, () => CODE_ALPHABET[rand(CODE_ALPHABET.length)]).join("");

function randomPrompts(count = 2, rand = crypto.randomInt) {
  const pool = PROMPTS.slice();
  const picked = [];
  while (picked.length < count && pool.length) picked.push(pool.splice(rand(pool.length), 1)[0]);
  return picked;
}

// Slots a session accepts. Identity: front (+ back unless passport) + selfie video.
const ID_DOC_TYPES = ["passport", "national_id", "drivers_licence", "residence_permit", "voters_card"];
const SLOT_RULES = {
  id_front: { kinds: ["identity"], media: ["photo"], maxBytes: 8 * 1024 * 1024 },
  id_back: { kinds: ["identity"], media: ["photo"], maxBytes: 8 * 1024 * 1024 },
  selfie_video: { kinds: ["identity"], media: ["video"], maxBytes: 30 * 1024 * 1024 },
  photo: { kinds: ["evidence"], media: ["photo"], maxBytes: 8 * 1024 * 1024 },
  video: { kinds: ["evidence"], media: ["video"], maxBytes: 30 * 1024 * 1024 },
};
const MAX_EVIDENCE_ITEMS = 6;

function slotsFor(kind, docType) {
  if (kind === "identity") return docType === "passport" ? ["id_front", "selfie_video"] : ["id_front", "id_back", "selfie_video"];
  return ["photo", "video"];
}

// ── File type sniffing (never trust Content-Type alone) ──────────────────────
function sniffMedia(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 16) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", media: "photo" };
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return { mime: "image/webp", media: "photo" };
  if (buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") return { mime: "image/png", media: "photo" };
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return { mime: "video/webm", media: "video" };
  if (buf.toString("ascii", 4, 8) === "ftyp") return { mime: "video/mp4", media: "video" };
  return null;
}

// ── Client-reported capture metadata ───────────────────────────────────────
const num = (v, min, max) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};

/** Parse and bound the X-Capture-Meta header (JSON). Unknown keys are dropped. */
function parseClientMeta(raw) {
  let m = {};
  if (raw) {
    try {
      m = JSON.parse(String(raw).slice(0, 2048));
    } catch {
      m = {};
    }
  }
  const capturedAt = m.capturedAt && !Number.isNaN(Date.parse(m.capturedAt)) ? new Date(m.capturedAt) : null;
  const loc = m.location && typeof m.location === "object" ? m.location : null;
  const lat = loc ? num(loc.lat, -90, 90) : null;
  const lng = loc ? num(loc.lng, -180, 180) : null;
  return {
    capturedAt,
    width: num(m.width, 1, 10000),
    height: num(m.height, 1, 10000),
    durationMs: num(m.durationMs, 0, 10 * 60 * 1000),
    facingMode: ["user", "environment"].includes(m.facingMode) ? m.facingMode : "",
    location: lat !== null && lng !== null ? { lat, lng, accuracy: num(loc.accuracy, 0, 1e6) } : null,
  };
}

/** ~1 km public location + salted commitment to the precise one. */
function sealLocation(location, salt = crypto.randomBytes(16).toString("hex")) {
  if (!location) return { coarse: null, commitment: "", precise: null };
  const precise = { lat: location.lat, lng: location.lng, accuracy: location.accuracy ?? null, salt };
  return {
    coarse: { lat: Math.round(location.lat * 100) / 100, lng: Math.round(location.lng * 100) / 100 },
    commitment: sha256(`ft-location:v1:${JSON.stringify([precise.lat, precise.lng, precise.accuracy, salt])}`),
    precise,
  };
}

const CLOCK_SKEW_FLAG_MS = 10 * 60 * 1000;
function flagsFor({ clientMeta, receivedAt, location }) {
  const flags = [];
  if (!location) flags.push("no_location");
  if (!clientMeta.capturedAt) flags.push("no_device_time");
  else if (Math.abs(clientMeta.capturedAt.getTime() - receivedAt.getTime()) > CLOCK_SKEW_FLAG_MS) flags.push("device_clock_mismatch");
  return flags;
}

// ── Sealing ────────────────────────────────────────────────────────────────
const iso = (d) => (d ? new Date(d).toISOString() : "");
const str = (v) => (v === null || v === undefined ? "" : String(v));

/** Stable serialisation of the sealed fields. Order is part of the format. */
function canonical(r) {
  return JSON.stringify([
    "v1",
    str(r.recordId),
    str(r.sessionId),
    str(r.userId),
    str(r.kind),
    str(r.purpose),
    str(r.slot),
    str(r.campaignId),
    str(r.fundingRequestId),
    str(r.visibility),
    str(r.mime),
    Number(r.bytes),
    str(r.sha256),
    str(r.challengeCode),
    (r.prompts || []).map(String),
    iso(r.issuedAt),
    iso(r.receivedAt),
    iso(r.client?.capturedAt),
    r.client?.width ?? null,
    r.client?.height ?? null,
    r.client?.durationMs ?? null,
    str(r.client?.facingMode),
    str(r.client?.userAgent),
    r.locationCoarse ? [r.locationCoarse.lat, r.locationCoarse.lng] : null,
    str(r.locationCommitment),
    str(r.ipCountry),
    (r.flags || []).map(String),
  ]);
}

const recordHashOf = (r) => sha256(`ft-evidence-record:v1:${canonical(r)}`);
const chainHashOf = ({ seq, prevHash, recordHash }) => sha256(`ft-evidence-chain:v1:${Number(seq)}:${prevHash}:${recordHash}`);

/** Verify chain links (seq, prevHash, recordHash, hash) sorted by seq. Pure. */
function verifyChain(links, { startSeq = 1, startPrev = GENESIS } = {}) {
  let prev = startPrev;
  for (let i = 0; i < links.length; i += 1) {
    const l = links[i];
    if (Number(l.seq) !== startSeq + i) return { valid: false, length: links.length, brokenAt: startSeq + i, reason: "sequence gap or reorder" };
    if (l.prevHash !== prev) return { valid: false, length: links.length, brokenAt: l.seq, reason: "prevHash does not match previous record" };
    if (chainHashOf(l) !== l.hash) return { valid: false, length: links.length, brokenAt: l.seq, reason: "link does not match its hash" };
    prev = l.hash;
  }
  return { valid: true, length: links.length, headHash: prev, headSeq: startSeq + links.length - 1 };
}

// ── Signing key (Ed25519) ──────────────────────────────────────────────────
// Accepts a PEM (literal "\n" allowed, as env files often store it), a
// base64-encoded PEM, or base64 PKCS#8 DER. See scripts/generate-evidence-key.js.
function parsePrivateKey(raw) {
  const s = String(raw).trim();
  if (s.includes("BEGIN")) return crypto.createPrivateKey(s.replace(/\\n/g, "\n"));
  const buf = Buffer.from(s, "base64");
  const text = buf.toString("utf8");
  if (text.includes("BEGIN")) return crypto.createPrivateKey(text);
  return crypto.createPrivateKey({ key: buf, format: "der", type: "pkcs8" });
}

let cachedKey = null;
function loadSigningKey() {
  if (cachedKey) return cachedKey;
  const raw = process.env.EVIDENCE_SIGNING_KEY;
  let privateKey;
  if (raw) {
    privateKey = parsePrivateKey(raw);
    if (privateKey.asymmetricKeyType !== "ed25519") throw new Error("EVIDENCE_SIGNING_KEY must be an Ed25519 private key");
  } else {
    if (process.env.NODE_ENV === "production") return null; // refuse to seal with a throwaway key
    privateKey = crypto.generateKeyPairSync("ed25519").privateKey;
    logger.warn("EVIDENCE_SIGNING_KEY not set — using a temporary key; signatures won't verify after restart");
  }
  const publicKey = crypto.createPublicKey(privateKey);
  const publicDer = publicKey.export({ type: "spki", format: "der" });
  cachedKey = {
    privateKey,
    publicKey,
    publicPem: publicKey.export({ type: "spki", format: "pem" }),
    keyId: sha256(publicDer).slice(0, 16),
  };
  return cachedKey;
}
const resetKeyCache = () => {
  cachedKey = null;
};

const signRecordHash = (recordHash, key = loadSigningKey()) =>
  crypto.sign(null, Buffer.from(recordHash, "hex"), key.privateKey).toString("base64");

const verifySignature = (recordHash, signature, publicKey) =>
  crypto.verify(null, Buffer.from(recordHash, "hex"), publicKey, Buffer.from(String(signature), "base64"));

// ── Append (DB) ────────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 6;

/**
 * Seal and append one record. `fields` are the sealed fields (without
 * recordId/seq/hashes). Returns the stored record.
 */
async function appendRecord(fields, extra, { EvidenceRecord, Types }) {
  const key = loadSigningKey();
  if (!key) {
    const err = new Error("Evidence signing key is not configured");
    err.status = 503;
    throw err;
  }
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const last = await EvidenceRecord.findOne().sort({ seq: -1 }).select("seq hash").lean();
    const _id = new Types.ObjectId();
    const sealed = { ...fields, recordId: String(_id) };
    const recordHash = recordHashOf(sealed);
    const seq = last ? last.seq + 1 : 1;
    const prevHash = last ? last.hash : GENESIS;
    const doc = {
      _id,
      ...sealed,
      seq,
      prevHash,
      recordHash,
      hash: chainHashOf({ seq, prevHash, recordHash }),
      signature: signRecordHash(recordHash, key),
      keyId: key.keyId,
      ...extra,
    };
    try {
      return await EvidenceRecord.create(doc);
    } catch (err) {
      if (err && err.code === 11000 && attempt < MAX_ATTEMPTS) continue;
      throw err;
    }
  }
  throw new Error("Could not append evidence record");
}

// The evidence chain appears in the daily ledger anchor as one extra leaf.
const EVIDENCE_LEAF_ID = "evidence";

/** Verify the stored chain in batches (doesn't load everything at once). */
async function verifyStoredChain(EvidenceRecord, batch = 1000) {
  let prev = GENESIS;
  let seq = 0;
  for (;;) {
    const links = await EvidenceRecord.find({ seq: { $gt: seq } })
      .sort({ seq: 1 })
      .limit(batch)
      .select("seq prevHash recordHash hash")
      .lean();
    if (!links.length) break;
    const v = verifyChain(links, { startSeq: seq + 1, startPrev: prev });
    if (!v.valid) return v;
    prev = v.headHash;
    seq = v.headSeq;
    if (links.length < batch) break;
  }
  return { valid: true, length: seq, headHash: prev, headSeq: seq };
}

/** Public, verifiable view of a record (no precise location, no storage refs). */
function publicRecord(r) {
  return {
    id: String(r._id),
    seq: r.seq,
    kind: r.kind,
    purpose: r.purpose,
    slot: r.slot,
    sessionId: r.sessionId,
    userId: r.userId,
    campaignId: r.campaignId || "",
    fundingRequestId: r.fundingRequestId || "",
    visibility: r.visibility,
    mime: r.mime,
    bytes: r.bytes,
    sha256: r.sha256,
    challengeCode: r.challengeCode,
    prompts: r.prompts || [],
    issuedAt: r.issuedAt,
    receivedAt: r.receivedAt,
    client: r.client || {},
    locationCoarse: r.locationCoarse || null,
    locationCommitment: r.locationCommitment || "",
    ipCountry: r.ipCountry || "",
    flags: r.flags || [],
    recordHash: r.recordHash,
    prevHash: r.prevHash,
    hash: r.hash,
    signature: r.signature,
    keyId: r.keyId,
    mediaAvailable: !r.mediaDeletedAt,
  };
}

module.exports = {
  GENESIS,
  ID_PROMPT,
  EVIDENCE_LEAF_ID,
  verifyStoredChain,
  SESSION_TTL_MS,
  ID_DOC_TYPES,
  SLOT_RULES,
  MAX_EVIDENCE_ITEMS,
  CODE_ALPHABET,
  sha256,
  randomCode,
  randomPrompts,
  slotsFor,
  sniffMedia,
  parseClientMeta,
  sealLocation,
  flagsFor,
  canonical,
  recordHashOf,
  chainHashOf,
  verifyChain,
  loadSigningKey,
  resetKeyCache,
  signRecordHash,
  verifySignature,
  appendRecord,
  publicRecord,
};
