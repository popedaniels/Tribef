process.env.SECURITY_KEY = process.env.SECURITY_KEY || "c".repeat(64);
process.env.PAYOUT_SECOND_APPROVAL_JSON = JSON.stringify({ NGN: 1000000 });
process.env.REQUIRE_KYC_FOR_PAYOUT = "false";

const db = { fr: null, posted: [] };
const matches = (doc, q) =>
  Object.entries(q).every(([k, v]) => {
    if (k === "$or") return v.some((alt) => matches(doc, alt));
    const val = k.split(".").reduce((o, p) => (o == null ? undefined : o[p]), doc);
    if (v && typeof v === "object" && !(v instanceof Date)) {
      if ("$exists" in v) return v.$exists ? val !== undefined : val === undefined;
      if ("$nin" in v) return !v.$nin.includes(val ?? "");
    }
    return String(val) === String(v);
  });
jest.mock("../../models/fundingRequestModel", () => ({
  FundingRequests: {
    findById: jest.fn(async () => db.fr && { ...db.fr }),
    findOneAndUpdate: jest.fn(async (q, u) => {
      if (!db.fr || !matches(db.fr, { ...q, _id: db.fr._id })) return null;
      Object.assign(db.fr, u.$set);
      return { ...db.fr };
    }),
    updateOne: jest.fn(async () => ({})),
  },
}));
jest.mock("../../models/campaignModel", () => ({ Campaign: { findById: jest.fn(async () => ({ _id: "c1", funding: { currency: "NGN" }, disputeGovernance: {} })) } }));
jest.mock("../../models/donationsModel", () => ({ Donations: {} }));
jest.mock("../../models/users", () => ({ Users: {}, Credentials: {} }));
jest.mock("../../services/activityLog", () => ({ addActivity: jest.fn() }));
jest.mock("../../services/declinedFundingRequest", () => ({ declinedFundingRequestMailService: jest.fn() }));
jest.mock("axios", () => ({ __esModule: true, default: { post: jest.fn(async (url, body) => (db.posted.push(body), { data: {} })) } }));

const { approveFundingRequest } = require("../../controller/adminFundingRequests");
const policy = require("../../services/payoutApproval");

const approve = async (adminId) => {
  const res = { locals: {}, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  await approveFundingRequest({ params: { id: "f1" }, auth: { id: adminId }, admin: { _id: adminId, firstName: adminId } }, res);
  return res;
};
const fresh = (amount) => (db.fr = { _id: "f1", campaignId: "c1", amount, currency: "NGN", status: "Pending", fundingType: "third-party" });

beforeEach(() => (db.posted = []));

describe("two-person rule for large payouts", () => {
  it("pays small payouts on one approval", async () => {
    fresh(500000);
    expect((await approve("a1")).code).toBe(200);
    expect(db.posted).toHaveLength(1);
  });
  it("records the first approval of a large payout without moving money", async () => {
    fresh(5000000);
    const r = await approve("a1");
    expect(r.code).toBe(202);
    expect(r.body.code).toBe("awaiting_second_approval");
    expect(db.fr.status).toBe("Pending");
    expect(db.posted).toHaveLength(0);
  });
  it("refuses the same admin twice", async () => {
    const r = await approve("a1");
    expect(r.code).toBe(409);
    expect(r.body.code).toBe("second_approver_required");
    expect(db.posted).toHaveLength(0);
  });
  it("releases it on a second, different admin", async () => {
    const r = await approve("a2");
    expect(r.code).toBe(200);
    expect(db.fr).toMatchObject({ status: "Approved", adminId: "a2", firstApproval: { adminId: "a1" } });
    expect(db.posted).toHaveLength(1);
  });
  it("treats an expired first approval as a new first approval", async () => {
    fresh(5000000);
    db.fr.firstApproval = { adminId: "a1", adminName: "a1", at: new Date(Date.now() - 80 * 36e5) };
    const r = await approve("a2");
    expect(r.code).toBe(202);
    expect(db.fr.firstApproval.adminId).toBe("a2");
  });
  it("thresholds are per currency and off when unset", () => {
    expect(policy.needsSecondApproval(1000001, "NGN")).toBe(true);
    expect(policy.needsSecondApproval(10 ** 9, "GBP")).toBe(false);
  });
});
