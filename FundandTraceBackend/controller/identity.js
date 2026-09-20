const stripe = process.env.STRIPESECRET
  ? require("stripe")(process.env.STRIPESECRET)
  : null;
const { Users } = require("../models/users");
const { Campaign } = require("../models/campaignModel");
const webhookSecret = process.env.STRIPE_IDENTITY_WEBHOOK_SECRET;
const logger = require("../utility/logger");

/**
 * Creates a Stripe Identity Verification Session for the organizer.
 * POST /api/identity/create-session
 */
exports.createVerificationSession = async (req, res) => {
  try {
    const { userId, campaignId } = req.body;

    if (!userId) {
      return res.status(400).json({ status: 400, error: "User ID is required." });
    }
    if (!req.auth || String(req.auth.id) !== String(userId)) {
      return res.status(403).json({ status: 403, error: "Unauthorized" });
    }

    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 404, error: "User not found." });
    }

    let sessionUrl = "";
    let clientSecret = "";
    let sessionId = "";

    try {
      if (stripe) {
        const session = await stripe.identity.verificationSessions.create({
          type: "document",
          metadata: {
            userId: String(userId),
            campaignId: campaignId ? String(campaignId) : "",
          },
          options: {
            document: {
              require_matching_selfie: true,
            },
          },
          return_url: `${process.env.MAINURL || "http://localhost:3000"}/verification?status=complete&session_id={CHECKOUT_SESSION_ID}`,
        });
        sessionUrl = session.url;
        clientSecret = session.client_secret;
        sessionId = session.id;
      } else {
        // Fallback for offline/test environments
        sessionId = "vs_test_" + Date.now();
        sessionUrl = `${process.env.MAINURL || "http://localhost:3000"}/verification?session_id=${sessionId}`;
        clientSecret = "seti_secret_test_" + Date.now();
      }
    } catch (stripeErr) {
      logger.warn({ err: stripeErr }, "Stripe Identity session creation failed, using fallback");
      sessionId = "vs_fallback_" + Date.now();
      sessionUrl = `${process.env.MAINURL || "http://localhost:3000"}/verification?session_id=${sessionId}`;
    }

    user.identityVerification = {
      ...user.identityVerification,
      status: "pending",
      sessionId: sessionId,
    };
    await user.save();

    return res.status(200).json({
      status: 200,
      data: {
        sessionId,
        url: sessionUrl,
        clientSecret,
        status: user.identityVerification.status,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "createVerificationSession failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

/**
 * Retrieves the active KYC verification status of a user.
 * GET /api/identity/status/:userId
 */
exports.getVerificationStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!req.auth || String(req.auth.id) !== String(userId)) {
      return res.status(403).json({ status: 403, error: "Unauthorized" });
    }
    const user = await Users.findById(userId);

    if (!user) {
      return res.status(404).json({ status: 404, error: "User not found." });
    }

    return res.status(200).json({
      status: 200,
      data: user.identityVerification || {
        status: "unverified",
        facialLivenessMatched: false,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "getVerificationStatus failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

/**
 * Handles Stripe Identity webhooks (verified, requires_input, canceled).
 * POST /api/identity/webhook
 */
exports.identityWebhook = async (req, res) => {
  try {
    if (!webhookSecret) {
      return res.status(503).json({ status: 503, error: "Webhook is not configured" });
    }

    const signature = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);

    if (event.type === "identity.verification_session.verified") {
      const session = event.data.object;
      const userId = session.metadata && session.metadata.userId;

      if (userId) {
        const user = await Users.findById(userId);
        if (user) {
          user.identityVerification = {
            status: "verified",
            sessionId: session.id,
            verifiedAt: new Date(),
            idDocumentType: session.verified_outputs?.document?.type || "id_card",
            idCountry: session.verified_outputs?.document?.issuing_country || "US",
            facialLivenessMatched: true,
          };
          user.verified = true;
          await user.save();
        }
      }
    } else if (event.type === "identity.verification_session.requires_input") {
      const session = event.data.object;
      const userId = session.metadata && session.metadata.userId;
      if (userId) {
        await Users.findByIdAndUpdate(userId, {
          "identityVerification.status": "requires_input",
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error({ err: error }, "identityWebhook failed");
    return res.status(500).json({ status: 500, error: "Webhook processing error." });
  }
};

/**
 * Admin manual verification override.
 * POST /api/identity/admin-verify/:userId
 */
exports.adminVerifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    const normalizedStatus = status || "verified";
    if (!["verified", "requires_input", "canceled"].includes(normalizedStatus)) {
      return res.status(400).json({ status: 400, error: "Invalid verification status" });
    }

    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 404, error: "User not found." });
    }

    user.identityVerification = {
      status: normalizedStatus,
      sessionId: "admin_override_" + Date.now(),
      verifiedAt: new Date(),
      idDocumentType: "admin_verified",
      idCountry: user.country || "Global",
      facialLivenessMatched: true,
    };
    user.verified = normalizedStatus === "verified";

    user.adminActivities = user.adminActivities || [];
    user.adminActivities.push({
      date: new Date(),
      AdminId: req.admin._id,
      AdminName: `${req.admin.firstName} ${req.admin.lastName}`,
      action: `Identity verification status updated to ${normalizedStatus}`,
    });

    await user.save();

    return res.status(200).json({
      status: 200,
      message: `User verification updated to ${normalizedStatus}`,
      data: user.identityVerification,
    });
  } catch (error) {
    logger.error({ err: error }, "adminVerifyUser failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
