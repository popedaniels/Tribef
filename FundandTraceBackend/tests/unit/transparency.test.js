const { computeTransparencyScore } = require("../../services/transparency");

const now = new Date("2026-11-20T12:00:00Z");
const daysAgo = (n) => new Date(now.getTime() - n * 86400000);

describe("computeTransparencyScore", () => {
  it("scores a model campaign as Excellent", () => {
    const r = computeTransparencyScore({
      now,
      campaign: { createdAt: daysAgo(60), updates: [{ datePosted: daysAgo(3) }], disputeGovernance: {} },
      organizer: { identityVerification: { status: "verified" } },
      fundingRequests: [
        { _id: "a", status: "Approved", fundingType: "third-party", amount: 500, disbursement: { dateDisbursed: daysAgo(20), receipt: "https://res.cloudinary.com/x.pdf", amount: 500 } },
      ],
    });
    expect(r.score).toBe(100);
    expect(r.grade).toBe("Excellent");
    expect(r.factors).toHaveLength(6);
  });

  it("penalises missing KYC, overdue proof, a freeze and silence", () => {
    const r = computeTransparencyScore({
      now,
      campaign: { createdAt: daysAgo(200), updates: [], disputeGovernance: { isLocked: true } },
      organizer: { identityVerification: { status: "unverified" } },
      fundingRequests: [
        { _id: "b", status: "Approved", fundingType: "", amount: 300, disbursement: { dateDisbursed: daysAgo(30), amount: 300 } },
      ],
    });
    expect(r.score).toBe(0);
    expect(r.grade).toBe("Needs attention");
    expect(r.proofOverdue).toEqual(["b"]);
  });

  it("ignores failed bank transfers when judging proof", () => {
    const r = computeTransparencyScore({
      now,
      campaign: { createdAt: daysAgo(5), disputeGovernance: {} },
      organizer: null,
      fundingRequests: [{ _id: "c", status: "Approved", disbursement: { dateDisbursed: daysAgo(40), providerStatus: "failed" } }],
    });
    expect(r.proofOverdue).toEqual([]);
  });
});
