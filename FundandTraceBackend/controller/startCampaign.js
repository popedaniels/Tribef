const mongoose = require("mongoose");
const { Campaign } = require("../models/campaignModel");
const { Users } = require("../models/users");
const { addActivity } = require("../services/activityLog");
const { buildOrganizerUpdate } = require("../utility/campaignEdits");
const { notifyBankChange } = require("../services/bankChange");
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
    const existing = await Campaign.findById(id).maxTimeMS(3000);
    if (!existing) {
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }
    // Whitelist organiser-editable fields (see utility/campaignEdits.js).
    const { set, errors, bankChanged } = buildOrganizerUpdate(saveCampaign, existing);
    if (errors.length) {
      return res.status(422).json({ status: 422, error: errors.join("; ") });
    }
    if (Object.keys(set).length) {
      await Campaign.updateOne({ _id: id }, { $set: set }, { runValidators: true }).maxTimeMS(3000);
    }
    if (bankChanged) notifyBankChange(id);
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
    if (content.campaignVideo !== undefined) {
      const video = require("../utility/videoUrl").normaliseCampaignVideo(content.campaignVideo);
      if (video === null) return res.status(400).json({ status: 400, error: "Campaign video must be a YouTube link or a video you uploaded" });
      content.campaignVideo = video;
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
    // Only goal, currency and payout details are editable. The old code
    // replaced the whole sub-document, so a client could set its own
    // amountRaised / availableBalance (escrow bypass).
    const { set, errors, bankChanged } = buildOrganizerUpdate({ funding }, camp);
    if (errors.length) {
      return res.status(422).json({ status: 422, error: errors.join("; ") });
    }
    const campaign = await Campaign.findByIdAndUpdate(id, { $set: set }, { new: true, runValidators: true }).maxTimeMS(3000);
    if (bankChanged) notifyBankChange(id);
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
    if (typeof launch !== "boolean") {
      return res.status(400).json({ status: 400, error: "launch must be true or false" });
    }
    const camp = await Campaign.findById(id).maxTimeMS(3000);
    if (!camp) {
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }
    if (launch) {
      if (camp.suspended) {
        return res.status(403).json({ status: 403, error: "Suspended campaigns cannot be launched" });
      }
      // A launched campaign must be presentable and fundable.
      const missing = [];
      if (!camp.basicInformation?.campaignTitle?.trim()) missing.push("campaign title");
      if (!(Number(camp.funding?.amountExpected) > 0)) missing.push("funding goal");
      if (missing.length) {
        return res.status(422).json({
          status: 422,
          error: `Complete the following before launching: ${missing.join(", ")}`,
        });
      }
      // Identity gate for organisers (services/kycGate.js). By default an
      // organiser must at least have SUBMITTED a live ID check before a
      // campaign can take money; payouts still need it VERIFIED.
      const gate = require("../services/kycGate").launchGate();
      if (gate !== "off") {
        const organizer = await Users.findById(camp.organizerId).select("identityVerification").maxTimeMS(3000);
        const { allowed, message } = require("../services/kycGate").canLaunch(organizer?.identityVerification, gate);
        if (!allowed) {
          return res.status(403).json({ status: 403, code: "identity_required", error: message });
        }
      }
    }
    const wasLaunched = Boolean(camp.launched);
    camp.launched = launch;
    // Only stamp the launch date on the first launch, not on every toggle.
    if (launch && !wasLaunched) camp.createdAt = Date.now();
    const campaign = await camp.save();
    addActivity("launchedCampaign", camp.organizerId || camp.organizer);
    // Score the organiser in the background; admins see it in review.
    if (launch && !wasLaunched) require("../services/organiserRisk").assessLaunch(camp._id);
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
