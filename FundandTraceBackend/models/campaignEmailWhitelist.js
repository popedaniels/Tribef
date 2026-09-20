const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const campaignEmailWhitelistSchema = {
  email: { type: String, index: true },
  campaignId: { type: ObjectId, ref: "campaign", index: true },
};

const CampaignEmailWhitelist = mongoose.model(
  "campaignEmailWhitelist",
  campaignEmailWhitelistSchema
);

module.exports = {
  CampaignEmailWhitelist,
};
