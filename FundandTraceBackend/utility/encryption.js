const crypto = require("crypto");

const KEY = Buffer.from(process.env.SECURITY_KEY, "hex");
if (KEY.length !== 32) {
  throw new Error("SECURITY_KEY must be 32 bytes hex (64 hex characters)");
}

// Legacy static-IV CBC parameters (pre-v2 data). Only needed to decrypt
// records written before the randomized-IV scheme; new writes never use it.
const LEGACY_ALGORITHM = "aes-256-cbc";

const VERSION_PREFIX = "v2:";

exports.encrypt = (message) => {
  // Random IV per record: identical plaintexts produce different ciphertexts.
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(message), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${VERSION_PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
};

const decryptV2 = (data) => {
  const parts = data.slice(VERSION_PREFIX.length).split(":");
  if (parts.length !== 3) {
    throw new Error("Malformed v2 ciphertext");
  }
  const [ivHex, tagHex, payloadHex] = parts;
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    KEY,
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(payloadHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
};

const decryptLegacy = (encryptedData) => {
  const initVector = process.env.INIT_VECTOR
    ? Buffer.from(process.env.INIT_VECTOR, "hex")
    : null;
  if (!initVector || initVector.length !== 16) {
    throw new Error(
      "INIT_VECTOR (16 bytes hex) is required to decrypt legacy records"
    );
  }
  const decipher = crypto.createDecipheriv(
    LEGACY_ALGORITHM,
    KEY,
    initVector
  );
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

exports.decrypt = (encryptedData) => {
  if (
    typeof encryptedData === "string" &&
    encryptedData.startsWith(VERSION_PREFIX)
  ) {
    return decryptV2(encryptedData);
  }
  return decryptLegacy(encryptedData);
};

exports.isLegacyCiphertext = (value) =>
  typeof value === "string" &&
  value.length > 0 &&
  !value.startsWith(VERSION_PREFIX) &&
  /^[0-9a-fA-F]+$/.test(value);
