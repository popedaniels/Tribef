const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Users } = require("../models/users");

const getJwtSecret = () => {
  if (!process.env.TOKEN_SECRET || process.env.TOKEN_SECRET.length < 32) {
    throw new Error("TOKEN_SECRET must be configured with at least 32 characters");
  }
  return process.env.TOKEN_SECRET;
};

const getAuthUserId = (decoded) => decoded && (decoded.id || decoded.profile?._id);

const getToken = (req) => {
  const authorization = req.headers.authorization || "";
  if (authorization.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }
  return req.cookies && req.cookies.token;
};

const verifyToken = (req) => {
  const token = getToken(req);
  if (!token) {
    const error = new Error("Unauthorized");
    error.status = 401;
    throw error;
  }
  return jwt.verify(token, getJwtSecret());
};

const requireAuth = (req, res, next) => {
  try {
    req.auth = verifyToken(req);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      status: 401,
      error: "Unauthorized",
    });
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    const decoded = verifyToken(req);
    const userId = getAuthUserId(decoded);

    if (!userId) {
      return res.status(403).json({
        success: false,
        status: 403,
        error: "Admin access required",
      });
    }

    const user = await Users.findById(userId).select("role suspended");
    if (!user || user.role !== "admin" || user.suspended) {
      return res.status(403).json({
        success: false,
        status: 403,
        error: "Admin access required",
      });
    }

    req.auth = decoded;
    req.admin = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      status: 401,
      error: "Unauthorized",
    });
  }
};

const requireCampaignOwner = async (req, res, next) => {
  try {
    const requestedOwnerId =
      req.body.organizerId ||
      req.body.fundingRequest?.organizerId ||
      req.query.organizerId;
    const campaignId =
      req.body.id ||
      req.body.fundingRequest?.campaignId ||
      req.query.campaignId ||
      req.params.id;
    const authUserId = getAuthUserId(req.auth);

    if (!authUserId) {
      return res.status(401).json({
        success: false,
        status: 401,
        error: "Unauthorized",
      });
    }

    if (requestedOwnerId && String(requestedOwnerId) !== String(authUserId)) {
      return res.status(403).json({
        success: false,
        status: 403,
        error: "Campaign ownership required",
      });
    }

    if (!campaignId) {
      // The initial campaign-creation request has no campaign ID yet. Bind it
      // to the authenticated user instead of trusting the client value.
      if (req.baseUrl === "/api/startCampaign" && req.path === "/") {
        req.body.organizerId = authUserId;
        return next();
      }
      return res.status(400).json({
        success: false,
        status: 400,
        error: "Campaign ID is required",
      });
    }

    const { Campaign } = require("../models/campaignModel");
    const campaign = await Campaign.findById(campaignId).select("organizerId");
    if (!campaign || String(campaign.organizerId) !== String(authUserId)) {
      return res.status(403).json({
        success: false,
        status: 403,
        error: "Campaign ownership required",
      });
    }

    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      status: 403,
      error: "Campaign ownership required",
    });
  }
};

const requireInternalWebhook = (req, res, next) => {
  const expected = process.env.INTERNAL_WEBHOOK_SECRET;
  const supplied = req.headers["x-internal-webhook-secret"];
  const expectedBuffer = expected && Buffer.from(expected);
  const suppliedBuffer = supplied && Buffer.from(String(supplied));

  if (
    !expectedBuffer ||
    !suppliedBuffer ||
    expectedBuffer.length !== suppliedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)
  ) {
    return res.status(401).json({
      success: false,
      status: 401,
      error: "Unauthorized webhook",
    });
  }

  next();
};

module.exports = {
  getToken,
  verifyToken,
  requireAuth,
  requireAdmin,
  requireCampaignOwner,
  requireInternalWebhook,
};
