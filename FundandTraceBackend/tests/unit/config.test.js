// Config validator — placeholder detection, required-var enforcement
process.env.NODE_ENV = "development";

const { validate } = require("../../utility/config");

describe("Config Validation Utility", () => {
  it("should report missing core required vars", () => {
    // Save original, then unset to simulate missing vars
    const original = { MONGOURL: process.env.MONGOURL, TOKEN_SECRET: process.env.TOKEN_SECRET };
    delete process.env.MONGOURL;
    delete process.env.TOKEN_SECRET;

    const result = validate();
    expect(result.ok).toBe(false);
    expect(result.missing).toContain("MONGOURL");
    expect(result.missing).toContain("TOKEN_SECRET");

    // Restore
    Object.assign(process.env, original);
  });

  it("should flag placeholder secret values as weak", () => {
    const original = process.env.TOKEN_SECRET;
    process.env.MONGOURL = "mongodb://user:password@host/db";
    process.env.TOKEN_SECRET = "replace_me_with_a_secret";

    const result = validate();
    expect(result.weak.some((w) => w.includes("placeholder"))).toBe(true);

    process.env.TOKEN_SECRET = original;
  });

  it("should flag short TOKEN_SECRET as weak", () => {
    const original = process.env.TOKEN_SECRET;
    process.env.MONGOURL = "mongodb://host/db";
    process.env.TOKEN_SECRET = "short";

    const result = validate();
    expect(result.weak.some((w) => w.includes("at least 32"))).toBe(true);

    process.env.TOKEN_SECRET = original;
  });

  it("should validate SECURITY_KEY must be 64 hex characters", () => {
    const original = process.env.SECURITY_KEY;
    process.env.SECURITY_KEY = "not-hex";

    const result = validate();
    expect(result.weak.some((w) => w.includes("32 bytes hex"))).toBe(true);

    process.env.SECURITY_KEY = original;
  });
});
