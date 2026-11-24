process.env.TOKEN_SECRET = process.env.TOKEN_SECRET || "risk-test-secret";
process.env.SECURITY_KEY = process.env.SECURITY_KEY || "c".repeat(64);
process.env.INIT_VECTOR = process.env.INIT_VECTOR || "d".repeat(32);
const { scoreOrganiser, accountHash, createdAtOf } = require("../../services/organiserRisk");
const { toPublicCampaign, CAMPAIGN_PUBLIC_PROJECTION } = require("../../utility/publicViews");
const { encrypt } = require("../../utility/encryption");

const now = new Date("2026-11-24T12:00:00Z");
const days = (n) => new Date(now - n * 864e5);
const clean = { accountCreatedAt: days(400), identityStatus: "verified", emailVerified: true, sharedAccountOrganisers: 0, priorSuspensions: 0, recentLaunches: 1, largeGoal: false, storyLength: 1200, hasMedia: true };

describe("organiser risk score", () => {
  it("scores an established, verified organiser low", () => {
    expect(scoreOrganiser(clean, now)).toEqual({ score: 0, level: "low", reasons: [] });
  });

  it("scores the account-takeover / mule pattern high, with reasons a reviewer can act on", () => {
    const r = scoreOrganiser({ ...clean, accountCreatedAt: days(1), identityStatus: "unverified", sharedAccountOrganisers: 2, largeGoal: true }, now);
    expect(r.level).toBe("high");
    expect(r.reasons).toEqual(expect.arrayContaining(["Account less than 3 days old", "Identity unverified", "Payout account also used by 2 other organiser(s)", "Large goal for a new account"]));
  });

  it("adds a capped external (SentinelNG) score", () => {
    expect(scoreOrganiser({ ...clean, external: { score: 35, reason: "device seen on 4 accounts" } }, now)).toMatchObject({ score: 35, level: "medium" });
  });

  it("hashes payout accounts consistently whether stored encrypted or typed, ignoring spaces", () => {
    const h = accountHash("058", "0123 456 789");
    expect(h).toMatch(/^[0-9a-f]{32}$/);
    expect(accountHash("058", encrypt("0123456789"))).toBe(h);
    expect(accountHash("044", "0123456789")).not.toBe(h);
    expect(accountHash("058", "")).toBe("");
  });

  it("reads a user's join date from the ObjectId when there's no createdAt", () => {
    expect(createdAtOf({ _id: "65a000000000000000000001" }).toISOString()).toBe("2024-01-11T14:49:36.000Z");
  });

  it("never serves the risk score or account hash publicly", () => {
    expect(CAMPAIGN_PUBLIC_PROJECTION).toMatchObject({ riskAssessment: 0, "funding.accountHash": 0 });
    const pub = toPublicCampaign({ _id: "c", riskAssessment: { score: 80 }, funding: { accountHash: "abc", amountRaised: 5 } });
    expect(pub.riskAssessment).toBeUndefined();
    expect(pub.funding).toEqual({ amountRaised: 5 });
  });
});
