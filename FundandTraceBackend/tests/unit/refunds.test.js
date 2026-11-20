// Refund pipeline: claim -> guarded escrow reservation -> gateway -> ledger,
// releasing everything on failure. Models, Stripe and the ledger are mocked.
process.env.STRIPESECRET = "sk_test_unit";

const state = {};
const mockCalls = [];
const mockStripe = {
  refunds: {
    create: jest.fn(async (params, opts) => {
      mockCalls.push(["stripe", params, opts]);
      if (state.gatewayFails) throw new Error("card_declined");
      return { id: "re_1", status: "succeeded" };
    }),
  },
};
jest.mock("stripe", () => () => mockStripe);
jest.mock("../../services/ledger", () => ({ appendEntry: jest.fn(async (e) => mockCalls.push(["ledger", e])) }));
jest.mock("../../models/donationsModel", () => ({
  Donations: {
    findOneAndUpdate: jest.fn(async () => state.claimed),
    exists: jest.fn(async () => state.exists),
    updateOne: jest.fn(async (filter, update) => mockCalls.push(["donation", update])),
    find: jest.fn(() => ({ select: async () => state.eligible || [] })),
  },
}));
jest.mock("../../models/campaignModel", () => ({
  Campaign: {
    findById: jest.fn(() => ({ select: async () => state.campaign })),
    updateOne: jest.fn(async (filter, update) => {
      mockCalls.push(["campaign", filter, update]);
      const dec = update.$inc && update.$inc["funding.availableBalance"] < 0;
      return { modifiedCount: dec && state.escrowShort ? 0 : 1 };
    }),
  },
}));

const { refundDonation, proRataRefundCampaign } = require("../../services/refunds");

const donation = (o = {}) => ({ _id: "d1", campaignId: "c1", amount: 40, tip: 2, paymentMethod: "Stripe", paymentId: "pi_1", ...o });

beforeEach(() => {
  mockCalls.length = 0;
  jest.clearAllMocks();
  Object.assign(state, {
    claimed: donation(),
    exists: true,
    gatewayFails: false,
    escrowShort: false,
    campaign: { funding: { currency: "GBP", availableBalance: 100 } },
    eligible: [],
  });
});

describe("refundDonation", () => {
  it("reserves escrow, refunds via Stripe with an idempotency key, and writes the ledger", async () => {
    const r = await refundDonation({ donationId: "d1", requestedBy: "admin", includeTip: true });
    expect(r).toMatchObject({ amount: 42, escrowAmount: 40, status: "succeeded" });
    const [, params, opts] = mockCalls.find(([k]) => k === "stripe");
    expect(params).toEqual({ payment_intent: "pi_1", amount: 4200 });
    expect(opts).toEqual({ idempotencyKey: "refund-d1" });
    const reserve = mockCalls.find(([k]) => k === "campaign");
    expect(reserve[1]).toMatchObject({ "funding.availableBalance": { $gte: 40 } });
    expect(mockCalls.find(([k]) => k === "ledger")[1]).toMatchObject({ type: "refund", amount: 40, refId: "refund:d1" });
  });

  it("refuses a second refund of the same donation (409)", async () => {
    state.claimed = null;
    await expect(refundDonation({ donationId: "d1", requestedBy: "donor" })).rejects.toMatchObject({ status: 409 });
    expect(mockStripe.refunds.create).not.toHaveBeenCalled();
  });

  it("never refunds money that was already paid out", async () => {
    state.escrowShort = true;
    await expect(refundDonation({ donationId: "d1", requestedBy: "donor" })).rejects.toMatchObject({ code: "insufficient_escrow" });
    expect(mockStripe.refunds.create).not.toHaveBeenCalled();
  });

  it("releases the reservation and marks failed when the gateway rejects", async () => {
    state.gatewayFails = true;
    await expect(refundDonation({ donationId: "d1", requestedBy: "admin" })).rejects.toMatchObject({ status: 502 });
    const incs = mockCalls.filter(([k]) => k === "campaign").map(([, , u]) => u.$inc["funding.availableBalance"]);
    expect(incs).toEqual([-40, 40]);
    expect(mockCalls.some(([k, u]) => k === "donation" && u.$set?.["refund.status"] === "failed")).toBe(true);
  });
});

describe("proRataRefundCampaign", () => {
  it("splits the remaining escrow pro-rata and never exceeds it", async () => {
    state.campaign = { funding: { currency: "GBP", availableBalance: 50 } };
    state.eligible = [donation({ _id: "a", amount: 60 }), donation({ _id: "b", amount: 40 })];
    // each refundDonation call claims the donation it is given
    const { Donations } = require("../../models/donationsModel");
    Donations.findOneAndUpdate.mockImplementation(async (filter) => state.eligible.find((d) => d._id === filter._id));
    const summary = await proRataRefundCampaign("c1", { requestedBy: "dispute" });
    expect(summary.ratio).toBe(0.5);
    expect(summary.refunded.map((r) => r.escrowAmount)).toEqual([30, 20]);
    expect(summary.totalRefunded).toBe(50);
  });
});
