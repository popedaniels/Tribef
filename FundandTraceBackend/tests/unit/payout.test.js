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
