const mongoose = require("mongoose");
const { Campaign } = require("../models/campaignModel");
const { Donations } = require("../models/donationsModel");
const { FundingRequests } = require("../models/fundingRequestModel");
const { decrypt } = require("../utility/encryption");

const { CAMPAIGN_PUBLIC_PROJECTION } = require("../utility/publicViews");

async function fetchPublicCampaigns({ page = 1, limit = 50 }) {
  const skip = (page - 1) * limit;
  const filter = { launched: true, suspended: false };

  const [campaigns, count] = await Promise.all([
    Campaign.find(filter)
      .select(CAMPAIGN_PUBLIC_PROJECTION)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .maxTimeMS(3000),
    Campaign.countDocuments(filter).maxTimeMS(3000),
  ]);

  return { campaigns, count, page, limit, totalPages: Math.ceil(count / limit) };
}

async function fetchCampaignsByOrganizer(organizerId) {
  const campaigns = await Campaign.find({ organizerId }).select(CAMPAIGN_PUBLIC_PROJECTION);
  const active = campaigns.filter((c) => c.launched === true);
  const drafts = campaigns.filter((c) => c.launched === false);
  return { active, drafts };
}

module.exports = {
  fetchPublicCampaigns,
  fetchCampaignsByOrganizer,
  CAMPAIGN_PUBLIC_PROJECTION,
};
