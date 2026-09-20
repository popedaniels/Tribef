const mongoose = require("mongoose");
const { Campaign } = require("../models/campaignModel");
const { Donations } = require("../models/donationsModel");
const { Credentials, Users } = require("../models/users");
const { addActivity } = require("../services/activityLog");
const bcrypt = require("bcrypt");
const { FundingRequests } = require("../models/fundingRequestModel");
const { Report } = require("../models/reports");
const logger = require("../utility/logger");

exports.createReport = async (req, res, next) => {
  try {
    const report = new Report({
      ...req.body.report,
      submittedAt: Date.now(),
    });
    await report.save();
    return res.status(200).json({
      status: 200,
      data: "Report submitted",
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.getAllReportsMessages = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const filter = { read: false };
    if (req.params.id) {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ status: 400, error: "Invalid Report ID" });
      }
      filter._id = req.params.id;
    }
    const count = await Report.countDocuments(filter).maxTimeMS(3000);
    const reports = await Report.find(filter).maxTimeMS(3000);

    return res.status(200).json({
      status: 200,
      data: { reports, count },
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.getSingleReportMessage = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid Report ID" });
    }
    const report = await Report.findOne({
      _id: id,
      read: false,
    }).maxTimeMS(3000);
    if (!report) {
      return res.status(404).json({ status: 404, error: "Report not found" });
    }
    return res.status(200).json({
      status: 200,
      data: report,
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.deleteSingleReportMessage = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid Report ID" });
    }
    const report = await Report.findById(id).maxTimeMS(3000);
    if (!report) {
      return res.status(404).json({ status: 404, error: "Report not found" });
    }
    report.read = true;
    const profile = req.auth.profile || req.auth;
    const admin = req.admin || profile;
    const activity = {
      AdminId: admin._id || profile._id || profile.id,
      AdminName:
        `${admin.firstName || profile.firstName || ""} ${admin.lastName || profile.lastName || ""}`.trim() || "Admin",
      action: "Read",
      date: Date.now(),
    };
    report.adminActivities = [...(report.adminActivities || []), activity];
    await report.save();
    return res.status(200).json({
      status: 200,
      data: "Report Deleted",
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
