const mongoose = require("mongoose");
const { Campaign } = require("../models/campaignModel");
const { Donations } = require("../models/donationsModel");
const { Credentials, Users } = require("../models/users");
const { addActivity } = require("../services/activityLog");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { FundingRequests } = require("../models/fundingRequestModel");
const { convertToPounds } = require("../currencyConverter");
const { sendUserMailService } = require("../services/sendUserMailService");
const {
  suspendCampaignMailService,
} = require("../services/suspendCampaignMailService");
const {
  unsuspendCampaignMailService,
} = require("../services/unsuspendCampaignMailService.");
const logger = require("../utility/logger");
const { getFlaggedDonations, getAdminMetrics } = require("../services/adminService");
const { startTwoFactorChallenge } = require("./twoFactor");
const { safeProfile, safeJwtProfile } = require("../utility/safeProfile");

// Fields an admin may update via updateAdminProfile. Note this is intentionally
// broader than user self-updates (admins manage KYC/role), but twoFactor is
// excluded — TOTP enrolment must go through the 2FA endpoints, and `verified`
// changes must flow through identity verification.
const ADMIN_UPDATE_ALLOWED = [
  "firstName",
  "lastName",
  "country",
  "city",
  "phone",
  "code",
  "language",
  "profilePicture",
  "role",
  "identityVerification",
];

const pickAllowed = (source, allowed) => {
  const out = {};
  if (!source || typeof source !== "object") return out;
  for (const key of allowed) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
};

// Admin fraud queue: flagged donations, newest first.
exports.listFlaggedDonations = async (req, res) => {
  try {
    const donations = await getFlaggedDonations(req.query.limit);
    return res.status(200).json({ status: "successful", data: donations });
  } catch (error) {
    logger.error({ err: error }, "listFlaggedDonations failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.adminLogin = async (req, res, next) => {
  try {
    //grab the login details
    const { email, password } = req.body;

    //check if there's a user with that email
    const user = await Credentials.findOne({ email: email });
    if (!user)
      return res.status(404).json({
        status: 404,
        error: "Email supplied is incorrect or doesn't exist",
      });

    //verfiy the password
    const verifyPassword = await bcrypt.compare(password, user.password);
    if (!verifyPassword)
      return res
        .status(404)
        .json({ status: 404, error: "password supplied is incorrect" });

    //get the user profile
    const userProfile = await Users.findOne({ email: email });

    //check for user
    if (!userProfile) {
      return res.status(404).json({
        status: 404,
        error: "User not found",
      });
    }

    //generate a JWT — slim payload only. Never embed the full profile
    //(it leaked the encrypted TOTP secret and admin activity trail).
    const token = jwt.sign(
      { profile: safeJwtProfile(userProfile) },
      process.env.TOKEN_SECRET,
      { expiresIn: "8h" }
    );

    //check if the user is an admin
    if (userProfile.role == "admin") {
      // Admins with 2FA enabled must complete the TOTP challenge first.
      if (userProfile.twoFactor && userProfile.twoFactor.enabled) {
        return startTwoFactorChallenge(res, userProfile, "admin");
      }
      addActivity("adminLogin", email);
      return res.status(200).json({
        success: true,
        message: "Log in successful",
        data: { userProfile: safeProfile(userProfile), jwt: token },
      });
    } else {
      return res.status(404).json({
        status: 404,
        error: "Not an admin",
      });
    }
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.updateAdminProfile = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid ID" });
    }
    if (!req.body.profile || typeof req.body.profile !== "object") {
      return res.status(400).json({ status: 400, error: "Profile data is required" });
    }
    // Field allowlist: profile updates are client-controlled and must not
    // reach server-managed state (suspended, twoFactor, email, ...).
    const updates = pickAllowed(req.body.profile, ADMIN_UPDATE_ALLOWED);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ status: 400, error: "No valid profile fields supplied" });
    }
    await Users.findOneAndUpdate({ _id: id }, { $set: updates }).maxTimeMS(3000);
    const user = await Users.findById(id).maxTimeMS(3000);
    if (!user) {
      return res.status(404).json({ status: 404, error: "User not found" });
    }
    addActivity("updateProfile", user.email);
    return res.status(201).json({
      success: true,
      message: "User updated successfully",
      data: safeProfile(user),
    });
  } catch (error) {
    logger.error({ err: error }, "updateAdminProfile failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.getOverviewDetails = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const fields = {
      "funding.accountName": 0,
      "funding.accountNumber": 0,
      "funding.sortCode": 0,
      "funding.bankName": 0,
    };
    const [
      campaigns,
      usersCount,
      donationsCount,
      fundingRequests,
      allUsers,
    ] = await Promise.all([
      Campaign.find({ launched: true }).select(fields).maxTimeMS(3000),
      Users.countDocuments().maxTimeMS(3000),
      Donations.countDocuments({ "refund.status": { $ne: "succeeded" } }).maxTimeMS(3000),
      FundingRequests.find({ status: "Approved" }).maxTimeMS(3000),
      Users.find({}).maxTimeMS(3000),
    ]);

    const getCampaignOrganizers = () => {
      const uniqueOrganizers = [
        ...new Set(campaigns.map((campaign) => campaign.organizerId)),
      ];

      return uniqueOrganizers.length;
    };

    const getCountries = async () => {
      const mapping = async () => {
        return new Set(allUsers.map((user) => user.country));
      };

      const uniqueCountries = [...(await mapping())];

      return uniqueCountries.length;
    };

    const getAmountRaised = () => {
      const amountRaised = campaigns.reduce((accumulator, campaign) => {
        return (
          accumulator +
          convertToPounds(
            campaign.funding.amountRaised,
            campaign.funding.currency
          )
        );
      }, 0);
      return amountRaised;
    };

    const getAmountDisbursed = () => {
      const amountDisbursed = fundingRequests.reduce(
        (accumulator, fundingRequest) => {
          return (
            accumulator +
            convertToPounds(
              fundingRequest.disbursement.amount,
              fundingRequest.disbursement.currency
            )
          );
        },
        0
      );
      return amountDisbursed;
    };

    const overview = {
      campaignCount: campaigns.length,
      usersCount,
      donationsCount,
      campaignOrganizersCount: getCampaignOrganizers(),
      countries: await getCountries(),
      amountRaised: getAmountRaised(),
      amountDisbursed: getAmountDisbursed(),
    };

    return res.status(200).json({
      data: overview,
    });
  } catch (error) {
    logger.error({ err: error }, "getOverviewDetails failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.getChartDetails = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    let startDate;
    let endDate;
    try {
      const parsed =
        typeof req.query.dateFilter === "string"
          ? JSON.parse(req.query.dateFilter)
          : req.query.dateFilter;
      startDate = parsed.startDate;
      endDate = parsed.endDate;
    } catch (e) {
      logger.warn({ err: e }, "Could not parse dateFilter JSON");
      return res.status(400).json({ status: 400, error: "Invalid dateFilter" });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ status: 400, error: "startDate and endDate are required" });
    }
    const start = new Date(new Date(startDate).setHours(0, 0, 0));
    const end = new Date(new Date(endDate).setHours(23, 59, 59));
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ status: 400, error: "Invalid date range" });
    }

    const donations = await Donations.find({
      createdAt: {
        $gte: start,
        $lt: end,
      },
      "refund.status": { $ne: "succeeded" },
    }).maxTimeMS(3000);

    const fields = {
      "funding.accountName": 0,
      "funding.accountNumber": 0,
      "funding.sortCode": 0,
      "funding.bankName": 0,
    };

    const campaigns = await Promise.all(
      donations.map(async (donation) => {
        const campaign = await Campaign.findById(donation.campaignId)
          .select(fields)
          .maxTimeMS(3000);
        if (!campaign) return null;
        return {
          ...campaign._doc,
          donation: convertToPounds(
            donation.amount,
            campaign.funding.currency
          ),
        };
      })
    );

    const filteredCampaigns = campaigns.filter(Boolean);

    const categories = await Promise.all(
      filteredCampaigns.map(async (campaign) => {
        return {
          category: campaign.category,
          donations: campaign.donation,
        };
      })
    );

    let finalCategories = [];
    let uniqueCategories = [];

    async function getCategories() {
      categories.forEach((presentCategory) => {
        if (uniqueCategories.includes(presentCategory.category)) {
          finalCategories.forEach((finalCategory) => {
            if (finalCategory.category == presentCategory.category) {
              finalCategory.donations += presentCategory.donations;
            }
          });
        } else {
          finalCategories.push(presentCategory);
          uniqueCategories.push(presentCategory.category);
        }
      });

      return finalCategories.sort((a, b) =>
        a.category > b.category ? 1 : -1
      );
    }

    const finalData = await getCategories();
    logger.debug({ data: finalData }, "Chart data aggregated");
    return res.status(200).json({
      data: finalData,
    });
  } catch (error) {
    logger.error({ err: error }, "getChartDetails failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.getAllCampaigns = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    let query = {};
    let sort = { _id: -1 };
    if (req.query.queries) {
      try {
        const parsed =
          typeof req.query.queries === "string"
            ? JSON.parse(req.query.queries)
            : req.query.queries;
        if (parsed.query && typeof parsed.query === "object" && !Array.isArray(parsed.query)) {
          query = parsed.query;
        } else if (parsed.queries && typeof parsed.queries === "object" && !Array.isArray(parsed.queries)) {
          query = parsed.queries;
        }
        if (parsed.sort && typeof parsed.sort === "object" && !Array.isArray(parsed.sort)) {
          sort = parsed.sort;
        }
      } catch (e) {
        logger.warn({ err: e }, "Could not parse queries JSON");
      }
    }

    const page = Math.max(parseInt(req.params.query, 10) || 1, 1);
    const count = await Campaign.countDocuments({
      launched: true,
      ...query,
    }).maxTimeMS(3000);
    const fields = {
      "funding.accountName": 0,
      "funding.accountNumber": 0,
      "funding.sortCode": 0,
      "funding.bankName": 0,
    };
    const campaigns = await Campaign.find({ launched: true, ...query })
      .select(fields)
      .sort(sort)
      .skip((page - 1) * 10)
      .limit(10)
      .maxTimeMS(3000);
    if (!campaigns) {
      return res.status(200).json({ data: { campaigns: [], count: 0 } });
    }
    return res.status(200).json({
      data: { campaigns: campaigns, count: count },
    });
  } catch (error) {
    logger.error({ err: error }, "getAllCampaigns failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.getSingleCampaign = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid Campaign ID" });
    }
    const [camp, donations, fundingRequests] = await Promise.all([
      Campaign.findById(id).maxTimeMS(3000),
      Donations.find({
        campaignId: id,
        "refund.status": { $ne: "succeeded" },
      }).maxTimeMS(3000),
      FundingRequests.find({
        campaignId: id,
      })
        .sort({
          _id: "desc",
        })
        .maxTimeMS(3000),
    ]);

    if (!camp) {
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }

    const organizerDetails = await Users.findById(camp.organizerId).maxTimeMS(3000);
    const campaign = {
      ...camp._doc,
      donations: donations,
      fundingRequests: fundingRequests,
      organizerDetails,
    };

    return res.status(200).json({
      data: campaign,
    });
  } catch (error) {
    logger.error({ err: error }, "getSingleCampaign failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.sendUserMail = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const { email, message, userName } = req.body;
    if (!email || !message) {
      return res.status(400).json({ status: 400, error: "email and message are required" });
    }
    await sendUserMailService(email, message, userName);
    return res.status(200).json({
      data: "Message Sent",
    });
  } catch (error) {
    logger.error({ err: error }, "sendUserMail failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.suspendCampaign = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const { organizerEmail, message, organizerName, campaignTitle } =
      req.body;
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid Campaign ID" });
    }
    const fields = {
      "funding.accountName": 0,
      "funding.accountNumber": 0,
      "funding.sortCode": 0,
      "funding.bankName": 0,
    };
    const campaign = await Campaign.findById(id).select(fields).maxTimeMS(3000);
    if (!campaign) {
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }
    campaign.suspended = true;
    const profile = req.auth.profile || req.auth;
    const admin = req.admin || profile;
    const activity = {
      date: Date.now(),
      AdminId: admin._id || admin.id,
      AdminName: `${admin.firstName || profile.firstName || ""} ${admin.lastName || profile.lastName || ""}`.trim() || "Admin",
      action: "suspension",
    };
    campaign.adminActivities = [...campaign.adminActivities, activity];
    await campaign.save();
    await suspendCampaignMailService(
      organizerEmail,
      message,
      organizerName,
      campaignTitle
    );
    return res.status(200).json({
      data: "Campaign Suspended",
    });
  } catch (error) {
    logger.error({ err: error }, "suspendCampaign failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.unsuspendCampaign = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const { organizerEmail, message, organizerName, campaignTitle } =
      req.body;
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid Campaign ID" });
    }
    const fields = {
      "funding.accountName": 0,
      "funding.accountNumber": 0,
      "funding.sortCode": 0,
      "funding.bankName": 0,
    };
    const campaign = await Campaign.findById(id).select(fields).maxTimeMS(3000);
    if (!campaign) {
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }
    campaign.suspended = false;
    const profile = req.auth.profile || req.auth;
    const admin = req.admin || profile;
    const activity = {
      date: Date.now(),
      AdminId: admin._id || admin.id,
      AdminName: `${admin.firstName || profile.firstName || ""} ${admin.lastName || profile.lastName || ""}`.trim() || "Admin",
      action: "unsuspension",
    };
    campaign.adminActivities = [...campaign.adminActivities, activity];
    await campaign.save();
    await unsuspendCampaignMailService(
      organizerEmail,
      message,
      organizerName,
      campaignTitle
    );
    return res.status(200).json({
      data: "Campaign unsuspended",
    });
  } catch (error) {
    logger.error({ err: error }, "unsuspendCampaign failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.search = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const { category } = req.params;
    if (!category || typeof category !== "string" || !category.trim()) {
      return res.status(400).json({ status: 400, error: "Category is required" });
    }
    const normalized = category.toLowerCase().trim();
    const fields = {
      "funding.accountName": 0,
      "funding.accountNumber": 0,
      "funding.sortCode": 0,
      "funding.bankName": 0,
    };
    const campaigns = await Campaign.find({
      category: normalized,
      launched: true,
    })
      .select(fields)
      .maxTimeMS(3000);

    return res.status(200).json({
      status: "successful",
      data: campaigns,
    });
  } catch (error) {
    logger.error({ err: error }, "search failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
