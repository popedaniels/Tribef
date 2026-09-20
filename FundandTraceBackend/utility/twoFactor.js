// TOTP (RFC 6238) two-factor helpers built on otplib v13.
// Secrets are encrypted at rest via utility/encryption.
// NOTE: otplib v13 verification is asynchronous.
const { encrypt } = require("./encryption");
const { generateSecret, generateURI, verify } = require("otplib");

const ISSUER = "Fund&Trace";

function otpauthUrl(secret, email) {
  return generateURI({
    issuer: ISSUER,
    label: String(email || ""),
    secret,
  });
}

async function verifyTotp(secret, token) {
  if (!secret || !token) return false;
  try {
    // otplib v13 returns { valid: boolean }.
    const result = await verify({ secret, token: String(token).trim() });
    return Boolean(result && result.valid);
  } catch {
    return false;
  }
}

// Short-lived JWT marking a half-authenticated login that must be completed
// with a valid TOTP code. Distinct payload key ensures it can never be
// exchanged as a session token by requireAuth.
const CHALLENGE_TTL_SECONDS = 5 * 60;

function challengePayload(userId, scope) {
  return { twoFactorChallenge: true, userId: String(userId), scope };
}

function isChallengePayload(decoded) {
  return Boolean(decoded && decoded.twoFactorChallenge && decoded.userId && decoded.scope);
}

module.exports = {
  generateSecret,
  otpauthUrl,
  verifyTotp,
  encryptSecret: encrypt,
  challengePayload,
  isChallengePayload,
  CHALLENGE_TTL_SECONDS,
};
