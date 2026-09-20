const { Campaign } = require("../models/campaignModel");
const { Donations } = require("../models/donationsModel");
const { Credentials, Users } = require("../models/users");
const { addActivity } = require("../services/activityLog");
const { FundingRequests } = require("../models/fundingRequestModel");
const {
  declinedFundingRequestMailService,
} = require("../services/declinedFundingRequest");
const { default: axios } = require("axios");
const { decrypt } = require("../utility/encryption");
const logger = require("../utility/logger");

exports.getAllFundingRequests = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    let sort = { _id: -1 };
    let queries = {};
    if (req.query.queries) {
      try {
        const parsed = typeof req.query.queries === "string" ? JSON.parse(req.query.queries) : req.query.queries;
        if (parsed.sort && typeof parsed.sort === "object") sort = parsed.sort;
        if (parsed.queries && typeof parsed.queries === "object") queries = parsed.queries;
        else if (parsed.query && typeof parsed.query === "object") queries = parsed.query;
      } catch (e) {
        logger.warn({ err: e }, "Could not parse queries JSON");
      }
    }
    const page = Math.max(parseInt(req.params.query, 10) || 1, 1);
    const count = await FundingRequests.countDocuments(queries).maxTimeMS(3000);
    const fundingRequests = await FundingRequests.find(queries)
      .select(
        "-thirdPartyAccountNumber -thirdPartyAccountName -thirdPartyBankName -thirdPartyNameOfRef -thirdPartyContact -disbursement"
      )
      .sort(sort)
      .skip((page - 1) * 10)
      .limit(10)
      .maxTimeMS(3000);

    if (!fundingRequests) {
      return res.status(404).json({ status: 404, error: "Not found" });
    }

    const allFundingRequests = await Promise.all(
      fundingRequests.map(async (fundingRequest) => {
        const camp = await Campaign.findOne({
          _id: fundingRequest.campaignId,
          launched: true,
        }).maxTimeMS(3000);

        return {
          fundingRequest,
          campaign: camp,
        };
      })
    );

    return res.status(200).json({
      data: { fundingRequests: allFundingRequests, count: count },
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({
      status: 500,
      error: error.kind == "ObjectId" ? "Invalid Id" : "Server error.",
    });
  }
};

exports.getSingleFundingRequests = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const fundingRequest = await FundingRequests.findOne({
      _id: req.params.id,
    }).maxTimeMS(3000);
    if (!fundingRequest) {
      return res.status(404).json({ status: 404, error: "Funding request not found" });
    }
    if (fundingRequest.fundingType === "thirdParty") {
      // Decrypt only if values exist and look encrypted
      try {
        fundingRequest.thirdPartyAccountName = decrypt(fundingRequest.thirdPartyAccountName);
        fundingRequest.thirdPartyAccountNumber = decrypt(fundingRequest.thirdPartyAccountNumber);
        fundingRequest.thirdPartyBankName = decrypt(fundingRequest.thirdPartyBankName);
        fundingRequest.thirdPartyNameOfRef = decrypt(fundingRequest.thirdPartyNameOfRef);
        fundingRequest.thirdPartyContact = decrypt(fundingRequest.thirdPartyContact);
      } catch (decryptErr) {
        logger.warn({ err: decryptErr }, "Failed to decrypt thirdParty fields");
      }
    }
    const campaign = await Campaign.findById(fundingRequest.campaignId).maxTimeMS(3000);

    const funding = { ...fundingRequest._doc, campaign: campaign };

    return res.status(200).json({
      data: funding,
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.approveFundingRequest = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const profile = req.auth.profile || req.auth;
    const fundingRequest = await FundingRequests.findOne({
      _id: req.params.id,
    });

    if (!fundingRequest) {
      return res.status(404).json({ status: 404, error: "Funding request not found" });
    }

    if (fundingRequest.status != "Pending") {
      return res
        .status(402)
        .json({ status: 402, error: "Request has been attended to" });
    }
    fundingRequest.status = "Approved";
    fundingRequest.approvedAt = Date.now();
    fundingRequest.declineReason = "";
    fundingRequest.adminId = profile._id || profile.id;
    fundingRequest.adminName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "Admin";
    await fundingRequest.save();

    const campaign = await Campaign.findOne({ _id: fundingRequest.campaignId });

    if (!campaign) {
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }

    const data = {
      campaignId: fundingRequest.campaignId,
      amount: fundingRequest.amount,
      currency: fundingRequest.currency,
      bankName:
        fundingRequest.fundingType === "thirdParty"
          ? decrypt(fundingRequest.thirdPartyBankName)
          : decrypt(campaign.funding.bankName),
      accountName:
        fundingRequest.fundingType === "thirdParty"
          ? decrypt(fundingRequest.thirdPartyAccountName)
          : decrypt(campaign.funding.accountName),
      accountNumber:
        fundingRequest.fundingType === "thirdParty"
          ? decrypt(fundingRequest.thirdPartyAccountNumber)
          : decrypt(campaign.funding.accountNumber),
    };
    try {
      await axios.post(
        `${process.env.BACKENDURL}/api/donations/stripeWebhook/${req.params.id}`,
        { ...data },
        {
          headers: {
            "x-internal-webhook-secret": process.env.INTERNAL_WEBHOOK_SECRET,
          },
          timeout: 5000,
        }
      );

      return res.status(200).json({
        status: " success",
        data: "Request approved",
      });
    } catch (error) {
      logger.error({ err: error.response?.data || error.message }, "Disbursement webhook failed");
      // Roll back approval so admin can retry
      fundingRequest.status = "Pending";
      fundingRequest.approvedAt = undefined;
      await fundingRequest.save().catch(() => {});
      const status = error.response?.data?.status || 502;
      const errMsg = error.response?.data?.error || "Disbursement service unavailable";
      return res.status(status).json({
        status: status,
        error: errMsg,
      });
    }
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.declineFundingRequest = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const fundingRequest = await FundingRequests.findOne({
      _id: req.params.id,
    });
    if (!fundingRequest) {
      return res.status(404).json({ status: 404, error: "Funding request not found" });
    }
    fundingRequest.status = "Declined";
    fundingRequest.declinedAt = Date.now();
    fundingRequest.declineReason = req.body.message || "Declined by admin";
    await fundingRequest.save();
    const user = await Users.findOne({ _id: req.body.organizerId });

    if (user) {
      await declinedFundingRequestMailService(
        user,
        fundingRequest,
        req.body.message
      ).catch((mailErr) => logger.warn({ err: mailErr }, "Decline mail failed"));
    }

    return res.status(200).json({
      status: " success",
      data: "Request Declined",
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
