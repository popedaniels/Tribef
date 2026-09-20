const crypto = require("crypto");

// Set valid AES-256 key (32 bytes = 64 hex chars) and a legacy IV before
// requiring the encryption module, since it reads env at load time.
process.env.SECURITY_KEY = crypto.randomBytes(32).toString("hex");
process.env.INIT_VECTOR = crypto.randomBytes(16).toString("hex");

const { encrypt, decrypt, isLegacyCiphertext } = require("../../utility/encryption");

describe("Encryption Utility (AES-256-GCM, randomized IV)", () => {
  it("should produce versioned ciphertext that is not hex-only", () => {
    const ciphertext = encrypt("sensitive-account-number");
    expect(typeof ciphertext).toBe("string");
    expect(ciphertext).not.toBe("sensitive-account-number");
    expect(ciphertext).toMatch(/^v2:[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);
  });

  it("should decrypt back to the original plaintext", () => {
    const original = "0123456789";
    expect(decrypt(encrypt(original))).toBe(original);
  });

  it("should round-trip arbitrary strings with special characters", () => {
    const original = "Bank Name — Sort Code 12-34-56";
    expect(decrypt(encrypt(original))).toBe(original);
  });

  it("should randomize IVs so identical plaintexts yield different ciphertexts", () => {
    const a = encrypt("same-value");
    const b = encrypt("same-value");
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe("same-value");
    expect(decrypt(b)).toBe("same-value");
  });

  it("should reject tampered v2 ciphertext (auth tag mismatch)", () => {
    const ciphertext = encrypt("tamper-check");
    const parts = ciphertext.split(":");
    parts[3] = parts[3].replace(/^.{2}/, "ff");
    expect(() => decrypt(parts.join(":"))).toThrow();
  });

  it("should reject malformed v2 payloads", () => {
    expect(() => decrypt("v2:deadbeef:cafe:badd")).toThrow();
  });

  it("should still decrypt legacy static-IV CBC records", () => {
    // Reconstruct a legacy record exactly as the pre-v2 module produced them.
    const legacy = require("crypto");
    const iv = Buffer.from(process.env.INIT_VECTOR, "hex");
    const key = Buffer.from(process.env.SECURITY_KEY, "hex");
    const cipher = legacy.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update("legacy-account", "utf8", "hex");
    encrypted += cipher.final("hex");

    expect(isLegacyCiphertext(encrypted)).toBe(true);
    expect(isLegacyCiphertext(encrypt("modern"))).toBe(false);
    expect(decrypt(encrypted)).toBe("legacy-account");
  });
});
