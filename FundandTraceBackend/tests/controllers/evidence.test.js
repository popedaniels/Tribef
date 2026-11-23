// Live evidence + in-app identity, end to end over HTTP with a real MongoDB
// and GridFS (runs in CI's Mongo service). Unit-level cases live in
// tests/unit/evidence*.test.js.
const crypto = require("crypto");
const chai = require("chai");
const chaiHttp = require("chai-http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const server = require("../../server");
const { Users } = require("../../models/users");
const { Campaign } = require("../../models/campaignModel");
const { EvidenceRecord, CaptureSession } = require("../../models/evidenceModel");
const ev = require("../../services/evidence");

chai.use(chaiHttp);
const { expect } = chai;

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), crypto.randomBytes(2048)]);
const WEBM = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), crypto.randomBytes(8192)]);
const cookieFor = (u) => `token=${jwt.sign({ id: String(u._id), email: u.email, sv: 0 }, process.env.TOKEN_SECRET)}`;

const waitForDb = async () => {
  for (let i = 0; i < 100 && mongoose.connection.readyState !== 1; i += 1) await new Promise((r) => setTimeout(r, 100));
};

describe("Live evidence & in-app identity", function suite() {
  this.timeout(30000);
  let organiser;
  let admin;
  let campaign;

  before(async () => {
    await waitForDb();
    const tag = crypto.randomBytes(4).toString("hex");
    organiser = await Users.create({ firstName: "Chidi", lastName: "Okafor", email: `org-${tag}@example.com`, verified: true });
    admin = await Users.create({ firstName: "Ada", lastName: "Admin", email: `adm-${tag}@example.com`, verified: true, role: "admin" });
    campaign = await Campaign.create({ organizerId: String(organiser._id), basicInformation: { campaignTitle: "Clinic roof" }, funding: { amountExpected: 1000, currency: "NGN" } });
  });

  const upload = (session, slot, buf) =>
    chai
      .request(server)
      .post(`/api/evidence/sessions/${session.id}/media/${slot}`)
      .set("X-Capture-Token", session.captureToken)
      .set("X-Content-SHA256", ev.sha256(buf))
      .set("X-Capture-Meta", JSON.stringify({ capturedAt: new Date().toISOString(), width: 1280, height: 720 }))
      .set("Content-Type", "application/octet-stream")
      .send(buf);

  it("requires sign-in to open a capture session", async () => {
    const res = await chai.request(server).post("/api/evidence/sessions").send({ kind: "evidence", campaignId: String(campaign._id) });
    expect(res).to.have.status(401);
  });

  it("seals a live photo, serves it back byte-for-byte, and the record verifies", async () => {
    const s = (await chai.request(server).post("/api/evidence/sessions").set("Cookie", cookieFor(organiser)).send({ kind: "evidence", campaignId: String(campaign._id) })).body.data;
    const up = await upload(s, "photo", JPEG);
    expect(up).to.have.status(201);
    expect(up.body.data.sha256).to.equal(ev.sha256(JPEG));

    const sub = await chai.request(server).post(`/api/evidence/sessions/${s.id}/submit`).set("X-Capture-Token", s.captureToken).send({ caption: "Roof sheets delivered" });
    expect(sub).to.have.status(200);

    const rec = await chai.request(server).get(`/api/evidence/records/${up.body.data.id}`);
    expect(rec.body.data.checks).to.deep.equal({ recordHashMatches: true, linkHashMatches: true, signatureValid: true });

    const media = await chai.request(server).get(rec.body.data.mediaUrl).buffer(true).parse((res, cb) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => cb(null, Buffer.concat(chunks)));
    });
    expect(media).to.have.status(200);
    expect(ev.sha256(media.body)).to.equal(ev.sha256(JPEG));

    const list = await chai.request(server).get(`/api/evidence/campaign/${campaign._id}`);
    expect(list.body.data.map((r) => r.id)).to.include(up.body.data.id);
    const updated = await Campaign.findById(campaign._id).lean();
    expect(updated.updates.at(-1)).to.include({ story: "Roof sheets delivered", evidenceSessionId: s.id });
  });

  it("refuses to modify or delete a sealed record", async () => {
    const r = await EvidenceRecord.findOne().sort({ seq: -1 });
    let error;
    try {
      await EvidenceRecord.updateOne({ _id: r._id }, { $set: { sha256: "0".repeat(64) } });
    } catch (e) {
      error = e;
    }
    expect(error && error.code).to.equal("EVIDENCE_IMMUTABLE");
    r.sha256 = "0".repeat(64);
    await r.save().catch(() => {});
    const again = await EvidenceRecord.findById(r._id).lean();
    expect(again.sha256).to.not.equal("0".repeat(64));
  });

  it("identity: live capture → review queue → approval, with files private", async () => {
    const s = (
      await chai.request(server).post("/api/evidence/sessions").set("Cookie", cookieFor(organiser)).send({ kind: "identity", docType: "passport", docCountry: "Nigeria" })
    ).body.data;
    const front = await upload(s, "id_front", JPEG);
    expect(front).to.have.status(201);
    expect((await upload(s, "selfie_video", WEBM)).status).to.equal(201);
    expect((await chai.request(server).post(`/api/evidence/sessions/${s.id}/submit`).set("X-Capture-Token", s.captureToken).send({})).status).to.equal(200);

    // The ID photo is not public.
    expect((await chai.request(server).get(`/api/evidence/records/${front.body.data.id}/media`)).status).to.equal(404);

    const queue = await chai.request(server).get("/api/evidence/admin/identity").set("Cookie", cookieFor(admin));
    expect(queue).to.have.status(200);
    const item = queue.body.data.find((q) => q.id === s.id);
    expect(item.items.every((i) => i.intact)).to.equal(true);

    const decision = await chai
      .request(server)
      .post(`/api/evidence/admin/identity/${s.id}/decision`)
      .set("Cookie", cookieFor(admin))
      .send({
        decision: "approve",
        nameOnId: "CHIDI OKAFOR",
        checks: { codeSpoken: true, promptsFollowed: true, faceMatchesId: true, documentLooksGenuine: true, nameMatchesAccount: true },
      });
    expect(decision).to.have.status(200);
    const u = await Users.findById(organiser._id).lean();
    expect(u.identityVerification).to.include({ status: "verified", method: "in_app" });
    expect(u.verified).to.equal(true); // email-verified flag untouched
  });

  it("the public chain verifies end to end", async () => {
    const { links } = (await chai.request(server).get("/api/evidence/chain?limit=5000")).body.data;
    expect(ev.verifyChain(links).valid).to.equal(true);
  });

  after(async () => {
    await CaptureSession.deleteMany({ userId: { $in: [String(organiser._id), String(admin._id)] } });
    await Users.deleteMany({ _id: { $in: [organiser._id, admin._id] } });
    await Campaign.deleteOne({ _id: campaign._id });
  });
});
