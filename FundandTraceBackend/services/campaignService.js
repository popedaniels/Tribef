const mongoose = require("mongoose");
const { Campaign } = require("../models/campaignModel");
const { Donations } = require("../models/donationsModel");
const { FundingRequests } = require("../models/fundingRequestModel");
const { decrypt } = require("../utility/encryption");

const CAMPAIGN_PUBLIC_PROJECTION = {
  "funding.accountName": 0,
  "funding.accountNumber": 0,
  "funding.sortCode": 0,
  "funding.bankName": 0,
};

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

async function fetchSingleCampaignById(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const camp = await Campaign.findOne({ _id: id, suspended: false }).maxTimeMS(3000);
  if (!camp) return null;

  const campObj = camp._doc ? { ...camp._doc } : { ...camp };

  if (campObj.funding && campObj.funding.accountName) {
    campObj.funding = {
      ...campObj.funding,
      accountNumber: decrypt(campObj.funding.accountNumber),
      accountName: decrypt(campObj.funding.accountName),
      bankName: decrypt(campObj.funding.bankName),
      sortCode: decrypt(campObj.funding.sortCode),
    };
  }

  const [donations, fundingRequests] = await Promise.all([
    Donations.find({ campaignId: id }),
    FundingRequests.find({ campaignId: id }),
  ]);

  return {
    ...campObj,
    donations,
    fundingRequests,
  };
}

module.exports = {
  fetchPublicCampaigns,
  fetchCampaignsByOrganizer,
  fetchSingleCampaignById,
  CAMPAIGN_PUBLIC_PROJECTION,
};
