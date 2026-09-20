const mongoose = require("mongoose");
const { Campaign } = require("../models/campaignModel");
const { Donations } = require("../models/donationsModel");
const { Credentials, Users } = require("../models/users");
const { addActivity } = require("../services/activityLog");
const bcrypt = require("bcrypt");
const { FundingRequests } = require("../models/fundingRequestModel");
const { Support } = require("../models/support");
const { replySupportMailService } = require("../services/replySupportMessage");
const logger = require("../utility/logger");

exports.createSupport = async (req, res, next) => {
  try {
    const support = new Support({
      ...req.body.support,
      submittedAt: Date.now(),
    });
    await support.save();
    return res.status(200).json({
      status: 200,
      data: "Ticket submitted",
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.getAllSupportMessages = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const count = await Support.countDocuments({
      read: false,
    }).maxTimeMS(3000);
    const supports = await Support.find({
      read: false,
    }).maxTimeMS(3000);
    return res.status(200).json({
      status: 200,
      data: { supports, count },
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.getSingleSupportMessage = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid Support ID" });
    }
    const support = await Support.findOne({
      _id: id,
      read: false,
    }).maxTimeMS(3000);
    if (!support) {
      return res.status(404).json({ status: 404, error: "Support message not found" });
    }
    return res.status(200).json({
      status: 200,
      data: support,
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.deleteSingleSupportMessage = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid Support ID" });
    }
    const support = await Support.findById(id).maxTimeMS(3000);
    if (!support) {
      return res.status(404).json({ status: 404, error: "Support message not found" });
    }
    support.read = true;
    const profile = req.auth.profile || req.auth;
    const admin = req.admin || profile;
    const response = {
      AdminId: admin._id || profile._id || profile.id,
      AdminName:
        `${admin.firstName || profile.firstName || ""} ${admin.lastName || profile.lastName || ""}`.trim() || "Admin",
      action: "Read",
      responsedAt: Date.now(),
      responseText: "",
    };
    support.response = [...(support.response || []), response];
    await support.save();
    return res.status(200).json({
      status: 200,
      data: "Ticket Deleted",
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.replyToSupportMessage = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid Support ID" });
    }
    if (!req.body.message || typeof req.body.message !== "string" || !req.body.message.trim()) {
      return res.status(400).json({ status: 400, error: "Message is required" });
    }
    const support = await Support.findById(id).maxTimeMS(3000);
    if (!support) {
      return res.status(404).json({ status: 404, error: "Support message not found" });
    }
    const profile = req.auth.profile || req.auth;
    const admin = req.admin || profile;
    const response = {
      AdminId: admin._id || profile._id || profile.id,
      AdminName:
        `${admin.firstName || profile.firstName || ""} ${admin.lastName || profile.lastName || ""}`.trim() || "Admin",
      action: "Reply",
      responsedAt: Date.now(),
      responseText: req.body.message,
    };
    support.response = [...(support.response || []), response];
    await replySupportMailService(
      support.email,
      support.subject,
      req.body.message
    );
    await support.save();
    return res.status(200).json({
      status: 200,
      data: "Reply Sent!",
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
