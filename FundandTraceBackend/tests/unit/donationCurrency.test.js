// Donations must be booked in the campaign's own currency. Escrow balances are
// plain numbers, so crediting a ₦50,000 payment to a GBP campaign would add
// £50,000 of spendable escrow.
const state = { campaign: { funding: { currency: "GBP" } } };
const mockCalls = [];

jest.mock("../../services/ledger", () => ({ appendEntry: jest.fn(async (e) => mockCalls.push(["ledger", e])) }));
jest.mock("../../models/campaignModel", () => ({
  Campaign: {
    findById: jest.fn(() => ({ select: () => ({ lean: async () => state.campaign }) })),
    updateOne: jest.fn(async (filter, update) => {
      mockCalls.push(["credit", filter, update]);
      return { acknowledged: true, modifiedCount: 1 };
    }),
  },
}));
jest.mock("../../models/donationsModel", () => ({ Donations: {} }));
jest.mock("../../models/fundingRequestModel", () => ({ FundingRequests: {} }));
jest.mock("../../services/activityLog", () => ({ addActivity: jest.fn() }));
jest.mock("../../services/donation", () => ({ donationMailService: jest.fn() }));

const { creditCampaign, checkoutCurrency, currencyMismatch } = require("../../controller/donations/shared");

beforeEach(() => {
  mockCalls.length = 0;
  state.campaign = { funding: { currency: "GBP" } };
});

describe("checkoutCurrency", () => {
  it("charges in the campaign currency when the donor doesn't specify one", () => {
    expect(checkoutCurrency({ funding: { currency: "ngn" } }, undefined)).toBe("NGN");
  });
  it("accepts the campaign currency in any case", () => {
    expect(checkoutCurrency({ funding: { currency: "GBP" } }, "gbp")).toBe("GBP");
  });
  it("rejects a different currency", () => {
    expect(checkoutCurrency({ funding: { currency: "GBP" } }, "NGN")).toBeNull();
  });
  it("returns a 400 with a clear code", () => {
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
    currencyMismatch(res, { funding: { currency: "GBP" } });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0]).toMatchObject({ code: "currency_mismatch" });
  });
});

describe("creditCampaign currency guard", () => {
  it("credits and records a ledger entry when currencies match", async () => {
    await creditCampaign("c1", 25, { refId: "stripe:cs_1", currency: "gbp" });
    expect(mockCalls.map((c) => c[0])).toEqual(["credit", "ledger"]);
    expect(mockCalls[1][1]).toMatchObject({ currency: "GBP", amount: 25 });
  });

  it("does NOT credit a payment in another currency", async () => {
    const out = await creditCampaign("c1", 50000, { refId: "paystack:T1", currency: "NGN" });
    expect(out).toMatchObject({ currencyMismatch: true });
    expect(mockCalls).toEqual([]);
  });
});
