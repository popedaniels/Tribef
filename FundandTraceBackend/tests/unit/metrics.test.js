jest.mock("../../models/donationsModel", () => ({ Donations: {} }));
jest.mock("../../models/campaignModel", () => ({ Campaign: {} }));
jest.mock("../../models/fundingRequestModel", () => ({ FundingRequests: {} }));
const { summariseDonations } = require("../../services/metrics");
const fees = require("../../services/fees");

describe("margin per donation", () => {
  it("costs a passed-on Paystack fee at ~0 margin and counts the tip as margin", () => {
    const fee = fees.grossUp(10000, fees.ruleFor({ rail: "paystack", currency: "NGN" }));
    const out = summariseDonations(
      [
        { amount: 10000, tip: 0, processingFee: fee, paymentMethod: "paystack", donorEmail: "a@x.co", createdAt: "2026-11-01" },
        { amount: 10000, tip: 500, processingFee: fees.grossUp(10500, fees.ruleFor({ rail: "paystack", currency: "NGN" })), paymentMethod: "paystack", donorEmail: "A@x.co", createdAt: "2026-11-02" },
      ],
      () => "NGN"
    );
    const g = out.byRail[0];
    expect(out.uniqueDonors).toBe(1);
    expect(g.tipRate).toBe(50);
    expect(g.margin).toBeGreaterThanOrEqual(500 - 0.05);
    expect(g.margin).toBeLessThanOrEqual(500 + 0.05);
    expect(out.daily).toEqual([{ date: "2026-11-01", count: 1 }, { date: "2026-11-02", count: 1 }]);
  });
  it("shows a negative margin when a UK card fee is absorbed", () => {
    const out = summariseDonations([{ amount: 50, tip: 0, processingFee: 0, paymentMethod: "Stripe", createdAt: "2026-11-01" }], () => "GBP");
    expect(out.byRail[0].processorCost).toBe(0.95); // 1.5% + 20p
    expect(out.byRail[0].marginPerDonation).toBe(-0.95);
  });
  it("applies the Paystack NGN cap and small-charge waiver", () => {
    expect(fees.processorCost({ rail: "paystack", currency: "NGN", total: 2000 })).toBe(30);
    expect(fees.processorCost({ rail: "paystack", currency: "NGN", total: 1000000 })).toBe(2000);
  });
});
