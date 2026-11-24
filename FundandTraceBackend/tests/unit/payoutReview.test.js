const { evaluatePayout } = require("../../services/payoutReview");

const DAY = 864e5;
const now = new Date("2026-11-22T12:00:00Z");
const base = () => ({
  fr: { _id: "fr2", amount: 5000, fundingType: "Self", purposeOfFunding: "Stage 2 materials", proofOfFunding: "https://res.cloudinary.com/x.pdf" },
  campaign: {
    funding: { currency: "NGN", availableBalance: 20000, amountRaised: 30000, bankCode: "058" },
    disputeGovernance: { isLocked: false, disputeCount: 0 },
  },
  organizer: { identityVerification: { status: "verified" }, createdAt: new Date(now - 90 * DAY) },
  history: [],
  donations: { total: 40, flagged: 0 },
  now,
});
const status = (r, id) => r.checks.find((c) => c.id === id)?.status;

beforeAll(() => {
  process.env.PAYSTACK_SECRET = "sk_test_review"; // gives NGN a bank rail
});

describe("evaluatePayout", () => {
  it("is ready when every check passes", () => {
    const r = evaluatePayout(base());
    expect(r.verdict).toBe("ready");
    expect(r.checks.every((c) => c.status === "pass")).toBe(true);
  });

  it("blocks when escrow can't cover the request", () => {
    const x = base();
    x.campaign.funding.availableBalance = 100;
    expect(status(evaluatePayout(x), "escrow")).toBe("fail");
    expect(evaluatePayout(x).verdict).toBe("blocked");
  });

  it("blocks a frozen campaign and warns on reports below the threshold", () => {
    const x = base();
    x.campaign.disputeGovernance = { isLocked: true };
    expect(status(evaluatePayout(x), "frozen")).toBe("fail");
    x.campaign.disputeGovernance = { isLocked: false, disputeCount: 1 };
    expect(status(evaluatePayout(x), "frozen")).toBe("warn");
  });

  it("requires KYC for the organiser but not for direct third-party payments", () => {
    const x = base();
    x.organizer.identityVerification.status = "pending";
    expect(status(evaluatePayout(x), "kyc")).toBe("fail");
    x.fr.fundingType = "Third Party";
    x.fr.thirdPartyBankCode = "044";
    expect(status(evaluatePayout(x), "kyc")).toBe("pass");
  });

  it("blocks when earlier payouts are past the receipt deadline", () => {
    const x = base();
    x.history = [{ _id: "fr1", status: "Approved", amount: 4000, disbursement: { dateDisbursed: new Date(now - 30 * DAY) } }];
    expect(status(evaluatePayout(x), "receipts")).toBe("fail");
    x.history[0].disbursement.receipt = "https://res.cloudinary.com/r.jpg";
    expect(status(evaluatePayout(x), "receipts")).toBe("pass");
  });

  it("flags duplicates, large organiser payouts, new accounts and fraud", () => {
    const x = base();
    x.history = [{ _id: "fr3", status: "Pending", amount: 5000 }];
    x.fr.amount = 16000;
    x.history[0].amount = 16000;
    x.organizer.createdAt = new Date(now - 2 * DAY);
    x.donations = { total: 10, flagged: 3 };
    const r = evaluatePayout(x);
    expect(status(r, "duplicate")).toBe("warn");
    expect(status(r, "size")).toBe("warn");
    expect(status(r, "new-account")).toBe("warn");
    expect(status(r, "fraud")).toBe("fail");
  });

  it("needs an invoice for third-party payments and a route to pay", () => {
    const x = base();
    x.fr.fundingType = "Third Party";
    x.fr.proofOfFunding = "";
    expect(status(evaluatePayout(x), "evidence")).toBe("fail");
    const y = base();
    y.campaign.funding.bankCode = "";
    expect(status(evaluatePayout(y), "rail")).toBe("fail");
    y.campaign.stripeConnect = { accountId: "acct_1", payoutsEnabled: true };
    expect(status(evaluatePayout(y), "rail")).toBe("pass");
  });
});
