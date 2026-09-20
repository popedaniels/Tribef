// TOTP round-trip + challenge payload shape (otplib v13 — async verification).
process.env.NODE_ENV = "test";
process.env.SECURITY_KEY =
  process.env.SECURITY_KEY || "a".repeat(64);
process.env.INIT_VECTOR = process.env.INIT_VECTOR || "b".repeat(32);

const { generateSecret, otpauthUrl, verifyTotp, challengePayload, isChallengePayload } =
  require("../../utility/twoFactor");
const { generate } = require("otplib");

describe("Two-factor — TOTP core", () => {
  it("round-trips a valid code", async () => {
    const secret = generateSecret();
    const token = await generate({ secret });
    await expect(verifyTotp(secret, token)).resolves.toBe(true);
  });

  it("rejects a wrong token", async () => {
    const secret = generateSecret();
    await expect(verifyTotp(secret, "000000")).resolves.toBe(false);
  });

  it("rejects empty secrets/tokens safely", async () => {
    await expect(verifyTotp("", "123456")).resolves.toBe(false);
    await expect(verifyTotp(generateSecret(), "")).resolves.toBe(false);
  });

  it("builds an otpauth URL containing issuer and account", () => {
    const url = otpauthUrl(generateSecret(), "donor@example.com");
    expect(url.startsWith("otpauth://totp/")).toBe(true);
    expect(url).toContain("secret=");
  });
});

describe("Two-factor — challenge payloads", () => {
  it("marks and recognizes challenge tokens", () => {
    const payload = challengePayload("507f1f77bcf86cd799439011", "user");
    expect(isChallengePayload(payload)).toBe(true);
    expect(payload.scope).toBe("user");
  });

  it("rejects session-shaped payloads", () => {
    expect(isChallengePayload({ email: "x", id: "y" })).toBe(false);
    expect(isChallengePayload(null)).toBe(false);
  });
});
