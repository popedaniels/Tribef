const { CampaignEmailWhitelist } = require("../models/campaignEmailWhitelist");
const logger = require("../utility/logger");

exports.addEmailToWhitelist = async (req, res, next) => {
  try {
    const { email, campaignId } = req.body;
    if (!campaignId || !/^\S+@\S+\.\S+$/.test(String(email || ""))) {
      return res.status(400).json({ status: 400, error: "Valid email and campaign are required" });
    }
    const EmailLists = await CampaignEmailWhitelist.findOne({
      email,
      campaignId,
    });
    if (EmailLists) {
      return res
        .status(422)
        .json({ status: 422, error: "Email Already Added" });
    } else {
      const campaignEmailWhitelist = new CampaignEmailWhitelist({
        email,
        campaignId,
      });
      await campaignEmailWhitelist.save();
      return res.status(200).json({
        status: 200,
        data: "Email added successfully",
      });
    }
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.removeEmailToWhitelist = async (req, res, next) => {
  try {
    const { email, campaignId } = req.query;
    if (!campaignId || !email) {
      return res.status(400).json({ status: 400, error: "Email and campaign are required" });
    }
    await CampaignEmailWhitelist.deleteOne({
      email: email,
      campaignId: campaignId,
    });

    return res.status(200).json({
      status: 200,
      data: "Email removed successfully",
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
