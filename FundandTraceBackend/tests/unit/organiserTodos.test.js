const { organiserTodos } = require("../../services/organiserTodos");

const DAY = 864e5;
const now = new Date("2026-11-22T12:00:00Z");
const campaign = (o = {}) => ({
  _id: "c1",
  launched: true,
  createdAt: new Date(now - 60 * DAY),
  basicInformation: { campaignTitle: "Theatre equipment" },
  funding: { amountRaised: 5000, bankCode: "058", accountNumber: "0123456789" },
  updates: [{ datePosted: new Date(now - 5 * DAY) }],
  disputeGovernance: {},
  ...o,
});
const ids = (t) => t.map((x) => x.id);

describe("organiserTodos", () => {
  it("is empty for a verified organiser with nothing outstanding", () => {
    expect(organiserTodos({ user: { identityVerification: { status: "verified" } }, campaigns: [campaign()], now })).toEqual([]);
  });

  it("asks for KYC only once money has been raised", () => {
    const user = { identityVerification: { status: "unverified" } };
    expect(ids(organiserTodos({ user, campaigns: [campaign()], now }))).toContain("kyc");
    expect(ids(organiserTodos({ user, campaigns: [campaign({ funding: { amountRaised: 0 } })], now }))).not.toContain("kyc");
  });

  it("puts overdue receipts and frozen campaigns first", () => {
    const user = { identityVerification: { status: "verified" } };
    const todos = organiserTodos({
      user,
      campaigns: [campaign({ disputeGovernance: { isLocked: true }, updates: [] })],
      fundingRequests: [
        { _id: "f1", campaignId: "c1", status: "Approved", amount: 100, currency: "NGN", disbursement: { dateDisbursed: new Date(now - 20 * DAY) } },
        { _id: "f2", campaignId: "c1", status: "Approved", amount: 50, currency: "NGN", disbursement: { dateDisbursed: new Date(now - 2 * DAY) } },
      ],
      now,
    });
    expect(todos[0].level).toBe("urgent");
    expect(todos.find((t) => t.id === "receipt-f1")).toMatchObject({ level: "urgent", title: "Receipt overdue by 6 days" });
    expect(todos.find((t) => t.id === "receipt-f2")).toMatchObject({ level: "suggested", title: "Upload a receipt within 12 days" });
    expect(ids(todos)).toEqual(expect.arrayContaining(["frozen-c1", "update-c1"]));
  });

  it("flags missing payout details, failed transfers and recent declines", () => {
    const todos = organiserTodos({
      user: { identityVerification: { status: "verified" } },
      campaigns: [campaign({ funding: { amountRaised: 10 } })],
      fundingRequests: [
        { _id: "f3", campaignId: "c1", status: "Pending", disbursement: { providerStatus: "failed" } },
        { _id: "f4", campaignId: "c1", status: "Declined", declineReason: "Invoice unreadable", createdAt: new Date(now - DAY) },
      ],
      now,
    });
    expect(ids(todos)).toEqual(expect.arrayContaining(["payout-c1", "failed-f3", "declined-f4"]));
    expect(todos.find((t) => t.id === "declined-f4").detail).toBe("Invoice unreadable");
  });

  it("nudges drafts to launch", () => {
    const todos = organiserTodos({ user: {}, campaigns: [campaign({ launched: false, funding: { amountRaised: 0 } })], now });
    expect(ids(todos)).toEqual(["launch-c1"]);
  });
});
