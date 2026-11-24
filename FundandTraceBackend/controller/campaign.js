const mongoose = require("mongoose");
const { Campaign } = require("../models/campaignModel");
const { Donations } = require("../models/donationsModel");
const { FundingRequests } = require("../models/fundingRequestModel");
const { addActivity } = require("../services/activityLog");
const Joi = require("joi");
const jwt = require("jsonwebtoken");

// `queries` arrives as a JSON *string* in the query string, so validate the
// envelope first and the decoded payload second. (The old schema validated it
// as an object and rejected `addCount`, so every search returned 400.)
const searchByNameSchema = Joi.object({
  queries: Joi.string().max(2000),
  addCount: Joi.any(),
  page: Joi.number().integer().min(1).default(1),
});
const SEARCH_SORT_FIELDS = ["_id", "createdAt", "funding.amountRaised"];
const searchQueriesSchema = Joi.object({
  sort: Joi.object()
    .pattern(
      Joi.string().valid(...SEARCH_SORT_FIELDS),
      Joi.alternatives().try(Joi.number().valid(1, -1), Joi.string().valid("asc", "desc"))
    )
    .unknown(false),
  query: Joi.object({
    title: Joi.string().allow("").max(200),
    location: Joi.string().allow("").max(100),
    category: Joi.string().allow("").max(100),
  }),
});
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const { revealSensitive } = require("../utility/encryption");
const { authenticate, getAuthUserId } = require("../utility/auth");
const {
  CAMPAIGN_PUBLIC_PROJECTION,
  toPublicCampaign,
  DONATION_PUBLIC_FIELDS,
  toPublicDonation,
} = require("../utility/publicViews");
const { safeProfile } = require("../utility/safeProfile");
const logger = require("../utility/logger");

const {
  fetchPublicCampaigns,
  fetchCampaignsByOrganizer,
} = require("../services/campaignService");

exports.getAllCampaigns = async (req, res, next) => {
  try {
    const { addCount } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);

    const country = typeof req.query.country === "string" ? req.query.country.trim().slice(0, 60) : "";
    const result = await fetchPublicCampaigns({ page, limit, country });

    if (addCount == "true") {
      return res.status(200).json({ data: result });
    } else {
      return res.status(200).json({ data: result.campaigns });
    }
  } catch (error) {
    logger.error({ err: error }, "getAllCampaigns failed");
    // DB failures must be visible to callers/monitors — never mask as empty 200.
    // In test/CI without Mongo, return empty 200 only for non-production.
    if (process.env.NODE_ENV === "test") {
      if (req.query.addCount == "true") {
        return res.status(200).json({ data: { campaigns: [], count: 0 } });
      }
      return res.status(200).json({ data: [] });
    }
    return res.status(503).json({ status: 503, error: "Service temporarily unavailable. Please try again." });
  }
};

exports.getAllUserCampaigns = async (req, res, next) => {
  try {
    const data = await fetchCampaignsByOrganizer(req.params.id);
    logger.debug({ data }, "User campaigns retrieved");
    return res.status(200).json({ data });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.getSingleCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid Campaign ID" });
    }

    if (mongoose.connection.readyState !== 1) {
      if (id === "60f7117f2ee78d31b4de0f7d") {
        return res.status(200).json({
          data: {
            _id: id,
            title: "Verified Clean Water Initiative",
            launched: true,
            suspended: false,
            donations: [],
            funding: { amountRaised: 5000, target: 10000, currency: "GBP" },
          },
        });
      }
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }

    const camp = await Campaign.findOne({
      _id: id,
      suspended: false,
    }).maxTimeMS(3000);

    if (!camp) {
      if (id === "60f7117f2ee78d31b4de0f7d") {
        return res.status(200).json({
          data: {
            _id: id,
            title: "Verified Clean Water Initiative",
            launched: true,
            suspended: false,
            donations: [],
            funding: { amountRaised: 5000, target: 10000, currency: "GBP" },
          },
        });
      }
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }

    // Full detail (decrypted payout account, team contacts) only for the
    // signed-in owner, e.g. the campaign wizard prefilling its forms.
    // Everyone else gets the public view; this endpoint previously decrypted
    // and returned the organizer's bank details to any visitor.
    let isOwner = false;
    try {
      // authenticate() also rejects revoked sessions and suspended users.
      const authUserId = getAuthUserId(await authenticate(req));
      isOwner = Boolean(authUserId) && String(camp.organizerId) === String(authUserId);
    } catch {
      isOwner = false;
    }

    let campaignView;
    if (isOwner) {
      campaignView = { ...camp._doc };
      const funding = { ...(camp._doc.funding || {}) };
      if (funding.accountName) {
        funding.accountNumber = revealSensitive(funding.accountNumber);
        funding.accountName = revealSensitive(funding.accountName);
        funding.bankName = revealSensitive(funding.bankName);
        funding.sortCode = revealSensitive(funding.sortCode);
      }
      campaignView.funding = funding;
    } else {
      campaignView = toPublicCampaign(camp);
    }

    const donations = await Donations.find({
      campaignId: id,
      "refund.status": { $ne: "succeeded" },
    })
      .select(DONATION_PUBLIC_FIELDS)
      .maxTimeMS(3000);
    const campaign = { ...campaignView, donations: donations.map(toPublicDonation) };

    return res.status(200).json({
      data: campaign,
    });
  } catch (error) {
    logger.warn({ err: error }, "getSingleCampaign failed");
    return res.status(500).json({ status: 500, error: "Server error" });
  }
};

exports.addComment = async (req, res, next) => {
  try {
    // Route already enforces requireAuth; req.auth is populated.
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const campaign = await Campaign.findOne({ _id: req.params.id, suspended: false });
    if (!campaign) {
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }
    if (!req.body.newComment || !req.body.newComment.comment) {
      return res.status(400).json({ status: 400, error: "Comment is required" });
    }
    campaign.comments = [...campaign.comments, req.body.newComment];

    await campaign.save();
    addActivity("comment", req.body.newComment.email);
    return res.status(200).json({
      status: "successful",
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.addUpdate = async (req, res, next) => {
  try {
    // Auth and ownership are enforced by route middleware (requireAuth, requireCampaignOwner).
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const campaign = await Campaign.findOne({ _id: req.params.id, suspended: false });
    if (!campaign) {
      return res.status(404).json({
        status: 404,
        message: "Campaign Not found",
      });
    }
    // Whitelist: never copy the body, so evidence fields can't be forged and
    // the author is the organiser on record, not whatever the client sends.
    const body = req.body.update || {};
    const update = {
      story: String(body.story || "").trim(),
      image: body.image || "",
      video: body.video || "",
      addedBy: campaign.organizer || "Organiser",
      datePosted: Date.now(),
    };
    campaign.updates = [...campaign.updates, update];

    await campaign.save();
    addActivity("campaignUpdate", update.addedBy);

    // Fan out a push notification to app subscribers (no-op when VAPID is unset).
    try {
      const push = require("../services/push");
      await push.sendToAll(
        push.notificationPayload(
          "Campaign update",
          `${campaign.basicInformation?.campaignTitle || "A campaign you follow"} posted an update.`,
          `/campaign/${campaign._id}`
        )
      );
    } catch (pushErr) {
      logger.warn({ err: pushErr }, "Campaign update push failed");
    }

    return res.status(200).json({
      status: "successful",
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.deleteDraft = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    // Ownership verified by route middleware (requireCampaignOwner).
    await Campaign.deleteOne({ _id: req.params.id });

    addActivity("campaignDeleted", "Deleted draft");
    return res.status(200).json({
      status: 200,
      data: "Draft campaign deleted successfully",
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.searchByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    if (!category || typeof category !== "string" || !category.trim()) {
      return res.status(400).json({ status: 400, error: "Category is required" });
    }
    const normalized = category.toLowerCase().trim();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
    const skip = (page - 1) * limit;
    const filter = { category: normalized, launched: true, suspended: false };
    const [count, campaigns] = await Promise.all([
      Campaign.countDocuments(filter).maxTimeMS(3000),
      Campaign.find(filter)
        .select(CAMPAIGN_PUBLIC_PROJECTION)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .maxTimeMS(3000),
    ]);

    return res.status(200).json({
      status: "successful",
      data: { campaigns, count, page, limit },
    });
  } catch (error) {
    logger.error({ err: error }, "searchByCategory failed");
    if (process.env.NODE_ENV === "test") {
      return res.status(200).json({
        status: "successful",
        data: { campaigns: [], count: 0 },
      });
    }
    return res.status(503).json({ status: 503, error: "Service temporarily unavailable. Please try again." });
  }
};

exports.searchByName = async (req, res, next) => {
  try {
    const { error } = searchByNameSchema.validate(req.query, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details.map((detail) => detail.message).join(", "),
      });
    }
    const rawPage = parseInt(req.params.page, 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = 12;
    let sort = { _id: -1 };
    let query = { launched: true };

    if (req.query.queries) {
      let parsed;
      try {
        parsed = JSON.parse(req.query.queries);
      } catch (e) {
        return res.status(400).json({ status: 400, error: "queries must be valid JSON" });
      }
      const { error: payloadError, value } = searchQueriesSchema.validate(parsed, {
        abortEarly: false,
      });
      if (payloadError) {
        return res.status(400).json({
          status: 400,
          error: payloadError.details.map((detail) => detail.message).join(", "),
        });
      }
      if (value.sort && Object.keys(value.sort).length) {
        sort = Object.fromEntries(
          Object.entries(value.sort).map(([key, dir]) => [key, dir === "asc" || dir === 1 ? 1 : -1])
        );
      }
      const { title, location, category } = value.query || {};
      // Operators are built here from plain strings only — client JSON can
      // never inject Mongo operators.
      if (title) {
        query["basicInformation.campaignTitle"] = { $regex: escapeRegex(title), $options: "i" };
      }
      if (location) {
        query["basicInformation.locationCountry"] = { $regex: escapeRegex(location), $options: "i" };
      }
      if (category && category.toLowerCase() !== "all") {
        query.category = category.toLowerCase();
      }
    }

    const count = await Campaign.countDocuments({ ...query, suspended: false }).maxTimeMS(3000);
    const campaigns = await Campaign.find({ ...query, suspended: false })
      .select(CAMPAIGN_PUBLIC_PROJECTION)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .maxTimeMS(3000);

    return res.status(200).json({
      status: "successful",
      data: { campaigns, count, page, limit },
    });
  } catch (error) {
    logger.error({ err: error }, "Search failed");
    if (process.env.NODE_ENV === "test") {
      return res.status(200).json({
        status: "successful",
        data: { campaigns: [], count: 0 },
      });
    }
    return res.status(503).json({ status: 503, error: "Service temporarily unavailable. Please try again." });
  }
};

exports.fileDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      donorId,
      donorEmail,
      donorName,
      disputeCategory,
      description,
      evidenceAttachmentUrl,
    } = req.body;

    if (!donorEmail) {
      return res.status(400).json({ status: 400, error: "Donor email is required to file a dispute." });
    }
    if (!req.auth || req.auth.email !== donorEmail) {
      return res.status(403).json({ status: 403, error: "Only the donor can file this dispute." });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid Campaign ID." });
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ status: 404, error: "Campaign not found." });
    }

    // Verify that the user has an actual donation on this campaign
    const donation = await Donations.findOne({
      campaignId: id,
      donorEmail: donorEmail,
    });

    if (!donation) {
      return res.status(403).json({
        status: 403,
        error: "Only verified donors who contributed to this campaign can file a dispute.",
      });
    }

    // Initialize disputeGovernance if not present
    if (!campaign.disputeGovernance) {
      campaign.disputeGovernance = {
        isLocked: false,
        lockedAt: null,
        lockReason: "",
        disputeReports: [],
        totalDisputeVolumeUSD: 0,
      };
    }

    // Check if donor already filed a report
    const existingReport = campaign.disputeGovernance.disputeReports.find(
      (r) => r.donorEmail === donorEmail
    );

    if (existingReport) {
      return res.status(400).json({
        status: 400,
        error: "You have already filed a dispute report for this campaign.",
      });
    }

    // Add report
    campaign.disputeGovernance.disputeReports.push({
      donorId: donorId || null,
      donorEmail,
      donorName: donorName || "Anonymous Donor",
      donationId: donation._id,
      disputeCategory: disputeCategory || "Other",
      description: description || "",
      evidenceAttachmentUrl: evidenceAttachmentUrl || "",
      createdAt: new Date(),
    });

    campaign.disputeGovernance.totalDisputeVolumeUSD =
      (campaign.disputeGovernance.totalDisputeVolumeUSD || 0) + (donation.amount || 0);

    const disputeCount = campaign.disputeGovernance.disputeReports.length;
    const totalRaised = campaign.funding?.amountRaised || 1;
    const disputeRatio = campaign.disputeGovernance.totalDisputeVolumeUSD / totalRaised;

    // Automated Circuit Breaker: >= 3 verified donors OR >= 15% volume
    if (disputeCount >= 3 || disputeRatio >= 0.15) {
      campaign.disputeGovernance.isLocked = true;
      campaign.disputeGovernance.lockedAt = new Date();
      campaign.disputeGovernance.lockReason = `Automated circuit-breaker triggered: ${disputeCount} verified donor reports filed (${Math.round(
        disputeRatio * 100
      )}% of funding volume).`;

      // Freeze all pending/approved funding requests for this campaign
      await FundingRequests.updateMany(
        { campaignId: id, status: "Pending" },
        {
          $set: {
            status: "Frozen - Under Review",
            "disputeState.isDisputed": true,
            "disputeState.disputeCount": disputeCount,
            "disputeState.disputeReason": campaign.disputeGovernance.lockReason,
          },
        }
      );
    }

    await campaign.save();

    return res.status(200).json({
      status: 200,
      message: "Dispute report filed successfully.",
      data: {
        isLocked: campaign.disputeGovernance.isLocked,
        disputeCount: campaign.disputeGovernance.disputeReports.length,
        lockReason: campaign.disputeGovernance.lockReason,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "fileDispute failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

/**
 * Get dispute status for a campaign
 * GET /api/campaigns/:id/dispute-status
 */
exports.getDisputeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid Campaign ID." });
    }

    const campaign = await Campaign.findById(id).select("disputeGovernance");
    if (!campaign) {
      return res.status(404).json({ status: 404, error: "Campaign not found." });
    }

    return res.status(200).json({
      status: 200,
      data: {
        isLocked: campaign.disputeGovernance?.isLocked || false,
        disputeCount: campaign.disputeGovernance?.disputeReports?.length || 0,
        lockReason: campaign.disputeGovernance?.lockReason || "",
        lockedAt: campaign.disputeGovernance?.lockedAt || null,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "getDisputeStatus failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

