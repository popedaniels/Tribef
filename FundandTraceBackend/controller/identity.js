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

    if (user.identityVerification?.status === "verified") {
      return res.status(409).json({ status: 409, error: "Your identity is already verified." });
    }
    // Without Stripe Identity there is no automated check: send the organiser
    // to the in-app flow (live ID + selfie video, reviewed by our team) rather
    // than marking them "pending" against a session that doesn't exist.
    if (!stripe) {
      return res.status(503).json({ status: 503, error: "Automated ID check is unavailable. Use the in-app verification instead.", fallback: "in_app" });
    }

    let session;
    try {
      session = await stripe.identity.verificationSessions.create({
        type: "document",
        metadata: {
          userId: String(userId),
          campaignId: campaignId ? String(campaignId) : "",
        },
        options: {
          document: {
            require_matching_selfie: true,
            require_live_capture: true,
          },
        },
        return_url: `${process.env.MAINURL || "http://localhost:3000"}/dashboard/verify-identity?stripe=done`,
      });
    } catch (stripeErr) {
      logger.warn({ err: stripeErr }, "Stripe Identity session creation failed");
      return res.status(503).json({ status: 503, error: "Automated ID check is unavailable right now. Use the in-app verification instead.", fallback: "in_app" });
    }
    const sessionUrl = session.url;
    const clientSecret = session.client_secret;
    const sessionId = session.id;

    user.identityVerification = {
      ...(user.identityVerification?.toObject?.() || user.identityVerification || {}),
      status: "pending",
      method: "stripe",
      sessionId,
      // Set when Stripe reports the person actually submitted (processing).
      submittedAt: null,
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
          // NB: users.verified is the EMAIL-verified flag that gates sign-in;
          // identity has its own status and must never change it.
          user.identityVerification = {
            ...(user.identityVerification?.toObject?.() || user.identityVerification || {}),
            status: "verified",
            method: "stripe",
            sessionId: session.id,
            verifiedAt: new Date(),
            idDocumentType: session.verified_outputs?.document?.type || session.last_verification_report?.document?.type || null,
            idCountry: session.verified_outputs?.document?.issuing_country || null,
            facialLivenessMatched: true,
            rejectionReason: "",
          };
          await user.save();
        }
      }
    } else if (event.type === "identity.verification_session.requires_input") {
      const session = event.data.object;
      const userId = session.metadata && session.metadata.userId;
      if (userId) {
        await Users.findByIdAndUpdate(userId, {
          "identityVerification.status": "requires_input",
          "identityVerification.rejectionReason": String(session.last_error?.reason || session.last_error?.code || "The ID check couldn't be completed."),
        });
      }
    } else if (event.type === "identity.verification_session.processing") {
      const session = event.data.object;
      const userId = session.metadata && session.metadata.userId;
      if (userId) {
        await Users.findOneAndUpdate(
          { _id: userId, "identityVerification.status": { $ne: "verified" } },
          { "identityVerification.status": "pending", "identityVerification.submittedAt": new Date() }
        );
      }
    } else if (event.type === "identity.verification_session.canceled") {
      const session = event.data.object;
      const userId = session.metadata && session.metadata.userId;
      if (userId) {
        await Users.findOneAndUpdate(
          { _id: userId, "identityVerification.status": { $ne: "verified" } },
          { "identityVerification.status": "canceled" }
        );
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

    const note = String(req.body?.note || "").trim().slice(0, 500);
    if (note.length < 10) {
      return res.status(422).json({ status: 422, error: "Explain the override (10+ characters): what was checked, and how." });
    }
    const prev = user.identityVerification?.toObject?.() || user.identityVerification || {};
    user.identityVerification = {
      ...prev,
      status: normalizedStatus,
      method: "admin_override",
      sessionId: "admin_override_" + Date.now(),
      verifiedAt: normalizedStatus === "verified" ? new Date() : prev.verifiedAt || null,
      // An override is a human decision, not a liveness check: say so.
      facialLivenessMatched: false,
      reviewedBy: `${req.admin.firstName || ""} ${req.admin.lastName || ""}`.trim(),
      rejectionReason: normalizedStatus === "verified" ? "" : note,
    };

    user.adminActivities = user.adminActivities || [];
    user.adminActivities.push({
      date: new Date(),
      AdminId: req.admin._id,
      AdminName: `${req.admin.firstName} ${req.admin.lastName}`,
      action: `Identity verification overridden to ${normalizedStatus}: ${note}`,
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

/**
 * Which verification routes are available.
 * GET /api/identity/options
 */
exports.options = (req, res) =>
  res.status(200).json({
    status: 200,
    data: { stripe: Boolean(stripe), inApp: true },
  });
