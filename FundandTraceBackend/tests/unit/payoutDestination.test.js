// Bank payouts: cooldown after an organiser changes their account, and the
// provider's account name must match who should be paid.
process.env.SECURITY_KEY = process.env.SECURITY_KEY || "c".repeat(64);
process.env.INIT_VECTOR = process.env.INIT_VECTOR || "d".repeat(32);
process.env.REQUIRE_KYC_FOR_PAYOUT = "false";
process.env.PAYOUT_SECOND_APPROVAL_JSON = JSON.stringify({ NGN: 1e12 });

const db = { fr: null, campaign: null, organizer: null, posted: [], resolved: { accountName: "" }, resolveError: null };
jest.mock("../../models/fundingRequestModel", () => ({
  FundingRequests: {
    findById: jest.fn(async () => db.fr && { ...db.fr }),
    findOneAndUpdate: jest.fn(async (q, u) => (db.fr.status !== "Pending" ? null : (Object.assign(db.fr, u.$set), { ...db.fr }))),
    updateOne: jest.fn(async () => ({})),
  },
}));
jest.mock("../../models/campaignModel", () => ({ Campaign: { findById: jest.fn(async () => db.campaign) } }));
jest.mock("../../models/donationsModel", () => ({ Donations: {} }));
jest.mock("../../models/users", () => ({ Users: { findById: () => ({ select: () => ({ lean: async () => db.organizer }) }) }, Credentials: {} }));
jest.mock("../../services/activityLog", () => ({ addActivity: jest.fn() }));
jest.mock("../../services/declinedFundingRequest", () => ({ declinedFundingRequestMailService: jest.fn() }));
jest.mock("../../services/payoutRails", () => ({
  railFor: () => "flutterwave",
  resolveAccount: jest.fn(async () => {
    if (db.resolveError) throw db.resolveError;
    return db.resolved;
  }),
}));
jest.mock("axios", () => ({ __esModule: true, default: { post: jest.fn(async (url, body) => (db.posted.push(body), { data: {} })) } }));

const { encrypt } = require("../../utility/encryption");
const { approveFundingRequest } = require("../../controller/adminFundingRequests");
const { buildOrganizerUpdate } = require("../../utility/campaignEdits");

const approve = async (body = {}) => {
  const res = { status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  await approveFundingRequest({ params: { id: "f1" }, auth: { id: "a1" }, admin: { _id: "a1", firstName: "Ada", lastName: "Admin" }, body }, res);
  return res;
};

beforeEach(() => {
  db.posted = [];
  db.resolveError = null;
  db.resolved = { accountName: "OKAFOR CHIDINMA GRACE" };
  db.organizer = { firstName: "Chidinma", lastName: "Okafor", identityVerification: { nameOnId: "Chidinma Grace Okafor" } };
  db.campaign = { _id: "c1", organizerId: "u1", funding: { currency: "NGN", bankCode: "058", accountNumber: encrypt("0123456789") }, disputeGovernance: {} };
  db.fr = { _id: "f1", campaignId: "c1", amount: 50000, currency: "NGN", status: "Pending", fundingType: "self" };
});

describe("payout destination checks", () => {
  it("approves when the bank's name for the account matches the organiser's ID name, and records the check", async () => {
    const r = await approve();
    expect(r.code).toBe(200);
    expect(db.fr.bankNameCheck).toMatchObject({ resolvedName: "OKAFOR CHIDINMA GRACE", matched: true });
    expect(db.posted).toHaveLength(1);
  });

  it("refuses a mismatched account unless an admin overrides with a note", async () => {
    db.resolved = { accountName: "MUSA IBRAHIM" };
    const r = await approve();
    expect(r.code).toBe(409);
    expect(r.body).toMatchObject({ code: "bank_name_mismatch", data: { resolvedName: "MUSA IBRAHIM" } });
    expect(db.posted).toHaveLength(0);
    expect((await approve({ nameCheckOverride: "short" })).code).toBe(409);
    const ok = await approve({ nameCheckOverride: "Called organiser on verified number; joint account with spouse" });
    expect(ok.code).toBe(200);
    expect(db.fr.bankNameCheck).toMatchObject({ matched: false, override: { adminName: "Ada Admin" } });
  });

  it("treats a failed lookup as unconfirmed, not as a pass", async () => {
    db.resolveError = Object.assign(new Error("boom"), { status: 502 });
    const r = await approve();
    expect(r.code).toBe(409);
    expect(r.body.error).toMatch(/couldn't find the account/);
  });

  it("holds bank payouts for 48 hours after the organiser changes their account", async () => {
    db.campaign.funding.bankChangedAt = new Date(Date.now() - 10 * 3600e3);
    const r = await approve({ nameCheckOverride: "an override never skips the cooldown" });
    expect(r.code).toBe(423);
    expect(r.body).toMatchObject({ code: "bank_change_cooldown" });
    expect(r.body.error).toMatch(/38 hours/);
    db.campaign.funding.bankChangedAt = new Date(Date.now() - 49 * 3600e3);
    expect((await approve()).code).toBe(200);
  });

  it("checks a third party's account against the named third party, without the organiser cooldown", async () => {
    db.campaign.funding.bankChangedAt = new Date();
    Object.assign(db.fr, { fundingType: "third-party", thirdPartyBankCode: "044", thirdPartyAccountNumber: "0098765432", thirdPartyAccountName: "St. Mary's Hospital Ltd" });
    db.resolved = { accountName: "ST MARYS HOSPITAL LIMITED" };
    expect((await approve()).code).toBe(200);
  });

  it("skips the lookup for Stripe Connect and verified-vendor payouts", async () => {
    const { resolveAccount } = require("../../services/payoutRails");
    resolveAccount.mockClear();
    db.campaign.stripeConnect = { accountId: "acct_1", payoutsEnabled: true };
    db.campaign.funding.bankChangedAt = new Date();
    expect((await approve()).code).toBe(200);
    expect(resolveAccount).not.toHaveBeenCalled();
  });
});

describe("bank change detection (organiser edits)", () => {
  const existing = { funding: { accountNumber: encrypt("0123456789"), bankCode: "058", accountName: encrypt("Chidinma Okafor") } };

  it("starts the cooldown when an existing account is changed", () => {
    const { set, bankChanged } = buildOrganizerUpdate({ funding: { accountNumber: "0999999999", bankCode: "058" } }, existing);
    expect(bankChanged).toBe(true);
    expect(set["funding.bankChangedAt"]).toBeInstanceOf(Date);
  });

  it("doesn't for a re-save of the same details (plain or already encrypted) or a first-time setup", () => {
    expect(buildOrganizerUpdate({ funding: { accountNumber: "0123456789 ", bankCode: "058" } }, existing).bankChanged).toBe(false);
    expect(buildOrganizerUpdate({ funding: { accountNumber: existing.funding.accountNumber } }, existing).bankChanged).toBe(false);
    expect(buildOrganizerUpdate({ funding: { amountExpected: 5000 } }, existing).bankChanged).toBe(false);
    expect(buildOrganizerUpdate({ funding: { accountNumber: "0123456789", bankCode: "058" } }, { funding: {} }).bankChanged).toBe(false);
  });
});
