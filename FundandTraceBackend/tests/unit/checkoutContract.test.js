// Every gateway shares one checkout contract: `amount` is the TOTAL the donor
// pays (donation + optional tip) and the campaign is credited `amount - tip`.
// Paystack used to add the tip on top again (overcharging the donor by the tip
// and crediting the tip to the campaign).
process.env.PAYSTACK_SECRET = "sk_test_unit";
process.env.FLUTTERWAVE = "flw_test_unit";

const posted = [];
const mockCampaign = { _id: "c1", funding: { currency: "NGN" }, disputeGovernance: {} };
jest.mock("axios", () => {
  const post = jest.fn(async (url, body) => {
    posted.push([url, body]);
    return { data: { status: true, data: { authorization_url: "https://paystack/pay", link: "https://flw/pay" } } };
  });
  return { __esModule: true, default: { post, get: jest.fn() }, post };
});
jest.mock("../../utility/fraud", () => ({
  getClientIp: () => "1.2.3.4",
  assessDonation: async () => ({ score: 0, reasons: [], ip: "1.2.3.4" }),
  geoMismatchScore: () => 0,
  FLAG_THRESHOLD: 50,
}));
jest.mock("../../services/targetReached", () => ({ notifyTargetReachedIfNeeded: jest.fn() }));
jest.mock("../../services/ledger", () => ({ appendEntry: jest.fn() }));
jest.mock("../../services/activityLog", () => ({ addActivity: jest.fn() }));
jest.mock("../../services/donation", () => ({ donationMailService: jest.fn() }));
jest.mock("../../models/donationsModel", () => ({ Donations: {} }));
jest.mock("../../models/fundingRequestModel", () => ({ FundingRequests: {} }));
jest.mock("../../models/campaignModel", () => ({
  Campaign: {
    findOne: jest.fn(() => {
      const p = Promise.resolve(mockCampaign);
      p.maxTimeMS = () => Promise.resolve(mockCampaign);
      return p;
    }),
  },
}));

const { initializePaystackPayment } = require("../../controller/donations/paystack");
const { initializePayment } = require("../../controller/donations/flutterwave");

const mkRes = () => {
  const res = { statusCode: 200 };
  res.status = jest.fn((c) => ((res.statusCode = c), res));
  res.json = jest.fn((b) => ((res.body = b), res));
  res.send = jest.fn((b) => ((res.body = b), res));
  return res;
};

beforeEach(() => (posted.length = 0));

describe("Paystack checkout", () => {
  const body = (extra = {}) => ({
    amount: 16125,
    currency: "NGN",
    meta: { tip: 1125 },
    customer: { email: "ada@example.com", name: "Ada Obi" },
    ...extra,
  });

  it("charges the total once and records the donation without the tip", async () => {
    const res = mkRes();
    await initializePaystackPayment({ params: { id: "c1" }, body: body(), headers: {} }, res);
    expect(res.statusCode).toBe(200);
    const [, sent] = posted[0];
    expect(sent.amount).toBe(1612500); // ₦16,125.00 in kobo, not ₦17,250
    expect(sent.metadata.amount).toBe("15000");
    expect(sent.metadata.tip).toBe("1125");
  });

  it("rejects a tip that isn't smaller than the total", async () => {
    const res = mkRes();
    await initializePaystackPayment({ params: { id: "c1" }, body: body({ amount: 100, meta: { tip: 100 } }), headers: {} }, res);
    expect(res.statusCode).toBe(400);
    expect(posted).toHaveLength(0);
  });

  it("refuses a currency other than the campaign's", async () => {
    const res = mkRes();
    await initializePaystackPayment({ params: { id: "c1" }, body: body({ currency: "USD" }), headers: {} }, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe("currency_mismatch");
  });
});

describe("Flutterwave checkout", () => {
  const payment = (extra = {}) => ({
    amount: 16125,
    currency: "NGN",
    meta: { campaignId: "c1", tip: 1125, amount: 999999 },
    customer: { email: "ada@example.com", name: "Ada Obi" },
    ...extra,
  });

  it("normalises meta.amount to the total charged", async () => {
    const res = mkRes();
    await initializePayment({ body: { payment: payment() }, headers: {} }, res);
    const [, sent] = posted[0];
    expect(sent.amount).toBe(16125);
    expect(sent.meta.amount).toBe("16125");
    expect(sent.meta.tip).toBe("1125");
  });

  it("refuses a currency other than the campaign's", async () => {
    const res = mkRes();
    await initializePayment({ body: { payment: payment({ currency: "GBP" }) }, headers: {} }, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe("currency_mismatch");
  });
});
