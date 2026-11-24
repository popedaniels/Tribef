process.env.SECURITY_KEY = process.env.SECURITY_KEY || "e".repeat(64);
jest.mock("../../services/refunds", () => ({
  refundDonation: jest.fn(),
  RefundError: class extends Error {},
  gatewayOf: (d) => (String(d.paymentMethod).toLowerCase().startsWith("stripe") ? "stripe" : "unknown"),
}));
const { checkEligibility } = require("../../controller/donations/selfRefund");

const now = new Date("2026-11-20T00:00:00Z");
const donation = (o = {}) => ({ donorEmail: "Dami@x.com", amount: 20, paymentMethod: "Stripe", createdAt: new Date("2026-11-10"), refund: { status: "" }, ...o });
const campaign = (o = {}) => ({ funding: { availableBalance: 100 }, disputeGovernance: {}, ...o });

describe("self-service refund eligibility", () => {
  it("allows the donor within 30 days when funds are still in escrow", () => {
    expect(checkEligibility({ donation: donation(), campaign: campaign(), authEmail: "dami@x.com", now })).toBeNull();
  });
  it.each([
    ["someone else's donation", { authEmail: "other@x.com" }, "not_owner"],
    ["an already refunded donation", { donation: donation({ refund: { status: "succeeded" } }) }, "already_refunded"],
    ["after the window", { donation: donation({ createdAt: new Date("2026-09-01") }) }, "window_closed"],
    ["a frozen campaign", { campaign: campaign({ disputeGovernance: { isLocked: true } }) }, "campaign_frozen"],
    ["money already paid out", { campaign: campaign({ funding: { availableBalance: 5 } }) }, "insufficient_escrow"],
    ["an unsupported payment method", { donation: donation({ paymentMethod: "cash" }) }, "not_refundable"],
  ])("refuses %s", (_label, override, code) => {
    const args = { donation: donation(), campaign: campaign(), authEmail: "dami@x.com", now, ...override };
    expect(checkEligibility(args)).toMatchObject({ code });
  });
});
