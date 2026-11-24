// Unit tests for the funding-request payout handler (models + Stripe mocked).
// Covers the escrow guarantees the platform advertises: single payout per
// request, dispute freeze, balance reserved before money moves, and a
// completed payout never reported as failed because an email bounced.

process.env.SECURITY_KEY = process.env.SECURITY_KEY || "c".repeat(64);

const REQ_ID = "60f7117f2ee78d31b4de0aaa";
const CAMPAIGN_ID = "60f7117f2ee78d31b4de0bbb";

const state = {};
const calls = [];

const mockFundingRequests = {
  findOneAndUpdate: jest.fn(async () => state.claimed),
  updateOne: jest.fn(async (...args) => {
    calls.push(["fr.updateOne", args]);
    return { modifiedCount: 1 };
  }),
  find: jest.fn(async () => []),
};
const mockCampaign = {
  findById: jest.fn(async () => state.campaign),
  updateOne: jest.fn(async (filter, update) => {
    calls.push(["campaign.updateOne", update]);
    return { modifiedCount: state.reserveOk === false && update.$inc["funding.availableBalance"] < 0 ? 0 : 1 };
  }),
  find: jest.fn(() => ({ limit: async () => [] })),
};
const mockStripe = {
  transfers: {
    create: jest.fn(async () => {
      calls.push(["stripe.transfer"]);
      if (state.transferFails) throw new Error("stripe down");
      return { id: "tr_1", status: "paid" };
    }),
  },
};

jest.mock("../../controller/donations/shared", () => ({
  Campaign: mockCampaign,
  FundingRequests: mockFundingRequests,
  addActivity: jest.fn(),
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  // payout.js destructures `stripe` at require-time, so export it directly.
  stripe: mockStripe,
}));
const mockLedger = [];
const mockRails = { rail: null, sent: [], result: { provider: "flutterwave", reference: "ft-payout-x-1", providerId: "99", status: "pending" } };
jest.mock("../../services/payoutRails", () => ({
  railFor: () => mockRails.rail,
  sendBankTransfer: jest.fn(async (args) => {
    mockRails.sent.push(args);
    return mockRails.result;
  }),
}));
jest.mock("../../services/ledger", () => ({
  appendEntry: jest.fn(async (entry) => {
    mockLedger.push(entry);
    return entry;
  }),
}));
jest.mock("../../models/campaignEmailWhitelist", () => ({
  CampaignEmailWhitelist: { distinct: jest.fn(async () => state.whitelist || []) },
}));
jest.mock("../../services/approvedFundingRequest", () => ({
  approvedFundingRequestMailService: jest.fn(async () => {
    if (state.mailFails) throw new Error("smtp down");
  }),
}));
jest.mock("../../services/fundingSummaryMail", () => ({
  fundingSummaryMailService: jest.fn(async () => undefined),
}));

const { stripePayoutWebhook } = require("../../controller/donations/payout");

const makeRequestDoc = (overrides = {}) => ({
  _id: REQ_ID,
  amount: 250,
  fundingType: "",
  save: jest.fn(async () => undefined),
  ...overrides,
});

const call = async (body = {}) => {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  await stripePayoutWebhook({ params: { id: REQ_ID }, body: { campaignId: CAMPAIGN_ID, ...body } }, res);
  return res;
};

beforeEach(() => {
  calls.length = 0;
  mockLedger.length = 0;
  mockRails.rail = null;
  mockRails.sent.length = 0;
  mockRails.result = { provider: "flutterwave", reference: "ft-payout-x-1", providerId: "99", status: "pending" };
  jest.clearAllMocks();
  Object.assign(state, {
    claimed: makeRequestDoc(),
    campaign: {
      funding: { availableBalance: 1000, currency: "GBP" },
      stripeConnect: { accountId: "acct_1", payoutsEnabled: true },
      disputeGovernance: { isLocked: false },
    },
    reserveOk: true,
    transferFails: false,
    mailFails: false,
    whitelist: ["donor@example.com"],
  });
});

describe("stripePayoutWebhook", () => {
  it("returns 409 when the request is already locked/processed (no double payout)", async () => {
    state.claimed = null;
    const res = await call();
    expect(res.statusCode).toBe(409);
    expect(mockStripe.transfers.create).not.toHaveBeenCalled();
    expect(mockCampaign.updateOne).not.toHaveBeenCalled();
  });

  it("refuses to pay out while the campaign is dispute-locked, and releases the lock", async () => {
    state.campaign.disputeGovernance.isLocked = true;
    const res = await call();
    expect(res.statusCode).toBe(423);
    expect(mockStripe.transfers.create).not.toHaveBeenCalled();
    expect(calls.some(([name, args]) => name === "fr.updateOne" && args[1].$unset?.payoutLockedAt)).toBe(true);
  });

  it("uses the reviewed amount and rejects a mismatching caller amount", async () => {
    const res = await call({ amount: 999999 });
    expect(res.statusCode).toBe(409);
    expect(mockStripe.transfers.create).not.toHaveBeenCalled();
  });

  it("reserves the balance before creating the Stripe transfer", async () => {
    const res = await call({ amount: 250 });
    expect(res.statusCode).toBe(200);
    const order = calls.map(([name]) => name);
    expect(order.indexOf("campaign.updateOne")).toBeLessThan(order.indexOf("stripe.transfer"));
    expect(mockStripe.transfers.create.mock.calls[0][0].amount).toBe(25000);
  });

  it("does not move money when the balance reservation fails", async () => {
    state.reserveOk = false;
    const res = await call();
    expect(res.statusCode).toBe(422);
    expect(mockStripe.transfers.create).not.toHaveBeenCalled();
  });

  it("refunds the reservation if the transfer fails", async () => {
    state.transferFails = true;
    const res = await call();
    expect(res.statusCode).toBe(500);
    const incs = calls
      .filter(([name]) => name === "campaign.updateOne")
      .map(([, update]) => update.$inc["funding.availableBalance"]);
    expect(incs).toEqual([-250, 250]);
  });

  it("still reports success when a donor email fails after the payout", async () => {
    state.mailFails = true;
    const res = await call();
    expect(res.statusCode).toBe(200);
    expect(state.claimed.save).toHaveBeenCalled();
  });

  it("accepts the web app's 'third-party' funding type without a Connect account", async () => {
    state.campaign.stripeConnect = {};
    state.claimed = makeRequestDoc({ fundingType: "third-party" });
    const res = await call();
    expect(res.statusCode).toBe(200);
    expect(mockStripe.transfers.create).not.toHaveBeenCalled();
  });

  it("refuses organizer payouts without a Connect account", async () => {
    state.campaign.stripeConnect = {};
    const res = await call();
    expect(res.statusCode).toBe(422);
  });
});

describe("fundingType helpers", () => {
  const { normalizeFundingType, isThirdParty } = require("../../utility/fundingType");
  it.each(["third-party", "thirdParty", "Third Party", "third_party"])("treats %s as third-party", (v) => {
    expect(isThirdParty(v)).toBe(true);
    expect(normalizeFundingType(v)).toBe("third-party");
  });
  it("leaves other values alone", () => {
    expect(isThirdParty("personal")).toBe(false);
    expect(normalizeFundingType("personal")).toBe("personal");
  });
});

describe("revealSensitive", () => {
  const { encrypt, revealSensitive } = require("../../utility/encryption");
  it("decrypts v2 ciphertext", () => {
    expect(revealSensitive(encrypt("12345678"))).toBe("12345678");
  });
  it("returns legacy plaintext as-is instead of throwing", () => {
    expect(revealSensitive("12345678")).toBe("12345678");
    expect(revealSensitive("Barclays")).toBe("Barclays");
  });
});


describe("bank payout rails", () => {
  it("pays an NGN organiser by bank transfer when there is no Stripe Connect account", async () => {
    mockRails.rail = "flutterwave";
    state.campaign.stripeConnect = {};
    state.campaign.funding.currency = "NGN";
    const res = await call({ bankCode: "044", accountNumber: "0690000040", accountName: "Kofi" });
    expect(res.statusCode).toBe(200);
    expect(mockStripe.transfers.create).not.toHaveBeenCalled();
    expect(mockRails.sent[0]).toMatchObject({ amount: 250, currency: "NGN", bankCode: "044", accountNumber: "0690000040" });
    expect(state.claimed.disbursement).toMatchObject({ provider: "flutterwave", providerStatus: "pending", providerReference: "ft-payout-x-1" });
    expect(mockLedger[0]).toMatchObject({ type: "payout", amount: 250, currency: "NGN" });
  });

  it("releases the escrow if the provider rejects the transfer outright", async () => {
    mockRails.rail = "paystack";
    mockRails.result = { ...mockRails.result, provider: "paystack", status: "failed" };
    state.campaign.stripeConnect = {};
    const res = await call({ bankCode: "058", accountNumber: "0001234567" });
    expect(res.statusCode).toBe(502);
    const incs = calls.filter(([n]) => n === "campaign.updateOne").map(([, u]) => u.$inc["funding.availableBalance"]);
    expect(incs).toEqual([-250, 250]);
    expect(mockLedger).toHaveLength(0);
  });

  it("refuses organiser payouts with neither Connect nor bank details", async () => {
    state.campaign.stripeConnect = {};
    const res = await call({});
    expect(res.statusCode).toBe(422);
  });
});

describe("applyTransferOutcome (provider webhook)", () => {
  const { applyTransferOutcome } = require("../../controller/donations/payout");

  it("returns a failed bank transfer to escrow, records a reversal and re-opens the request", async () => {
    mockFundingRequests.findOneAndUpdate.mockResolvedValueOnce({
      _id: REQ_ID,
      campaignId: CAMPAIGN_ID,
      disbursement: { amount: 250, currency: "NGN" },
    });
    const result = await applyTransferOutcome({ reference: "ft-payout-x-1", status: "FAILED" });
    expect(result).toMatchObject({ applied: true, outcome: "failed" });
    expect(calls.find(([n]) => n === "campaign.updateOne")[1]).toEqual({ $inc: { "funding.availableBalance": 250 } });
    expect(mockLedger[0]).toMatchObject({ type: "payout_reversal", amount: 250, refId: "reversal:ft-payout-x-1" });
    const reopen = mockFundingRequests.updateOne.mock.calls.find(([, u]) => u.$set?.status === "Pending");
    expect(reopen).toBeTruthy();
  });

  it("is a no-op for a repeated failure webhook", async () => {
    mockFundingRequests.findOneAndUpdate.mockResolvedValueOnce(null);
    const result = await applyTransferOutcome({ reference: "ft-payout-x-1", status: "failed" });
    expect(result.applied).toBe(false);
    expect(mockLedger).toHaveLength(0);
  });

  it("marks a successful transfer settled", async () => {
    const result = await applyTransferOutcome({ reference: "ft-payout-x-1", status: "SUCCESSFUL" });
    expect(result.outcome).toBe("successful");
  });
});

// ── Verified vendor network: payouts locked to the vendor's account ───────
const mockVendor = { dest: null };
jest.mock("../../controller/vendors", () => ({ vendorPayoutDestination: jest.fn(async () => mockVendor.dest) }));

describe("vendor-backed funding requests", () => {
  const VENDOR = { bankCode: "058", bankName: "GTBank", accountNumber: "0123456789", accountName: "Medserve Nigeria Ltd", currency: "NGN" };
  beforeEach(() => {
    state.claimed = makeRequestDoc({ fundingType: "third-party", vendorDisbursement: { vendorId: "60f7117f2ee78d31b4de0ccc" } });
    state.campaign.funding.currency = "NGN";
    mockRails.rail = "flutterwave";
    mockVendor.dest = { ...VENDOR };
  });

  it("pays the vendor's verified account, never the organiser's Stripe account", async () => {
    const res = await call({ currency: "NGN" });
    expect(res.statusCode).toBe(200);
    expect(mockRails.sent[0]).toMatchObject({ bankCode: "058", accountNumber: "0123456789", accountName: "Medserve Nigeria Ltd" });
    expect(calls.find(([n]) => n === "stripe.transfer")).toBeUndefined();
  });

  it("refuses a different account supplied at payout time", async () => {
    const res = await call({ currency: "NGN", bankCode: "044", accountNumber: "9999999999" });
    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe("vendor_account_locked");
    expect(mockRails.sent).toHaveLength(0);
    expect(calls.filter(([n]) => n === "campaign.updateOne")).toHaveLength(0);
  });

  it("refuses when the vendor is no longer verified", async () => {
    mockVendor.dest = { error: "The vendor for this request isn't verified (or was suspended), so it can't be paid." };
    const res = await call({ currency: "NGN" });
    expect(res.statusCode).toBe(422);
    expect(res.body.code).toBe("vendor_not_payable");
    expect(mockRails.sent).toHaveLength(0);
  });
});

describe("two-person rule backstop in the payout handler", () => {
  beforeEach(() => (process.env.PAYOUT_SECOND_APPROVAL_JSON = JSON.stringify({ GBP: 100 })));
  afterEach(() => delete process.env.PAYOUT_SECOND_APPROVAL_JSON);

  it("refuses a large payout approved by only one admin", async () => {
    state.claimed = makeRequestDoc({ adminId: "a1" });
    const res = await call({});
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe("second_approval_missing");
    expect(calls.find(([n]) => n === "stripe.transfer")).toBeUndefined();
  });
  it("pays when two different admins approved", async () => {
    state.claimed = makeRequestDoc({ adminId: "a2", firstApproval: { adminId: "a1" } });
    const res = await call({});
    expect(res.statusCode).toBe(200);
  });
});
