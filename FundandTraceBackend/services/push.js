// Web Push notifications (VAPID). No-ops entirely when VAPID keys are not
// configured, so dev/test environments need zero setup.
const webpush = require("web-push");
const { PushSubscription } = require("../models/pushSubscriptionModel");
const logger = require("../utility/logger");

let configured = false;

function initPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:support@fundandtrace.com",
      publicKey,
      privateKey
    );
    configured = true;
    logger.info("Web push notifications enabled");
  } catch (err) {
    logger.warn({ err }, "Invalid VAPID configuration; push disabled");
  }
  return configured;
}

const isConfigured = () => configured;

function notificationPayload(title, body, url) {
  return JSON.stringify({ title, body, url: url || "/" });
}

// Fire-and-forget to every subscriber; prunes subscriptions the push service
// reports as gone (410).
async function sendToAll(payload) {
  if (!configured) return { sent: 0, pruned: 0 };
  const subs = await PushSubscription.find();
  let sent = 0;
  let pruned = 0;

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        );
        sent += 1;
      } catch (err) {
        if (err && (err.statusCode === 404 || err.statusCode === 410)) {
          await PushSubscription.deleteOne({ _id: sub._id });
          pruned += 1;
        } else {
          logger.warn({ err }, "Push delivery failed");
        }
      }
    })
  );
  return { sent, pruned };
}

async function sendCampaignTargetReached(campaign) {
  return sendToAll(
    notificationPayload(
      "Goal reached! 🎉",
      `"${campaign.basicInformation?.campaignTitle || "A campaign"}" just hit its target.`,
      `/campaign/${campaign._id}`
    )
  );
}

module.exports = {
  initPush,
  isConfigured,
  sendToAll,
  sendCampaignTargetReached,
  notificationPayload,
};
