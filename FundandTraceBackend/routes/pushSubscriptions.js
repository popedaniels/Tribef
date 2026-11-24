const express = require("express");
const router = express.Router();
const { PushSubscription } = require("../models/pushSubscriptionModel");
const logger = require("../utility/logger");
const { authenticate } = require("../utility/auth");

// Register a browser push subscription (PWA service worker calls this).
router.post("/", async (req, res) => {
  try {
    const { endpoint, keys } = req.body || {};
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ status: 400, error: "Invalid subscription payload" });
    }
    if (typeof endpoint !== "string" || !/^https:\/\//.test(endpoint) || endpoint.length > 1000) {
      return res.status(400).json({ status: 400, error: "Invalid subscription payload" });
    }
    // The account comes from the session, never the body: otherwise anyone
    // could register their browser to receive another user's notifications.
    const session = await authenticate(req).catch(() => null);
    const userEmail = String(session?.email || session?.profile?.email || "").toLowerCase().slice(0, 254);
    await PushSubscription.updateOne({ endpoint }, { $set: { keys, userEmail } }, { upsert: true });
    return res.status(201).json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Push subscription failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
});

router.delete("/", async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    if (!endpoint) {
      return res.status(400).json({ status: 400, error: "endpoint required" });
    }
    await PushSubscription.deleteOne({ endpoint });
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Push unsubscribe failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
});

module.exports = router;
