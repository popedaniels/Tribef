// Fraud scoring — pure functions + threshold behavior.
process.env.NODE_ENV = "test";
const { geoMismatchScore, FLAG_THRESHOLD } = require("../../utility/fraud");

describe("Fraud — geo mismatch", () => {
  it("scores zero when countries match", () => {
    expect(geoMismatchScore("GB", "GB")).toEqual({ score: 0, reason: null });
    expect(geoMismatchScore("gb", "GB")).toEqual({ score: 0, reason: null });
  });

  it("scores zero when either side is unknown (no false positives)", () => {
    expect(geoMismatchScore("", "US").score).toBe(0);
    expect(geoMismatchScore("NG", undefined).score).toBe(0);
  });

  it("flags a real mismatch with a reason code", () => {
    const result = geoMismatchScore("NG", "US");
    expect(result.score).toBeGreaterThan(0);
    expect(result.reason).toBe("geo_mismatch:NGvsUS");
  });
});

describe("Fraud — flag threshold", () => {
  it("is configurable but sane by default", () => {
    // With no env override the default must be 50.
    if (!process.env.FRAUD_FLAG_THRESHOLD) {
      expect(FLAG_THRESHOLD).toBe(50);
    } else {
      expect(FLAG_THRESHOLD).toBe(Number(process.env.FRAUD_FLAG_THRESHOLD));
    }
  });
});
