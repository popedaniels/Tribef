const mongoose = require("mongoose");
const { Campaign } = require("../models/campaignModel");
const { Donations } = require("../models/donationsModel");
const { Credentials, Users } = require("../models/users");
const { addActivity } = require("../services/activityLog");
const bcrypt = require("bcrypt");
const { FundingRequests } = require("../models/fundingRequestModel");
const {
  suspendUserMailService,
} = require("../services/suspendUserMailService");
const {
  unsuspendUserMailService,
} = require("../services/unsuspendUserMailService ");
const logger = require("../utility/logger");
const { safeProfile } = require("../utility/safeProfile");

exports.getAllUsers = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    let sort = { _id: -1 };
    if (req.query.queries) {
      try {
        const parsed =
          typeof req.query.queries === "string"
            ? JSON.parse(req.query.queries)
            : req.query.queries;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          if (parsed.sort && typeof parsed.sort === "object" && !Array.isArray(parsed.sort)) {
            sort = parsed.sort;
          } else {
            sort = parsed;
          }
        }
      } catch (e) {
        logger.warn({ err: e }, "Could not parse queries JSON");
      }
    }
    const page = Math.max(parseInt(req.params.query, 10) || 1, 1);
    const count = await Users.countDocuments().maxTimeMS(3000);
    const users = await Users.find({})
      .sort(sort)
      .skip((page - 1) * 10)
      .limit(10)
      .maxTimeMS(3000);

    if (!users) {
      return res.status(401).json({
        status: 401,
        error: "No user found",
      });
    }

    const userr = await Promise.all(
      users.map(async (user) => {
        const camps = await Campaign.countDocuments({
          organizerId: user._id,
          launched: true,
        }).maxTimeMS(3000);
        return { user: safeProfile(user), count: camps };
      })
    );
    return res.status(200).json({
      data: { users: userr, count: count },
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.searchUsersWithName = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    let searchQuery = {};
    if (req.query.search) {
      try {
        const parsed =
          typeof req.query.search === "string"
            ? JSON.parse(req.query.search)
            : req.query.search;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          searchQuery = parsed;
        }
      } catch (e) {
        logger.warn({ err: e }, "Could not parse search JSON");
        return res.status(400).json({ status: 400, error: "Invalid search query" });
      }
    }
    const page = Math.max(parseInt(req.params.query, 10) || 1, 1);
    const count = await Users.countDocuments(searchQuery).maxTimeMS(3000);

    const users = await Users.find(searchQuery)
      .sort({ country: 1, firstName: 1 })
      .skip((page - 1) * 10)
      .limit(10)
      .maxTimeMS(3000);

    if (!users) {
      return res.status(401).json({
        status: 401,
        error: "No user found",
      });
    }

    const userr = await Promise.all(
      users.map(async (user) => {
        const camps = await Campaign.countDocuments({
          organizerId: user._id,
          launched: true,
        }).maxTimeMS(3000);
        return { user: safeProfile(user), count: camps };
      })
    );
    return res.status(200).json({
      data: { users: userr, count: count },
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({
      status: 500,
      error: "Server Error",
    });
  }
};

exports.getUserData = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid User ID" });
    }
    const fields = {
      "funding.accountName": 0,
      "funding.accountNumber": 0,
      "funding.sortCode": 0,
      "funding.bankName": 0,
    };
    const user = await Users.findById(id).maxTimeMS(3000);
    const campaigns = await Campaign.find({
      organizerId: id,
      launched: true,
    })
      .select(fields)
      .maxTimeMS(3000);
    if (user) {
      return res.status(200).json({
        data: { ...safeProfile(user), campaigns: campaigns },
      });
    }
    return res.status(404).json({ status: 404, error: "User not found" });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({
      status: 500,
      error: "Server Error",
    });
  }
};

exports.suspendUser = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const { profile, message } = req.body;
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid User ID" });
    }
    const user = await Users.findById(id).maxTimeMS(3000);
    if (!user) {
      return res.status(404).json({ status: 404, error: "User not found" });
    }
    user.verified = false;
    user.suspended = true;
    const authProfile = req.auth.profile || req.auth;
    const admin = req.admin || authProfile;
    const activity = {
      date: Date.now(),
      AdminId: admin._id || authProfile._id || authProfile.id,
      AdminName:
        `${admin.firstName || authProfile.firstName || ""} ${admin.lastName || authProfile.lastName || ""}`.trim() || "Admin",
      action: "suspension",
    };
    user.adminActivities = [...(user.adminActivities || []), activity];
    await user.save();
    await suspendUserMailService(profile, message);
    return res.status(200).json({
      data: "Campaign Suspended",
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.unsuspendUser = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const { profile, message } = req.body;
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid User ID" });
    }
    const user = await Users.findById(id).maxTimeMS(3000);
    if (!user) {
      return res.status(404).json({ status: 404, error: "User not found" });
    }
    user.verified = true;
    user.suspended = false;
    const authProfile = req.auth.profile || req.auth;
    const admin = req.admin || authProfile;
    const activity = {
      date: Date.now(),
      AdminId: admin._id || authProfile._id || authProfile.id,
      AdminName:
        `${admin.firstName || authProfile.firstName || ""} ${admin.lastName || authProfile.lastName || ""}`.trim() || "Admin",
      action: "unsuspension",
    };
    user.adminActivities = [...(user.adminActivities || []), activity];
    await user.save();
    await unsuspendUserMailService(profile, message);
    return res.status(200).json({
      data: "Campaign Suspended",
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
