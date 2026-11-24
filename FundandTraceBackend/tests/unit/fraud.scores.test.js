// Pure scoring helpers + assessDonation flow in utility/fraud.js (models mocked).
const {
  initAttemptScore,
  geoMismatchScore,
  assessDonation,
  FLAG_THRESHOLD,
} = require("../../utility/fraud");

jest.mock("../../models/donationsModel", () => ({
  Donations: {
    countDocuments: jest.fn(),
    distinct: jest.fn(),
  },
}));
jest.mock("../../models/activityLogModel", () => ({
  ActivityLog: { countDocuments: jest.fn() },
}));

const { Donations } = require("../../models/donationsModel");
const { ActivityLog } = require("../../models/activityLogModel");

describe("fraud scoring helpers", () => {
  describe("initAttemptScore", () => {
    it("scores zero below the init-attempt threshold", () => {
      expect(initAttemptScore(0)).toEqual({ score: 0, reason: null });
      expect(initAttemptScore(7)).toEqual({ score: 0, reason: null });
    });

    it("flags at and above the threshold", () => {
      const at = initAttemptScore(8);
      expect(at.score).toBe(20);
      expect(at.reason).toContain("init_attempts:8");
      expect(initAttemptScore(12).score).toBe(20);
    });

    it("treats non-finite counts as zero signal", () => {
      expect(initAttemptScore(NaN)).toEqual({ score: 0, reason: null });
      expect(initAttemptScore(undefined)).toEqual({ score: 0, reason: null });
    });
  });

  describe("geoMismatchScore", () => {
    it("does not score when either side is unknown", () => {
      expect(geoMismatchScore("", "NG")).toEqual({ score: 0, reason: null });
      expect(geoMismatchScore("NG", "")).toEqual({ score: 0, reason: null });
      expect(geoMismatchScore(null, undefined)).toEqual({ score: 0, reason: null });
    });

    it("does not score when countries match (case/whitespace insensitive)", () => {
      expect(geoMismatchScore("NG", "ng")).toEqual({ score: 0, reason: null });
      expect(geoMismatchScore(" US ", "us")).toEqual({ score: 0, reason: null });
    });

    it("scores a mismatch with a readable reason", () => {
      const result = geoMismatchScore("US", "GB");
      expect(result.score).toBe(25);
      expect(result.reason).toBe("geo_mismatch:USvsGB");
    });
  });

  describe("FLAG_THRESHOLD", () => {
    it("is the documented default of 50", () => {
      expect(FLAG_THRESHOLD).toBe(50);
    });
  });

  describe("assessDonation", () => {
    // Mongoose query builders are chainable (.maxTimeMS().exec()); mocks must
    // mirror that shape or the controller's error paths get exercised instead.
    const resolvesChain = (value) => jest.fn(() => ({ maxTimeMS: async () => value }));
    const rejectsChain = (error) =>
      jest.fn(() => {
        const p = Promise.reject(error);
        p.catch(() => {}); // consume so Node never sees an unhandled rejection
        return { maxTimeMS: () => p };
      });

    beforeEach(() => {
      jest.clearAllMocks();
      Donations.countDocuments = resolvesChain(0);
      Donations.distinct = resolvesChain([]);
      ActivityLog.countDocuments = resolvesChain(0);
    });

    it("returns a clean assessment with no signals", async () => {
      const result = await assessDonation({ email: "a@b.com", campaignId: "c1", ip: "" });
      expect(result.score).toBe(0);
      expect(result.flagged).toBe(false);
    });

    it("flags email velocity above the threshold", async () => {
      Donations.countDocuments = jest.fn((query) =>
        resolvesChain(query.donorEmail ? 10 : 0)()
      );
      const result = await assessDonation({ email: "a@b.com", campaignId: "c1" });
      expect(result.score).toBeGreaterThanOrEqual(40);
      expect(result.reasons.some((r) => r.startsWith("email_velocity"))).toBe(true);
    });

    it("adds the init-attempt signal for card-testing probes", async () => {
      ActivityLog.countDocuments = resolvesChain(9);
      const result = await assessDonation({ email: "a@b.com", campaignId: "c1" });
      expect(result.reasons).toContain("init_attempts:9");
    });

    it("scores campaign hopping across many campaigns", async () => {
      Donations.countDocuments = resolvesChain(0);
      Donations.distinct = jest.fn((field) =>
        resolvesChain(
          field === "campaignId" ? ["c2", "c3", "c4", "c5", "c6"] : []
        )()
      );
      const result = await assessDonation({ email: "a@b.com", campaignId: "c1" });
      expect(result.reasons.some((r) => r.startsWith("campaign_hopping"))).toBe(true);
    });

    it("does not flag hopping when the current campaign is among them", async () => {
      Donations.distinct = resolvesChain(["c1", "c2", "c3", "c4", "c5"]);
      const result = await assessDonation({ email: "a@b.com", campaignId: "c1" });
      expect(result.reasons.some((r) => r.startsWith("campaign_hopping"))).toBe(false);
    });

    it("scores ip velocity for shared-IP card testing", async () => {
      Donations.distinct = resolvesChain([
        "e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10",
      ]);
      const result = await assessDonation({ ip: "1.2.3.4" });
      expect(result.score).toBe(35);
      expect(result.reasons[0]).toContain("ip_velocity:10emails");
    });

    it("never throws — DB failures degrade to unflagged", async () => {
      const dbDown = new Error("db down");
      Donations.countDocuments = rejectsChain(dbDown);
      ActivityLog.countDocuments = rejectsChain(dbDown);
      Donations.distinct = rejectsChain(dbDown);
      const result = await assessDonation({ email: "a@b.com", campaignId: "c1", ip: "1.2.3.4" });
      expect(result.score).toBe(0);
      expect(result.flagged).toBe(false);
    });
  });
});

describe("card signals", () => {
  const { cardFingerprint, cardScore, withCardSignals, getClientIp } = require("../../utility/fraud");

  it("fingerprints a card without keeping card data, per gateway", () => {
    const a = cardFingerprint("paystack", { authorization: { signature: "SIG_abc", bin: "408408", last4: "4081" } });
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(a).not.toContain("4081");
    expect(cardFingerprint("paystack", { authorization: { signature: "SIG_abc" } })).toBe(a);
    expect(cardFingerprint("flutterwave", { card: { first_6digits: "553188", last_4digits: "2950", expiry: "09/32" } })).toMatch(/^[0-9a-f]{32}$/);
    expect(cardFingerprint("paystack", { authorization: {} })).toBe("");
  });

  it("scores one card across many identities and in bursts", () => {
    expect(cardScore({ distinctEmails: 1, recent: 1 }).score).toBe(0);
    expect(cardScore({ distinctEmails: 3, recent: 1 })).toMatchObject({ score: 40, reasons: ["card_shared:3emails"] });
    expect(cardScore({ distinctEmails: 4, recent: 6 }).score).toBe(70);
  });

  it("flags a confirmed payment whose card was used by other donors", async () => {
    Donations.distinct.mockReturnValueOnce({ maxTimeMS: async () => ["x@a.com", "y@a.com"] });
    Donations.countDocuments.mockReturnValueOnce({ maxTimeMS: async () => 2 });
    const out = await withCardSignals({ score: 20, reasons: ["init_attempts:9"], flagged: false }, "paystack", { authorization: { signature: "S1" } }, "z@a.com");
    expect(out).toMatchObject({ score: 60, flagged: true });
    expect(out.reasons).toEqual(["init_attempts:9", "card_shared:3emails"]);
    expect(out.card).toMatch(/^[0-9a-f]{32}$/);
  });

  it("uses the proxy-resolved IP, not a client-supplied X-Forwarded-For", () => {
    expect(getClientIp({ ip: "203.0.113.9", headers: { "x-forwarded-for": "1.2.3.4, 203.0.113.9" } })).toBe("203.0.113.9");
  });
});
