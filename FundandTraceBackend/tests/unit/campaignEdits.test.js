process.env.SECURITY_KEY = process.env.SECURITY_KEY || "d".repeat(64);
const { buildOrganizerUpdate } = require("../../utility/campaignEdits");

describe("buildOrganizerUpdate (organiser mass-assignment guard)", () => {
  const existing = { launched: true, funding: { amountRaised: 500, currency: "GBP" } };

  it("drops every server-owned field", () => {
    const { set } = buildOrganizerUpdate(
      {
        suspended: false,
        launched: true,
        organizerId: "attacker",
        disputeGovernance: { isLocked: false },
        stripeConnect: { accountId: "acct_attacker" },
        funding: { availableBalance: 1e9, amountRaised: 1e9, refunded: false },
        basicInformation: { campaignTitle: "Roof" },
      },
      existing
    );
    expect(Object.keys(set)).toEqual(["basicInformation"]);
  });

  it("encrypts payout details and keeps already-encrypted values", () => {
    const { set } = buildOrganizerUpdate({ funding: { accountNumber: "12345678", bankName: "v2:abc", bankCode: "044" } }, existing);
    expect(set["funding.accountNumber"]).toMatch(/^v2:/);
    expect(set["funding.bankName"]).toBe("v2:abc");
    expect(set["funding.bankCode"]).toBe("044");
  });

  it("refuses a currency change after donations arrived", () => {
    const { set, errors } = buildOrganizerUpdate({ funding: { currency: "USD" } }, existing);
    expect(set["funding.currency"]).toBeUndefined();
    expect(errors[0]).toMatch(/currency/);
  });

  it("rejects a negative goal", () => {
    expect(buildOrganizerUpdate({ funding: { amountExpected: -5 } }, existing).errors).toHaveLength(1);
  });
});
