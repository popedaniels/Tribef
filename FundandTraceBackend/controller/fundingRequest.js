const mongoose = require("mongoose");
const { Campaign } = require("../models/campaignModel");
const { Donations } = require("../models/donationsModel");
const { FundingRequests } = require("../models/fundingRequestModel");
const { Users } = require("../models/users");
const { addActivity } = require("../services/activityLog");
const { encrypt } = require("../utility/encryption");
const logger = require("../utility/logger");

exports.addFundingRequest = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    const fundingrequestBody = req.body.fundingRequest;

    if (!fundingrequestBody) {
      return res.status(400).json({ status: 400, error: "fundingRequest is required" });
    }

    // Check if campaign is frozen due to active dispute
    if (fundingrequestBody.campaignId && mongoose.Types.ObjectId.isValid(fundingrequestBody.campaignId)) {
      const campaign = await Campaign.findById(fundingrequestBody.campaignId).maxTimeMS(3000);
      if (campaign?.disputeGovernance?.isLocked) {
        return res.status(403).json({
          status: 403,
          error: "Campaign is currently frozen under active dispute review. Funding requests cannot be submitted.",
        });
      }
    }

    if (fundingrequestBody.fundingType === "thirdParty") {
      if (fundingrequestBody.thirdPartyAccountName) {
        fundingrequestBody.thirdPartyAccountName = encrypt(
          fundingrequestBody.thirdPartyAccountName
        );
      }
      if (fundingrequestBody.thirdPartyAccountNumber) {
        fundingrequestBody.thirdPartyAccountNumber = encrypt(
          fundingrequestBody.thirdPartyAccountNumber
        );
      }
      if (fundingrequestBody.thirdPartyBankName) {
        fundingrequestBody.thirdPartyBankName = encrypt(
          fundingrequestBody.thirdPartyBankName
        );
      }
      if (fundingrequestBody.thirdPartyNameOfRef) {
        fundingrequestBody.thirdPartyNameOfRef = encrypt(
          fundingrequestBody.thirdPartyNameOfRef
        );
      }
      if (fundingrequestBody.thirdPartyContact) {
        fundingrequestBody.thirdPartyContact = encrypt(
          fundingrequestBody.thirdPartyContact
        );
      }
    }

    // Encrypt Direct-to-Vendor bank details if provided
    if (fundingrequestBody.vendorDisbursement?.bankDetails) {
      const bDetails = fundingrequestBody.vendorDisbursement.bankDetails;
      if (bDetails.accountNumber) bDetails.accountNumber = encrypt(bDetails.accountNumber);
      if (bDetails.accountName) bDetails.accountName = encrypt(bDetails.accountName);
      if (bDetails.routingOrSortCode) bDetails.routingOrSortCode = encrypt(bDetails.routingOrSortCode);
      if (bDetails.swiftOrIban) bDetails.swiftOrIban = encrypt(bDetails.swiftOrIban);
    }

    const fundingRequest = new FundingRequests(fundingrequestBody);

    await fundingRequest.save();
    const Organizer = await Users.findById(req.body.fundingRequest.organizerId).maxTimeMS(3000);
    if (Organizer?._id) {
      addActivity("fundingRequest", Organizer._id);
    }
    return res.status(200).json({
      status: "Request Created",
      data: fundingRequest,
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.getAllFundingRequests = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        status: "Request found",
        data: [],
      });
    }
    const fundingRequest = await FundingRequests.find({})
      .select(
        "-thirdPartyAccountNumber -thirdPartyAccountName -thirdPartyBankName -thirdPartyNameOfRef -thirdPartyContact -disbursement"
      )
      .sort({ _id: "desc" })
      .limit(100)
      .maxTimeMS(3000);
    return res.status(200).json({
      status: "Request found",
      data: fundingRequest,
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(200).json({ status: "Request found", data: [] });
  }
};

exports.getAllCampaignFundingRequests = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid Campaign ID" });
    }
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ status: "Request found", data: [] });
    }
    const fundingRequest = await FundingRequests.find({
      campaignId: id,
    })
      .select(
        "-thirdPartyAccountNumber -thirdPartyAccountName -thirdPartyBankName -thirdPartyNameOfRef -thirdPartyContact -disbursement"
      )
      .sort({ _id: "desc" })
      .maxTimeMS(3000);

    if (!fundingRequest) {
      return res.status(404).json({
        status: 404,
        error: "Fundings Not found!",
      });
    }
    return res.status(200).json({
      status: "Request found",
      data: fundingRequest,
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.getAllUserFundingRequests = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(500).json({ status: 500, error: "Invalid Organizer ID" });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ status: "Request found", data: [] });
    }
    const fundingRequest = await FundingRequests.find({
      organizerId: id,
    })
      .select(
        "-thirdPartyAccountNumber -thirdPartyAccountName -thirdPartyBankName -thirdPartyNameOfRef -thirdPartyContact -disbursement"
      )
      .sort({ _id: "desc" })
      .maxTimeMS(3000);

    return res.status(200).json({
      status: "Request found",
      data: fundingRequest,
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.getSingleFundingRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(500).json({ status: 500, error: "Invalid Funding Request ID" });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(404).json({
        status: 404,
        error: "Funding Not found!",
      });
    }

    const fundingRequest = await FundingRequests.findOne({
      _id: id,
    })
      .select(
        "-thirdPartyAccountNumber -thirdPartyAccountName -thirdPartyBankName -thirdPartyNameOfRef -thirdPartyContact -disbursement"
      )
      .maxTimeMS(3000);
    if (!fundingRequest) {
      return res.status(404).json({
        status: 404,
        error: "Funding Not found!",
      });
    }
    return res.status(200).json({
      status: "Request found",
      data: fundingRequest,
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.trackingFunction = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid Campaign ID" });
    }
    const [allFundingRequests, approvedFundingRequests, campaign, donations] =
      await Promise.all([
        FundingRequests.find({ campaignId: id }).sort({
          _id: "desc",
        }).maxTimeMS(3000),
        FundingRequests.find({
          campaignId: id,
          status: "Approved",
          disbursement: { $ne: null },
        }).sort({ _id: "desc" }).maxTimeMS(3000),
        Campaign.findById(id).maxTimeMS(3000),
        Donations.find({
          campaignId: id,
          "refund.status": { $ne: "succeeded" },
        }).maxTimeMS(3000),
      ]);

    if (!campaign) {
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }

    const user = await Users.findById(campaign.organizerId).maxTimeMS(3000);

    if (!user) {
      return res.status(404).json({
        status: 404,
        error: "User Not found!",
      });
    }
    return res.status(200).json({
      status: 200,
      data: {
        allFundingRequests,
        approvedFundingRequests,
        campaign: { ...campaign._doc, donations: donations },
        user,
      },
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
