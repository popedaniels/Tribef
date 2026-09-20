const mongoose = require("mongoose");
const { Campaign } = require("../models/campaignModel");
const { addActivity } = require("../services/activityLog");
const { encrypt } = require("../utility/encryption");
const logger = require("../utility/logger");

exports.save = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const { id, saveCampaign } = req.body;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid Campaign ID" });
    }
    if (!saveCampaign || typeof saveCampaign !== "object") {
      return res.status(400).json({ status: 400, error: "saveCampaign is required" });
    }
    let camp = await Campaign.findOneAndUpdate(
      { _id: id },
      saveCampaign,
      { runValidators: true }
    ).maxTimeMS(3000);
    if (!camp) {
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }
    await camp.save();
    return res.status(201).json({
      success: true,
      message: "Saved successfully",
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.create = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    if (!req.body.category || !req.body.campaignType) {
      return res.status(400).json({ status: 400, error: "category and campaignType are required" });
    }
    const newCampaign = new Campaign({
      category: req.body.category.toLowerCase().split(" ").join(""),
      organizer: req.body.organizer,
      organizerId: req.body.organizerId,
      campaignType: req.body.campaignType,
    });
    const campaign = await newCampaign.save();
    return res.status(201).json({
      success: true,
      message: "Saved successfully",
      data: campaign,
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.basicInfo = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const { id, basicInformation } = req.body;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid Campaign ID" });
    }
    if (!basicInformation) {
      return res.status(400).json({ status: 400, error: "basicInformation is required" });
    }
    const camp = await Campaign.findById(id).maxTimeMS(3000);
    if (!camp) {
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }
    camp.basicInformation = basicInformation;

    const campaign = await camp.save();
    return res.status(201).json({
      success: true,
      message: "Saved successfully",
      data: campaign,
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.content = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const { id, content } = req.body;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid Campaign ID" });
    }
    if (!content) {
      return res.status(400).json({ status: 400, error: "content is required" });
    }
    const camp = await Campaign.findById(id).maxTimeMS(3000);
    if (!camp) {
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }
    camp.content = content;

    const campaign = await camp.save();
    return res.status(201).json({
      success: true,
      message: "Saved successfully",
      data: campaign,
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.team = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const { id, team } = req.body;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid Campaign ID" });
    }
    if (!team) {
      return res.status(400).json({ status: 400, error: "team is required" });
    }
    const camp = await Campaign.findById(id).maxTimeMS(3000);
    if (!camp) {
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }
    camp.team = team;
    const campaign = await camp.save();
    return res.status(201).json({
      success: true,
      message: "Saved successfully",
      data: campaign,
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.funding = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const { id, funding } = req.body;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid Campaign ID" });
    }
    if (!funding || typeof funding !== "object") {
      return res.status(400).json({ status: 400, error: "funding is required" });
    }
    const camp = await Campaign.findById(id).maxTimeMS(3000);
    if (!camp) {
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }
    const fundingData = { ...funding };
    if (fundingData.accountNumber) fundingData.accountNumber = encrypt(fundingData.accountNumber);
    if (fundingData.accountName) fundingData.accountName = encrypt(fundingData.accountName);
    if (fundingData.bankName) fundingData.bankName = encrypt(fundingData.bankName);
    if (fundingData.sortCode) fundingData.sortCode = encrypt(fundingData.sortCode);
    camp.funding = fundingData;
    const campaign = await camp.save();
    return res.status(201).json({
      success: true,
      message: "Saved successfully",
      data: campaign,
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.settings = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const { id, settings } = req.body;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid Campaign ID" });
    }
    if (!settings) {
      return res.status(400).json({ status: 400, error: "settings is required" });
    }
    const camp = await Campaign.findById(id).maxTimeMS(3000);
    if (!camp) {
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }
    camp.settings = settings;
    const campaign = await camp.save();
    return res.status(201).json({
      success: true,
      message: "Saved successfully",
      data: campaign,
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.launch = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const { id, launch } = req.body;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid Campaign ID" });
    }
    const camp = await Campaign.findById(id).maxTimeMS(3000);
    if (!camp) {
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }
    camp.launched = launch;
    camp.createdAt = Date.now();
    const campaign = await camp.save();
    addActivity("launchedCampaign", camp.organizer);
    return res.status(201).json({
      success: true,
      message: "Saved successfully",
      data: campaign,
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
