// Fires the "goal reached" fan-out exactly once per campaign, atomically.
// The guard flag on the campaign document makes concurrent webhooks safe:
// only the write that flips targetReachedNotifiedAt proceeds to notify.
const { Campaign } = require("../models/campaignModel");
const { campaignTargetReachedMailService } = require("./campaignTargetReached");
const push = require("./push");
const logger = require("../utility/logger");

async function notifyTargetReachedIfNeeded(campaignId) {
  try {
    const claim = await Campaign.updateOne(
      {
        _id: campaignId,
        launched: true,
        targetReachedNotifiedAt: null,
        $expr: {
          $and: [
            { $gt: ["$funding.amountExpected", 0] },
            { $gte: ["$funding.amountRaised", "$funding.amountExpected"] },
          ],
        },
      },
      { $set: { targetReachedNotifiedAt: new Date() } }
    );

    const claimed =
      claim.nModified > 0 || claim.modifiedCount > 0;
    if (!claimed) return false;

    const campaign = await Campaign.findById(campaignId).select(
      "basicInformation organizer organizerId"
    );

    // Organizer email (existing service).
    if (campaign && campaign.team?.primaryContact?.email) {
      await campaignTargetReachedMailService(
        campaign.team.primaryContact.email,
        campaign
      ).catch((err) => logger.warn({ err }, "Target-reached mail failed"));
    }

    // Donor/app-subscriber push.
    await push.sendCampaignTargetReached(campaign || { _id: campaignId });
    return true;
  } catch (err) {
    // Notification failure must never affect the payment flow.
    logger.warn({ err }, "Target-reached notification failed");
    return false;
  }
}

module.exports = { notifyTargetReachedIfNeeded };
