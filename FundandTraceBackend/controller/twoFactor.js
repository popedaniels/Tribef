// Two-factor authentication (TOTP) management and login challenge.
const QRCode = require("qrcode");
const jwt = require("jsonwebtoken");
const { Users } = require("../models/users");
const { addActivity } = require("../services/activityLog");
const logger = require("../utility/logger");
const { decrypt } = require("../utility/encryption");
const {
  generateSecret,
  otpauthUrl,
  verifyTotp,
  encryptSecret,
  challengePayload,
  isChallengePayload,
  CHALLENGE_TTL_SECONDS,
} = require("../utility/twoFactor");
const { safeProfile, safeJwtProfile } = require("../utility/safeProfile");

// Shared: respond to a password-valid login whose account has 2FA enabled.
// Issues a short-lived challenge token instead of a session.
function startTwoFactorChallenge(res, userProfile, scope) {
  const challengeToken = jwt.sign(
    challengePayload(userProfile._id, scope),
    process.env.TOKEN_SECRET,
    { expiresIn: `${CHALLENGE_TTL_SECONDS}s` }
  );
  return res.status(200).json({
    success: true,
    twoFactorRequired: true,
    challengeToken,
    message: "Enter your authenticator code to finish signing in",
  });
}

function verifyChallengeToken(token) {
  const decoded = jwt.verify(String(token || ""), process.env.TOKEN_SECRET);
  if (!isChallengePayload(decoded)) throw new Error("Not a 2FA challenge token");
  return decoded;
}

// POST /api/auth/2fa/setup — begin enrolment (secret stored unconfirmed).
exports.setup = async (req, res) => {
  try {
    const user = await Users.findById(getAuthUserId(req));
    if (!user) return res.status(404).json({ status: 404, error: "User not found" });
    if (user.twoFactor && user.twoFactor.enabled) {
      return res.status(409).json({ status: 409, error: "Two-factor authentication is already enabled" });
    }

    const secret = generateSecret();
    await Users.updateOne(
      { _id: user._id },
      { $set: { "twoFactor.secret": encryptSecret(secret), "twoFactor.enabled": false } }
    );

    const url = otpauthUrl(secret, user.email);
    const qrDataUrl = await QRCode.toDataURL(url);

    return res.status(200).json({ otpauthUrl: url, qrDataUrl });
  } catch (error) {
    logger.error({ err: error }, "2FA setup failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

// POST /api/auth/2fa/enable { token } — confirm enrolment with a valid code.
exports.enable = async (req, res) => {
  try {
    const user = await Users.findById(getAuthUserId(req)).select("+twoFactor.secret");
    if (!user) return res.status(404).json({ status: 404, error: "User not found" });
    if (!user.twoFactor || !user.twoFactor.secret) {
      return res.status(400).json({ status: 400, error: "Start 2FA setup first" });
    }
    if (user.twoFactor.enabled) {
      return res.status(409).json({ status: 409, error: "Two-factor authentication is already enabled" });
    }

    const secret = decrypt(user.twoFactor.secret);
    if (!(await verifyTotp(secret, req.body.token))) {
      return res.status(400).json({ status: 400, error: "Invalid authentication code" });
    }

    await Users.updateOne(
      { _id: user._id },
      { $set: { "twoFactor.enabled": true, "twoFactor.confirmedAt": new Date() } }
    );
    addActivity("2faEnabled", user.email);
    return res.status(200).json({ success: true, message: "Two-factor authentication enabled" });
  } catch (error) {
    logger.error({ err: error }, "2FA enable failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

// POST /api/auth/2fa/disable { token } — confirm with a valid code before removal.
exports.disable = async (req, res) => {
  try {
    const user = await Users.findById(getAuthUserId(req)).select("+twoFactor.secret");
    if (!user) return res.status(404).json({ status: 404, error: "User not found" });
    if (!user.twoFactor || !user.twoFactor.enabled) {
      return res.status(409).json({ status: 409, error: "Two-factor authentication is not enabled" });
    }

    const secret = decrypt(user.twoFactor.secret);
    if (!(await verifyTotp(secret, req.body.token))) {
      return res.status(400).json({ status: 400, error: "Invalid authentication code" });
    }

    await Users.updateOne(
      { _id: user._id },
      { $set: { twoFactor: { enabled: false, secret: "", confirmedAt: null } } }
    );
    addActivity("2faDisabled", user.email);
    return res.status(200).json({ success: true, message: "Two-factor authentication disabled" });
  } catch (error) {
    logger.error({ err: error }, "2FA disable failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

// GET /api/auth/2fa/status
exports.status = async (req, res) => {
  try {
    const user = await Users.findById(getAuthUserId(req)).select("email twoFactor.enabled twoFactor.confirmedAt");
    if (!user) return res.status(404).json({ status: 404, error: "User not found" });
    return res.status(200).json({
      enabled: Boolean(user.twoFactor && user.twoFactor.enabled),
      confirmedAt: (user.twoFactor && user.twoFactor.confirmedAt) || null,
    });
  } catch (error) {
    logger.error({ err: error }, "2FA status failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

// POST /api/auth/2fa/challenge { challengeToken, token } — complete login.
exports.challenge = async (req, res) => {
  try {
    let decoded;
    try {
      decoded = verifyChallengeToken(req.body.challengeToken);
    } catch {
      return res.status(401).json({ status: 401, error: "Challenge expired; sign in again" });
    }

    const user = await Users.findById(decoded.userId).select("email suspended verified role twoFactor");
    if (!user) return res.status(404).json({ status: 404, error: "User not found" });
    if (user.suspended) return res.status(403).json({ status: 403, error: "Account suspended" });

    const storedSecret = user.twoFactor && user.twoFactor.secret;
    let secret = "";
    try {
      secret = storedSecret ? decrypt(storedSecret) : "";
    } catch {
      secret = "";
    }
    if (!(await verifyTotp(secret, req.body.token))) {
      addActivity("2faChallengeFailed", user.email);
      return res.status(400).json({ status: 400, error: "Invalid authentication code" });
    }

    addActivity(decoded.scope === "admin" ? "adminLogin" : "login", user.email);
    // safeProfile/safeJwtProfile are whitelists, so the TOTP secret selected
    // above cannot reach the response body or the session token regardless.
    return issueSessionResponse(res, user, decoded.scope);
  } catch (error) {
    logger.error({ err: error }, "2FA challenge failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

// Issue the real session for a fully authenticated user. `scope` mirrors the
// original login route so admins get the admin-shaped payload they expect.
function issueSessionResponse(res, userProfile, scope) {
  const email = userProfile.email;
  // Slim JWT payload — the full profile (incl. encrypted TOTP secret) must
  // never be embedded in a token.
  const token = jwt.sign(
    scope === "admin"
      ? { profile: safeJwtProfile(userProfile) }
      : { email, id: userProfile._id },
    process.env.TOKEN_SECRET,
    { expiresIn: "8h" }
  );

  if (scope === "admin") {
    return res.status(200).json({
      success: true,
      message: "Log in successful",
      data: { userProfile: safeProfile(userProfile), jwt: token },
    });
  }

  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
    secure: isProd,
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
  });
  return res.status(200).json({
    success: true,
    message: "Log in successful",
    // The session token is delivered only through the HTTP-only cookie.
    data: { userProfile: safeProfile(userProfile) },
  });
}

const getAuthUserId = (req) => {
  const auth = req.auth;
  if (!auth) return null;
  if (auth.id) return auth.id;
  if (auth.profile && auth.profile._id) return auth.profile._id;
  return null;
};

module.exports.startTwoFactorChallenge = startTwoFactorChallenge;
module.exports.verifyChallengeToken = verifyChallengeToken;
