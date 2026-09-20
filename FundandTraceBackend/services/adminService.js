const { Campaign } = require("../models/campaignModel");
const { Donations } = require("../models/donationsModel");
const { Users } = require("../models/users");
const { FundingRequests } = require("../models/fundingRequestModel");

async function getAdminMetrics() {
  const [totalUsers, totalCampaigns, totalDonations, pendingFundingRequests] = await Promise.all([
    Users.countDocuments({}),
    Campaign.countDocuments({ launched: true }),
    Donations.countDocuments({}),
    FundingRequests.countDocuments({ status: "Pending" }),
  ]);

  return {
    totalUsers,
    totalCampaigns,
    totalDonations,
    pendingFundingRequests,
  };
}

async function getFlaggedDonations(limit = 50) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  return Donations.find({ "fraud.flagged": true })
    .populate("campaignId", "basicInformation.campaignTitle")
    .sort({ createdAt: -1 })
    .limit(safeLimit);
}

module.exports = {
  getAdminMetrics,
  getFlaggedDonations,
};
