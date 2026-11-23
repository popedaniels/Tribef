process.env.SECURITY_KEY = process.env.SECURITY_KEY || "e".repeat(64);

// In-memory stand-ins for the models used by controller/evidence.js.
const mockDb = { sessions: new Map(), records: [], users: new Map(), campaigns: new Map(), frs: new Map(), auth: null };
const mockOid = () => require("crypto").randomBytes(12).toString("hex");

jest.mock("../../services/activityLog", () => ({ recordAdminAction: jest.fn() }));
jest.mock("../../utility/auth", () => ({
  getAuthUserId: (d) => d && d.id,
  authenticate: jest.fn(async () => mockDb.auth),
}));

jest.mock("../../models/evidenceModel", () => {
  const actual = jest.requireActual("../../models/evidenceModel");
  const chain = (v) => ({ sort: () => chain(v), select: () => chain(v), limit: () => chain(v), lean: async () => v, maxTimeMS: () => chain(v), then: (r, j) => Promise.resolve(v).then(r, j) });
  const asDoc = (s) => Object.assign(s, { save: jest.fn(async () => s) });
  return {
    onlyRetentionFields: actual.onlyRetentionFields,
    CaptureSession: {
      create: jest.fn(async (doc) => {
        const s = asDoc({ _id: mockOid(), status: "open", records: [], review: {}, ...doc });
        mockDb.sessions.set(String(s._id), s);
        return s;
      }),
      findById: jest.fn(async (id) => mockDb.sessions.get(String(id)) || null),
      findOne: jest.fn(async (q) => {
        const s = mockDb.sessions.get(String(q._id));
        return s && (!q.kind || s.kind === q.kind) ? s : null;
      }),
      countDocuments: jest.fn(async () => 0),
      updateOne: jest.fn(async (q, u) => {
        const s = mockDb.sessions.get(String(q._id));
        if (u.$push?.records) s.records.push(u.$push.records);
      }),
      find: jest.fn((q) => chain([...mockDb.sessions.values()].filter((s) => (!q.kind || s.kind === q.kind) && (!q.status || typeof q.status !== "string" || s.status === q.status)))),
    },
    EvidenceRecord: {
      findOne: jest.fn(() => chain(mockDb.records.length ? mockDb.records[mockDb.records.length - 1] : null)),
      create: jest.fn(async (doc) => {
        mockDb.records.push(doc);
        return doc;
      }),
      findById: jest.fn((id) => chain(mockDb.records.find((r) => String(r._id) === String(id)) || null)),
      find: jest.fn((q) => chain(mockDb.records.filter((r) => (q.sessionId ? r.sessionId === q.sessionId : true)))),
      updateOne: jest.fn(async () => {}),
    },
  };
});
jest.mock("../../models/users", () => ({
  Users: {
    findById: jest.fn((id) => {
      const u = mockDb.users.get(String(id)) || null;
      const p = Promise.resolve(u);
      return Object.assign(p, { select: () => ({ lean: async () => u }) });
    }),
    find: jest.fn(() => ({ select: () => ({ lean: async () => [...mockDb.users.values()] }) })),
  },
}));
jest.mock("../../models/campaignModel", () => ({
  Campaign: {
    findById: jest.fn((id) => ({ select: () => ({ lean: async () => mockDb.campaigns.get(String(id)) || null }) })),
    updateOne: jest.fn(async (q, u) => {
      const c = mockDb.campaigns.get(String(q._id));
      c.updates = c.updates || [];
      c.updates.push(u.$push.updates);
    }),
  },
}));
jest.mock("../../models/fundingRequestModel", () => ({
  FundingRequests: {
    findById: jest.fn((id) => ({ select: () => ({ lean: async () => mockDb.frs.get(String(id)) || null }) })),
    updateOne: jest.fn(async (q, u) => Object.assign(mockDb.frs.get(String(q._id)), { set: u.$set })),
  },
}));

const crypto = require("crypto");
const media = require("../../services/mediaStore");
const ctrl = require("../../controller/evidence");
const ev = require("../../services/evidence");

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), crypto.randomBytes(200)]);
const WEBM = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), crypto.randomBytes(400)]);

const res = () => {
  const r = { statusCode: 200, headers: {}, body: undefined };
  r.status = (c) => ((r.statusCode = c), r);
  r.json = (b) => ((r.body = b), r);
  r.setHeader = (k, v) => (r.headers[k.toLowerCase()] = v);
  r.end = (b) => ((r.body = b), r);
  return r;
};
const call = async (fn, req) => {
  const r = res();
  await fn({ headers: {}, params: {}, query: {}, body: {}, ...req }, r);
  return r;
};

const ORGANISER = "65a0000000000000000000a1";
const ADMIN = { _id: "65a0000000000000000000ad", firstName: "Ada", lastName: "Admin" };
const CAMPAIGN = "65a0000000000000000000c1";
const user = () => mockDb.users.get(ORGANISER);

beforeEach(() => {
  mockDb.sessions.clear();
  mockDb.records.length = 0;
  mockDb.users.clear();
  mockDb.campaigns.clear();
  mockDb.frs.clear();
  mockDb.auth = null;
  mockDb.users.set(ORGANISER, { _id: ORGANISER, firstName: "Chidi", lastName: "Okafor", verified: true, identityVerification: { status: "unverified" }, save: jest.fn(async () => {}) });
  mockDb.campaigns.set(CAMPAIGN, { _id: CAMPAIGN, organizerId: ORGANISER });
  media.setStore(media.memoryStore());
});

async function newSession(body) {
  const r = await call(ctrl.createSession, { auth: { id: ORGANISER }, body });
  expect(r.statusCode).toBe(201);
  return r.body.data;
}
const upload = (s, slot, buf, extra = {}) =>
  call(ctrl.uploadMedia, {
    params: { id: s.id, slot },
    headers: {
      "x-capture-token": s.captureToken,
      "x-content-sha256": ev.sha256(buf),
      "x-capture-meta": JSON.stringify({ capturedAt: new Date().toISOString(), width: 1280, height: 720, location: { lat: 6.4512, lng: 3.3945, accuracy: 15 } }),
      "cf-ipcountry": "NG",
      "user-agent": "Mozilla/5.0 (Android)",
      ...extra.headers,
    },
    body: buf,
  });

describe("campaign evidence", () => {
  it("only the organiser can open a session; the QR link carries the token in the fragment", async () => {
    const other = await call(ctrl.createSession, { auth: { id: "65a0000000000000000000ff" }, body: { kind: "evidence", campaignId: CAMPAIGN } });
    expect(other.statusCode).toBe(403);
    const s = await newSession({ kind: "evidence", campaignId: CAMPAIGN });
    expect(s.handoffUrl).toMatch(new RegExp(`/capture/${s.id}#t=`));
    expect(s.qr).toMatch(/^data:image\/png;base64,/);
    expect(s.code).toMatch(/^[2-9A-Z]{6}$/);
  });

  it("seals a live photo: server time, file hash, coarse location, signature, chain link", async () => {
    const s = await newSession({ kind: "evidence", campaignId: CAMPAIGN });
    const r = await upload(s, "photo", JPEG);
    expect(r.statusCode).toBe(201);
    const rec = r.body.data;
    expect(rec).toMatchObject({ seq: 1, sha256: ev.sha256(JPEG), mime: "image/jpeg", visibility: "public", challengeCode: s.code, ipCountry: "NG" });
    expect(rec.locationCoarse).toEqual({ lat: 6.45, lng: 3.39 });
    expect(rec.prevHash).toBe(ev.GENESIS);
    const stored = mockDb.records[0];
    expect(ev.recordHashOf(stored)).toBe(stored.recordHash);
    expect(ev.verifySignature(stored.recordHash, stored.signature, ev.loadSigningKey().publicKey)).toBe(true);
    expect(stored.preciseLocationEnc).toMatch(/^v2:/); // encrypted, not in the public view
    expect(rec.preciseLocationEnc).toBeUndefined();

    const second = await upload(s, "video", WEBM);
    expect(second.body.data).toMatchObject({ seq: 2, prevHash: rec.hash });
  });

  it("refuses files that aren't camera photos/videos, corrupted uploads, strangers and expired sessions", async () => {
    const s = await newSession({ kind: "evidence", campaignId: CAMPAIGN });
    expect((await upload(s, "photo", Buffer.from("%PDF-1.7 ......................."))).statusCode).toBe(415);
    expect((await upload(s, "photo", WEBM)).statusCode).toBe(415); // a video in the photo slot
    expect((await upload(s, "photo", JPEG, { headers: { "x-content-sha256": "0".repeat(64) } })).statusCode).toBe(422);
    expect((await upload(s, "photo", JPEG, { headers: { "x-capture-token": "x".repeat(43) } })).statusCode).toBe(403);
    mockDb.sessions.get(s.id).expiresAt = new Date(Date.now() - 1000);
    expect((await upload(s, "photo", JPEG)).statusCode).toBe(410);
    expect(mockDb.records).toHaveLength(0);
  });

  it("posts a sealed update to the campaign on submit", async () => {
    const s = await newSession({ kind: "evidence", campaignId: CAMPAIGN });
    await upload(s, "photo", JPEG);
    const r = await call(ctrl.submitSession, { params: { id: s.id }, headers: { "x-capture-token": s.captureToken }, body: { caption: "Cement delivered to the site" } });
    expect(r.statusCode).toBe(200);
    const update = mockDb.campaigns.get(CAMPAIGN).updates[0];
    expect(update).toMatchObject({ story: "Cement delivered to the site", image: `/api/evidence/records/${mockDb.records[0]._id}/media`, video: "" });
    expect(update.evidenceIds).toEqual([String(mockDb.records[0]._id)]);
  });

  it("attaches a live receipt to a paid-out funding request only", async () => {
    const FR = "65a0000000000000000000f1";
    mockDb.frs.set(FR, { _id: FR, campaignId: CAMPAIGN, disbursement: {} });
    const early = await call(ctrl.createSession, { auth: { id: ORGANISER }, body: { kind: "evidence", purpose: "receipt", campaignId: CAMPAIGN, fundingRequestId: FR } });
    expect(early.statusCode).toBe(409);
    mockDb.frs.get(FR).disbursement.dateDisbursed = new Date();
    const s = await newSession({ kind: "evidence", purpose: "receipt", campaignId: CAMPAIGN, fundingRequestId: FR });
    await upload(s, "photo", JPEG);
    await call(ctrl.submitSession, { params: { id: s.id }, headers: { "x-capture-token": s.captureToken } });
    expect(mockDb.frs.get(FR).set["disbursement.receipt"]).toBe(`/api/evidence/records/${mockDb.records[0]._id}/media`);
    expect(mockDb.frs.get(FR).set["disbursement.receiptEvidenceSessionId"]).toBe(s.id);
  });
});

describe("identity verification", () => {
  async function submittedIdentity(docType = "national_id") {
    const s = await newSession({ kind: "identity", docType, docCountry: "Nigeria" });
    expect(s.prompts).toHaveLength(2);
    await upload(s, "id_front", JPEG);
    if (docType !== "passport") await upload(s, "id_back", JPEG);
    await upload(s, "selfie_video", WEBM);
    const r = await call(ctrl.submitSession, { params: { id: s.id }, headers: { "x-capture-token": s.captureToken } });
    expect(r.statusCode).toBe(200);
    return s;
  }
  const allChecks = { codeSpoken: true, promptsFollowed: true, faceMatchesId: true, documentLooksGenuine: true, nameMatchesAccount: true };

  it("keeps ID files private and encrypted at rest", async () => {
    const s = await newSession({ kind: "identity", docType: "passport", docCountry: "Nigeria" });
    const r = await upload(s, "id_front", JPEG);
    expect(r.body.data.visibility).toBe("private");
    const stored = media.store.files.get(mockDb.records[0].storageId);
    expect(stored.encrypted).toBe(true);
    expect(stored.body.equals(JPEG)).toBe(false);
    expect((await media.store.get(mockDb.records[0].storageId)).buffer.equals(JPEG)).toBe(true);

    // Not visible to the public…
    mockDb.auth = null;
    const anon = await call(ctrl.getMedia, { params: { id: String(mockDb.records[0]._id) } });
    expect(anon.statusCode).toBe(404);
    // …but the owner can see their own.
    mockDb.auth = { id: ORGANISER };
    const own = await call(ctrl.getMedia, { params: { id: String(mockDb.records[0]._id) } });
    expect(own.statusCode).toBe(200);
    expect(own.headers["cache-control"]).toBe("private, no-store");

    // An admin can see it, and the view is written to the admin activity log.
    const { recordAdminAction } = require("../../services/activityLog");
    mockDb.users.set(ADMIN._id, { ...ADMIN, role: "admin" });
    mockDb.auth = { id: ADMIN._id };
    const adminView = await call(ctrl.getMedia, { params: { id: String(mockDb.records[0]._id) } });
    expect(adminView.statusCode).toBe(200);
    expect(recordAdminAction).toHaveBeenCalledWith(expect.objectContaining({ admin: expect.objectContaining({ role: "admin" }) }), "view private evidence", expect.objectContaining({ targetId: String(mockDb.records[0]._id) }));
    // A different signed-in user can't.
    mockDb.users.set("65a0000000000000000000ee", { _id: "65a0000000000000000000ee", role: "user" });
    mockDb.auth = { id: "65a0000000000000000000ee" };
    expect((await call(ctrl.getMedia, { params: { id: String(mockDb.records[0]._id) } })).statusCode).toBe(404);
  });

  it("won't submit with an item missing, and each item can be captured once", async () => {
    const s = await newSession({ kind: "identity", docType: "national_id", docCountry: "Ghana" });
    await upload(s, "id_front", JPEG);
    expect((await upload(s, "id_front", JPEG)).statusCode).toBe(409);
    const r = await call(ctrl.submitSession, { params: { id: s.id }, headers: { "x-capture-token": s.captureToken } });
    expect(r.statusCode).toBe(422);
    expect(r.body.missing).toEqual(["id_back", "selfie_video"]);
  });

  it("submission marks the check as submitted, without touching the email-verified flag", async () => {
    await submittedIdentity();
    expect(user().identityVerification).toMatchObject({ status: "pending", method: "in_app", idCountry: "Nigeria" });
    expect(user().identityVerification.submittedAt).toBeInstanceOf(Date);
    expect(user().verified).toBe(true);
  });

  it("approval needs every check and the name on the ID; admins can't approve themselves", async () => {
    const s = await submittedIdentity();
    const decide = (body, admin = ADMIN) => call(ctrl.decideIdentity, { params: { id: s.id }, admin, body });

    expect((await decide({ decision: "approve", nameOnId: "CHIDI OKAFOR", checks: { ...allChecks, codeSpoken: false } })).statusCode).toBe(422);
    expect((await decide({ decision: "approve", checks: allChecks })).statusCode).toBe(422);
    expect((await decide({ decision: "approve", nameOnId: "CHIDI OKAFOR", checks: allChecks }, { ...ADMIN, _id: ORGANISER })).statusCode).toBe(403);

    const ok = await decide({ decision: "approve", nameOnId: "CHIDI OKAFOR", checks: allChecks });
    expect(ok.statusCode).toBe(200);
    expect(user().identityVerification).toMatchObject({ status: "verified", method: "in_app", nameOnId: "CHIDI OKAFOR", facialLivenessMatched: true });
    expect(user().verified).toBe(true);
    expect((await decide({ decision: "reject", reason: "changed my mind about it" })).statusCode).toBe(409);
  });

  it("won't approve if a sealed record was altered", async () => {
    const s = await submittedIdentity("passport");
    mockDb.records[0].sha256 = ev.sha256(Buffer.from("swapped photo"));
    const r = await call(ctrl.decideIdentity, { params: { id: s.id }, admin: ADMIN, body: { decision: "approve", nameOnId: "CHIDI OKAFOR", checks: allChecks } });
    expect(r.statusCode).toBe(409);
  });

  it("rejection tells the organiser what to fix and lets them retry", async () => {
    const s = await submittedIdentity();
    expect((await call(ctrl.decideIdentity, { params: { id: s.id }, admin: ADMIN, body: { decision: "reject", reason: "short" } })).statusCode).toBe(422);
    await call(ctrl.decideIdentity, { params: { id: s.id }, admin: ADMIN, body: { decision: "reject", reason: "The code isn't audible in the video" } });
    expect(user().identityVerification).toMatchObject({ status: "requires_input", rejectionReason: "The code isn't audible in the video" });
    expect(user().verified).toBe(true);
    await newSession({ kind: "identity", docType: "passport", docCountry: "Nigeria" });
  });

  it("deletes ID files after the retention period but keeps the sealed fingerprints", async () => {
    const s = await submittedIdentity("passport");
    await call(ctrl.decideIdentity, { params: { id: s.id }, admin: ADMIN, body: { decision: "approve", nameOnId: "CHIDI OKAFOR", checks: allChecks } });
    mockDb.sessions.get(s.id).review.decidedAt = new Date(Date.now() - 40 * 86400000);
    const { EvidenceRecord } = require("../../models/evidenceModel");
    EvidenceRecord.find.mockImplementationOnce(() => ({ select: () => ({ lean: async () => mockDb.records }) }));
    const before = media.store.files.size;
    const out = await ctrl.purgeIdentityMedia({ days: 30 });
    expect(out.purged).toBe(2);
    expect(media.store.files.size).toBe(before - 2);
    expect(EvidenceRecord.updateOne).toHaveBeenCalledWith(expect.anything(), { $set: expect.objectContaining({ mediaDeletedReason: "retention 30d" }) });
    expect(await ctrl.purgeIdentityMedia({ days: 0 })).toMatchObject({ purged: 0 });
  });
});

describe("serving public media", () => {
  it("serves byte ranges (needed for video on iPhone) with a content-addressed ETag", async () => {
    const s = await newSession({ kind: "evidence", campaignId: CAMPAIGN });
    await upload(s, "video", WEBM);
    const id = String(mockDb.records[0]._id);
    const full = await call(ctrl.getMedia, { params: { id } });
    expect(full.statusCode).toBe(200);
    expect(full.body.equals(WEBM)).toBe(true);
    expect(full.headers.etag).toBe(`"${ev.sha256(WEBM)}"`);
    expect(full.headers["cache-control"]).toContain("immutable");
    const part = await call(ctrl.getMedia, { params: { id }, headers: { range: "bytes=0-9" } });
    expect(part.statusCode).toBe(206);
    expect(part.headers["content-range"]).toBe(`bytes 0-9/${WEBM.length}`);
    expect(part.body.equals(WEBM.subarray(0, 10))).toBe(true);
  });
});
