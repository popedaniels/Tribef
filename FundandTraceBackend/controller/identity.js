const stripe = process.env.STRIPESECRET
  ? require("stripe")(process.env.STRIPESECRET)
  : null;
const { Users } = require("../models/users");
const { Campaign } = require("../models/campaignModel");
const webhookSecret = process.env.STRIPE_IDENTITY_WEBHOOK_SECRET;
const logger = require("../utility/logger");
const { getAuthUserId } = require("../utility/auth");

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
    let event;
    try {
      event = require("stripe").webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err) {
      return res.status(400).json({ status: 400, error: "Invalid webhook signature" });
    }

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
    data: { stripe: Boolean(stripe), inApp: true, databaseCheck: require("../services/smileId").configured() ? require("../services/smileId").supportedTypes() : null },
  });

// ── Government database check (Smile ID Enhanced KYC) ───────────────────
// POST /api/identity/database-check { country, idType, idNumber, dob? }
// A signal for the reviewer alongside the live ID check; it never verifies
// anyone on its own. Max 3 lookups per account (each costs money and an
// attacker could otherwise use us to test stolen NINs).
exports.databaseCheck = async (req, res) => {
  const smile = require("../services/smileId");

  try {

    const userId = getAuthUserId(req.auth);
    const user = await Users.findById(userId).select("firstName lastName identityVerification.databaseCheck");
    if (!user) return res.status(401).json({ status: 401, error: "Unauthorized" });
    const prev = user.identityVerification?.databaseCheck || {};
    if (prev.outcome === "verified") return res.status(409).json({ status: 409, code: "already_checked", error: "Your ID has already been checked." });
    if ((prev.attempts || 0) >= 3) return res.status(429).json({ status: 429, code: "too_many_attempts", error: "Too many attempts. Please contact support to finish verification." });

    const { country, idType, idNumber, dob } = req.body || {};
    const cc = String(country || "").toUpperCase();
    const number = smile.normaliseId(cc, idType, idNumber);
    let r;
    try {
      r = await smile.verifyIdNumber({ country: cc, idType, idNumber, dob, firstName: user.firstName, lastName: user.lastName, userId });
    } catch (err) {
      if (err.status === 400 || err.status === 503) return res.status(err.status).json({ status: err.status, code: err.code, error: err.message });
      logger.warn({ err: err.response?.data || err.message }, "Smile ID lookup failed");
      r = { outcome: "unavailable", nameMatch: "none", dobMatch: null, jobId: "", resultCode: "", resultText: "" };
    }

    const hash = smile.idHash(cc, idType, number);
    const dupes = await Users.find({ _id: { $ne: user._id }, "identityVerification.databaseCheck.idHash": hash }).select("_id").limit(5).lean();
    user.identityVerification = user.identityVerification || {};
    user.identityVerification.databaseCheck = {
      provider: "smile_id",
      country: cc,
      idType,
      idLast4: number.slice(-4),
      idHash: hash,
      outcome: r.outcome,
      nameMatch: r.nameMatch,
      dobMatch: r.dobMatch,
      duplicateOf: dupes.map((d) => String(d._id)),
      jobId: r.jobId,
      checkedAt: new Date(),
      // Provider outages don't use up an attempt.
      attempts: (prev.attempts || 0) + (r.outcome === "unavailable" ? 0 : 1),
    };
    await user.save();
    if (dupes.length) logger.warn({ userId: String(user._id), others: dupes.length }, "Same government ID on another account");

    const msg = {
      verified: r.nameMatch === "exact" ? "Your ID number was found and the name matches." : "Your ID number was found, but the name on it doesn't fully match your account. A reviewer will check.",
      not_found: "We couldn't find that ID number. Check it and try again.",
      bad_format: "That ID number isn't in the right format.",
      unavailable: "The ID database isn't responding right now. Please try again later; this didn't use up an attempt.",
      error: "The check couldn't be completed. Please try again later.",
    }[r.outcome];
    return res.json({ status: 200, data: { outcome: r.outcome, nameMatch: r.nameMatch, message: msg, attemptsLeft: Math.max(0, 3 - user.identityVerification.databaseCheck.attempts) } });
  } catch (err) {
    logger.error({ err }, "databaseCheck failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
