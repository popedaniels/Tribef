const crypto = require("crypto");
const ev = require("../../services/evidence");
const { EvidenceRecord, onlyRetentionFields } = require("../../models/evidenceModel");
const { canLaunch, launchGate } = require("../../services/kycGate");

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(60, 1)]);
const WEBM = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(60, 2)]);
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x20]), Buffer.from("ftypisom"), Buffer.alloc(60, 3)]);

const sealed = (over = {}) => ({
  recordId: "65a000000000000000000001",
  sessionId: "65a000000000000000000002",
  userId: "65a000000000000000000003",
  kind: "evidence",
  purpose: "update",
  slot: "photo",
  campaignId: "65a000000000000000000004",
  fundingRequestId: "",
  visibility: "public",
  mime: "image/jpeg",
  bytes: JPEG.length,
  sha256: ev.sha256(JPEG),
  challengeCode: "K7M2QX",
  prompts: [],
  issuedAt: new Date("2026-11-23T10:00:00Z"),
  receivedAt: new Date("2026-11-23T10:03:10Z"),
  client: { capturedAt: new Date("2026-11-23T10:03:05Z"), width: 1280, height: 720, durationMs: null, facingMode: "environment", userAgent: "UA" },
  locationCoarse: { lat: 6.45, lng: 3.39 },
  locationCommitment: "c".repeat(64),
  ipCountry: "NG",
  flags: [],
  ...over,
});

const buildChain = (n) => {
  let prev = ev.GENESIS;
  return Array.from({ length: n }, (_, i) => {
    const recordHash = ev.recordHashOf(sealed({ recordId: `r${i}` }));
    const link = { seq: i + 1, prevHash: prev, recordHash };
    link.hash = ev.chainHashOf(link);
    prev = link.hash;
    return link;
  });
};

describe("sealing", () => {
  it("is deterministic", () => {
    expect(ev.recordHashOf(sealed())).toBe(ev.recordHashOf(sealed()));
    expect(ev.recordHashOf(sealed())).toMatch(/^[0-9a-f]{64}$/);
  });

  it.each([
    ["file fingerprint", { sha256: ev.sha256(Buffer.from("other photo")) }],
    ["server time", { receivedAt: new Date("2026-11-23T10:03:11Z") }],
    ["challenge code", { challengeCode: "AAAAAA" }],
    ["campaign", { campaignId: "65a000000000000000000009" }],
    ["location", { locationCoarse: { lat: 6.46, lng: 3.39 } }],
    ["device time", { client: { ...sealed().client, capturedAt: new Date("2025-01-01T00:00:00Z") } }],
    ["flags", { flags: ["device_clock_mismatch"] }],
    ["visibility", { visibility: "private" }],
  ])("changes when the %s changes", (_, over) => {
    expect(ev.recordHashOf(sealed(over))).not.toBe(ev.recordHashOf(sealed()));
  });

  it("signs the record hash with Ed25519 and rejects a tampered hash", () => {
    const key = ev.loadSigningKey();
    const rh = ev.recordHashOf(sealed());
    const sig = ev.signRecordHash(rh, key);
    expect(ev.verifySignature(rh, sig, key.publicKey)).toBe(true);
    expect(ev.verifySignature(ev.recordHashOf(sealed({ bytes: 1 })), sig, key.publicKey)).toBe(false);
  });

  it("loads a configured key in every supported encoding, with a stable key id", () => {
    const { privateKey } = crypto.generateKeyPairSync("ed25519");
    const pem = privateKey.export({ type: "pkcs8", format: "pem" });
    const ids = [pem.replace(/\n/g, "\\n"), Buffer.from(pem).toString("base64"), privateKey.export({ type: "pkcs8", format: "der" }).toString("base64")].map(
      (v) => {
        process.env.EVIDENCE_SIGNING_KEY = v;
        ev.resetKeyCache();
        return ev.loadSigningKey().keyId;
      }
    );
    expect(new Set(ids).size).toBe(1);
    delete process.env.EVIDENCE_SIGNING_KEY;
    ev.resetKeyCache();
  });

  it("refuses to seal in production without a configured key", () => {
    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    delete process.env.EVIDENCE_SIGNING_KEY;
    ev.resetKeyCache();
    expect(ev.loadSigningKey()).toBeNull();
    process.env.NODE_ENV = env;
    ev.resetKeyCache();
  });
});

describe("evidence chain", () => {
  it("verifies an untouched chain", () => {
    expect(ev.verifyChain(buildChain(5))).toMatchObject({ valid: true, length: 5, headSeq: 5 });
  });

  it("detects an edited record", () => {
    const c = buildChain(5);
    c[2].recordHash = ev.recordHashOf(sealed({ recordId: "r2", challengeCode: "ZZZZZZ" }));
    expect(ev.verifyChain(c)).toMatchObject({ valid: false, brokenAt: 3 });
  });

  it("detects a deleted record", () => {
    const c = buildChain(5);
    c.splice(1, 1);
    expect(ev.verifyChain(c).valid).toBe(false);
  });

  it("detects a re-hashed edit (later links no longer connect)", () => {
    const c = buildChain(5);
    c[1].recordHash = ev.recordHashOf(sealed({ recordId: "x" }));
    c[1].hash = ev.chainHashOf(c[1]);
    expect(ev.verifyChain(c)).toMatchObject({ valid: false, brokenAt: 3 });
  });

  it("verifies a later page given where the previous one ended", () => {
    const c = buildChain(6);
    expect(ev.verifyChain(c.slice(3), { startSeq: 4, startPrev: c[2].hash }).valid).toBe(true);
  });

  it("verifies the stored chain in batches", async () => {
    const c = buildChain(7);
    const Model = {
      find: (q) => ({
        sort: () => ({
          limit: (n) => ({ select: () => ({ lean: async () => c.filter((l) => l.seq > q.seq.$gt).slice(0, n) }) }),
        }),
      }),
    };
    expect(await ev.verifyStoredChain(Model, 3)).toMatchObject({ valid: true, headSeq: 7, headHash: c[6].hash });
    c[4].hash = "f".repeat(64);
    expect(await ev.verifyStoredChain(Model, 3)).toMatchObject({ valid: false, brokenAt: 5 });
  });
});

describe("media and metadata checks", () => {
  it("identifies files by their bytes, not their name or Content-Type", () => {
    expect(ev.sniffMedia(JPEG)).toEqual({ mime: "image/jpeg", media: "photo" });
    expect(ev.sniffMedia(WEBM)).toEqual({ mime: "video/webm", media: "video" });
    expect(ev.sniffMedia(MP4)).toEqual({ mime: "video/mp4", media: "video" });
    expect(ev.sniffMedia(Buffer.from("%PDF-1.7 not a camera capture......"))).toBeNull();
    expect(ev.sniffMedia(Buffer.from("<svg onload=alert(1)>............"))).toBeNull();
  });

  it("bounds client metadata and drops what it doesn't know", () => {
    const m = ev.parseClientMeta(
      JSON.stringify({ capturedAt: "2026-11-23T10:00:00Z", width: 99999, height: 720, facingMode: "sideways", location: { lat: 91, lng: 3 }, evil: "$where" })
    );
    expect(m).toMatchObject({ width: null, height: 720, facingMode: "", location: null });
    expect(m.evil).toBeUndefined();
    expect(ev.parseClientMeta("{not json").capturedAt).toBeNull();
  });

  it("publishes location rounded to ~1 km and commits to the precise one", () => {
    const loc = ev.sealLocation({ lat: 6.451234, lng: 3.394567, accuracy: 12 }, "salt");
    expect(loc.coarse).toEqual({ lat: 6.45, lng: 3.39 });
    expect(loc.commitment).toBe(ev.sealLocation({ lat: 6.451234, lng: 3.394567, accuracy: 12 }, "salt").commitment);
    expect(loc.commitment).not.toBe(ev.sealLocation({ lat: 6.451235, lng: 3.394567, accuracy: 12 }, "salt").commitment);
    expect(ev.sealLocation(null)).toEqual({ coarse: null, commitment: "", precise: null });
  });

  it("flags a phone clock that disagrees with ours, and missing location", () => {
    const receivedAt = new Date("2026-11-23T10:30:00Z");
    expect(ev.flagsFor({ clientMeta: { capturedAt: new Date("2026-11-23T10:29:00Z") }, receivedAt, location: { lat: 1, lng: 1 } })).toEqual([]);
    expect(ev.flagsFor({ clientMeta: { capturedAt: new Date("2026-11-20T10:00:00Z") }, receivedAt, location: null })).toEqual([
      "no_location",
      "device_clock_mismatch",
    ]);
  });

  it("issues unambiguous codes and distinct prompts", () => {
    for (let i = 0; i < 50; i += 1) expect(ev.randomCode()).toMatch(/^[2-9A-HJKMNP-Z]{6}$/);
    const p = ev.randomPrompts(2);
    expect(new Set(p).size).toBe(2);
  });

  it("asks for the back of the document unless it's a passport", () => {
    expect(ev.slotsFor("identity", "passport")).toEqual(["id_front", "selfie_video"]);
    expect(ev.slotsFor("identity", "national_id")).toEqual(["id_front", "id_back", "selfie_video"]);
  });
});

describe("append-only records", () => {
  it("allows only the retention fields to change", () => {
    expect(onlyRetentionFields({ $set: { mediaDeletedAt: new Date(), mediaDeletedReason: "retention" } })).toBe(true);
    expect(onlyRetentionFields({ $set: { sha256: "x" } })).toBe(false);
    expect(onlyRetentionFields({ $set: { mediaDeletedAt: new Date(), receivedAt: new Date() } })).toBe(false);
    expect(onlyRetentionFields({ $unset: { flags: 1 } })).toBe(false);
  });

  it("rejects updates and deletes before they reach the database", async () => {
    await expect(EvidenceRecord.updateOne({ seq: 1 }, { $set: { sha256: "0".repeat(64) } })).rejects.toMatchObject({ code: "EVIDENCE_IMMUTABLE" });
    await expect(EvidenceRecord.findOneAndUpdate({ seq: 1 }, { flags: [] })).rejects.toMatchObject({ code: "EVIDENCE_IMMUTABLE" });
    await expect(EvidenceRecord.deleteOne({ seq: 1 })).rejects.toMatchObject({ code: "EVIDENCE_IMMUTABLE" });
    await expect(EvidenceRecord.deleteMany({})).rejects.toMatchObject({ code: "EVIDENCE_IMMUTABLE" });
    await expect(EvidenceRecord.replaceOne({ seq: 1 }, {})).rejects.toMatchObject({ code: "EVIDENCE_IMMUTABLE" });
  });
});

describe("identity gate for launching", () => {
  it("defaults to requiring a submitted check", () => {
    expect(launchGate(undefined)).toBe("submitted");
    expect(launchGate("false")).toBe("off");
    expect(launchGate("true")).toBe("verified");
  });

  it("lets a submitted check launch but not one that was only started", () => {
    expect(canLaunch({ status: "pending", submittedAt: new Date() }, "submitted").allowed).toBe(true);
    expect(canLaunch({ status: "pending", submittedAt: null }, "submitted").allowed).toBe(false);
    expect(canLaunch({ status: "unverified" }, "submitted").allowed).toBe(false);
    expect(canLaunch({ status: "pending", submittedAt: new Date() }, "verified").allowed).toBe(false);
    expect(canLaunch({ status: "verified" }, "verified").allowed).toBe(true);
    expect(canLaunch({ status: "requires_input", rejectionReason: "Video too dark" }, "submitted").message).toContain("Video too dark");
  });
});
