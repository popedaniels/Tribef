// Regression: the Flutterwave redirect credited meta.amount − tip without
// checking what Flutterwave actually collected. Pay ₦100 while claiming
// ₦1,000,000 in meta (possible with the public key) → campaign credited ₦1m.
process.env.FLUTTERWAVE = "flw_test_unit";
process.env.MAINURL = "https://app.test";
const mockState = { verify: null, credited: [] };
jest.mock("axios", () => ({ __esModule: true, default: { get: jest.fn(async () => ({ data: { data: mockState.verify } })), post: jest.fn() } }));
jest.mock("../../utility/fraud", () => ({ getClientIp: () => "", assessDonation: async () => ({ score: 0, reasons: [], ip: "" }), geoMismatchScore: () => 0, withCardSignals: async (s) => s, FLAG_THRESHOLD: 50 }));
jest.mock("../../services/targetReached", () => ({ notifyTargetReachedIfNeeded: jest.fn() }));
jest.mock("../../services/ledger", () => ({ appendEntry: jest.fn() }));
jest.mock("../../services/activityLog", () => ({ addActivity: jest.fn() }));
jest.mock("../../services/donation", () => ({ donationMailService: jest.fn() }));
jest.mock("../../models/fundingRequestModel", () => ({ FundingRequests: {} }));
jest.mock("../../models/donationsModel", () => {
  function Donations(doc) { Object.assign(this, doc); this.save = async () => this; }
  Donations.findOne = jest.fn(async () => null);
  return { Donations };
});
jest.mock("../../models/campaignModel", () => ({
  Campaign: {
    findById: jest.fn(() => ({ select: () => ({ lean: async () => ({ funding: { currency: "NGN" } }) }), then: (r) => r({ _id: "c1" }) })),
    updateOne: jest.fn(async (q, u) => { mockState.credited.push(u.$inc["funding.amountRaised"]); return { acknowledged: true }; }),
  },
}));

const { paymentFlutterwave } = require("../../controller/donations/flutterwave");
const run = async () => {
  const res = { redirect: jest.fn((u) => (res.url = u)) };
  await paymentFlutterwave({ query: { status: "successful", tx_ref: "t1", transaction_id: "99" }, params: { id: "c1" } }, res);
  return res.url;
};
const verify = (over) => ({ status: "successful", currency: "NGN", amount: 1000000, customer: { email: "a@b.co", name: "A" }, meta: { campaignId: "c1", amount: "1000000", tip: "0", fee: "0" }, ...over });

beforeEach(() => (mockState.credited = []));

it("does not credit when the amount paid is less than claimed", async () => {
  mockState.verify = verify({ amount: 100 });
  expect(await run()).toMatch(/status=failed/);
  expect(mockState.credited).toEqual([]);
});

it("does not credit a payment in another currency", async () => {
  mockState.verify = verify({ currency: "USD" });
  expect(await run()).toMatch(/status=failed/);
  expect(mockState.credited).toEqual([]);
});

it("credits the donation (total − tip − fee) when everything matches", async () => {
  mockState.verify = verify({ amount: 10353.81, meta: { campaignId: "c1", amount: "10353.81", tip: "100", fee: "253.81" } });
  expect(await run()).toMatch(/status=successful/);
  expect(mockState.credited).toEqual([10000]);
});
