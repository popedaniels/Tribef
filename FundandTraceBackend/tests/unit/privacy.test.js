// Subject access, erasure and retention (services/privacy.js), models mocked.
process.env.SECURITY_KEY = process.env.SECURITY_KEY || "c".repeat(64);
process.env.INIT_VECTOR = process.env.INIT_VECTOR || "d".repeat(32);
const bcrypt = require("bcrypt");

const db = {};
const q = (v) => ({ select: () => q(v), lean: async () => v, sort: () => q(v), limit: () => q(v), then: (r, j) => Promise.resolve(v).then(r, j) });
const calls = [];
const rec = (name) => jest.fn(async (...a) => (calls.push([name, ...a]), { modifiedCount: 2, deletedCount: 3 }));
jest.mock("../../models/users", () => ({
  Users: { findById: jest.fn(async () => db.user), updateOne: rec("users.updateOne"), find: () => q(db.stale || []), deleteOne: rec("users.deleteOne") },
  Credentials: { findOne: jest.fn(async () => db.cred), deleteOne: rec("cred.deleteOne") },
}));
jest.mock("../../models/campaignModel", () => ({
  Campaign: { find: () => q(db.funded || []), deleteMany: rec("campaign.deleteMany"), updateMany: rec("campaign.updateMany"), exists: async () => null },
}));
jest.mock("../../models/fundingRequestModel", () => ({ FundingRequests: { countDocuments: async () => db.pending || 0 } }));
jest.mock("../../models/subscriptionModel", () => ({ Subscription: { countDocuments: async () => db.activeSubs || 0 } }));
jest.mock("../../models/donationsModel", () => ({ Donations: { updateMany: rec("donations.updateMany"), exists: async () => null } }));
jest.mock("../../models/pushSubscriptionModel", () => ({ PushSubscription: { deleteMany: rec("push.deleteMany") } }));
jest.mock("../../models/donorUpdateModel", () => ({ EmailOptOut: { updateMany: rec("optout.updateMany") } }));
jest.mock("../../models/activityLogModel", () => ({ ActivityLog: { deleteMany: rec("activity.deleteMany") } }));
jest.mock("../../models/evidenceModel", () => ({ CaptureSession: { deleteMany: rec("capture.deleteMany") } }));

const privacy = require("../../services/privacy");

beforeEach(async () => {
  calls.length = 0;
  db.user = { _id: "u1", email: "Ada@Example.com", role: "user" };
  db.cred = { _id: "cr1", password: await bcrypt.hash("right-password", 4) };
  db.funded = [];
  db.pending = 0;
  db.activeSubs = 0;
});

describe("delete account", () => {
  it("needs the typed confirmation and the right password", async () => {
    expect(await privacy.deleteAccount("u1", { password: "right-password", confirm: "yes" })).toMatchObject({ status: 400 });
    expect(await privacy.deleteAccount("u1", { password: "wrong", confirm: "DELETE" })).toMatchObject({ status: 401 });
    expect(calls).toHaveLength(0);
  });

  it("refuses while money is in escrow or monthly gifts are running", async () => {
    db.funded = [{ _id: "c1", funding: { availableBalance: 5000 } }];
    db.activeSubs = 1;
    const r = await privacy.deleteAccount("u1", { password: "right-password", confirm: "DELETE" });
    expect(r.status).toBe(409);
    expect(r.data.blockers).toHaveLength(2);
    expect(calls).toHaveLength(0);
  });

  it("de-identifies donations, removes the login and signs out everywhere", async () => {
    const r = await privacy.deleteAccount("u1", { password: "right-password", confirm: "DELETE" });
    expect(r.status).toBe(200);
    const don = calls.find(([n]) => n === "donations.updateMany");
    expect(don[1].donorEmail.test("ada@example.com")).toBe(true);
    expect(don[2].$set).toMatchObject({ donorName: "Former donor", anonymous: true, "fraud.ip": "" });
    expect(don[2].$set.donorEmail).toMatch(/^deleted-[0-9a-f]{16}@deleted\.invalid$/);
    expect(calls.some(([n]) => n === "cred.deleteOne")).toBe(true);
    const u = calls.find(([n]) => n === "users.updateOne");
    expect(u[2].$set).toMatchObject({ firstName: "Deleted", suspended: true, phone: "" });
    expect(u[2].$inc).toEqual({ sessionVersion: 1 });
  });

  it("won't self-delete an admin", async () => {
    db.user.role = "admin";
    expect((await privacy.deleteAccount("u1", { password: "right-password", confirm: "DELETE" })).status).toBe(403);
  });
});

describe("retention", () => {
  it("clears old donor IPs and keeps the admin audit trail", async () => {
    const now = new Date("2026-11-24T00:00:00Z");
    const r = await privacy.runRetention(now);
    expect(r).toMatchObject({ donorIpsCleared: 2, activityDeleted: 3 });
    const ip = calls.find(([n]) => n === "donations.updateMany");
    expect(ip[1].createdAt.$lt.toISOString()).toBe("2026-08-26T00:00:00.000Z");
    const logs = calls.find(([n]) => n === "activity.deleteMany");
    expect(logs[1].actorId).toEqual({ $exists: false });
  });
});
