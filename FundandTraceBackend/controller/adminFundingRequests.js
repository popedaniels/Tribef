const { Campaign } = require("../models/campaignModel");
const { Donations } = require("../models/donationsModel");
const { Credentials, Users } = require("../models/users");
const { addActivity } = require("../services/activityLog");
const { FundingRequests } = require("../models/fundingRequestModel");
const {
  declinedFundingRequestMailService,
} = require("../services/declinedFundingRequest");
const { default: axios } = require("axios");
const { revealSensitive } = require("../utility/encryption");
const { isThirdParty } = require("../utility/fundingType");
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
    if (isThirdParty(fundingRequest.fundingType)) {
      // revealSensitive tolerates legacy plaintext records (see utility/fundingType.js)
      try {
        fundingRequest.thirdPartyAccountName = revealSensitive(fundingRequest.thirdPartyAccountName);
        fundingRequest.thirdPartyAccountNumber = revealSensitive(fundingRequest.thirdPartyAccountNumber);
        fundingRequest.thirdPartyBankName = revealSensitive(fundingRequest.thirdPartyBankName);
        fundingRequest.thirdPartyNameOfRef = revealSensitive(fundingRequest.thirdPartyNameOfRef);
        fundingRequest.thirdPartyContact = revealSensitive(fundingRequest.thirdPartyContact);
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

    const existing = await FundingRequests.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ status: 404, error: "Funding request not found" });
    }
    if (existing.status !== "Pending") {
      return res.status(409).json({ status: 409, error: "Request has already been reviewed" });
    }

    const campaign = await Campaign.findById(existing.campaignId);
    if (!campaign) {
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }
    // Dispute circuit-breaker: a locked campaign's escrow is frozen.
    if (campaign.disputeGovernance?.isLocked) {
      return res.status(423).json({
        status: 423,
        error: "Campaign escrow is frozen under active dispute review. Payouts are locked.",
      });
    }

    // KYC before payout (gap F-5): money only reaches a verified person.
    // Payments to a third party/vendor (hospital, school, supplier) are paid
    // to that institution, so they don't depend on the organiser's KYC.
    // Admins can verify manually via POST /api/identity/admin-verify/:userId.
    if (!isThirdParty(existing.fundingType) && process.env.REQUIRE_KYC_FOR_PAYOUT !== "false") {
      const organizer = await Users.findById(campaign.organizerId || existing.organizerId).select("identityVerification");
      if (organizer?.identityVerification?.status !== "verified") {
        return res.status(403).json({
          status: 403,
          code: "kyc_required",
          error: "The organiser must complete identity verification before funds can be paid to them.",
        });
      }
    }

    // Atomically claim Pending -> Approved. A double-click or two admins
    // approving at once can no longer both pass the status check and both
    // trigger a disbursement.
    const fundingRequest = await FundingRequests.findOneAndUpdate(
      { _id: req.params.id, status: "Pending" },
      {
        $set: {
          status: "Approved",
          approvedAt: Date.now(),
          declineReason: "",
          adminId: profile._id || profile.id,
          adminName: `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "Admin",
        },
      },
      { new: true }
    );
    if (!fundingRequest) {
      return res.status(409).json({ status: 409, error: "Request has already been reviewed" });
    }

    const thirdParty = isThirdParty(fundingRequest.fundingType);
    const source = thirdParty
      ? {
          bankName: fundingRequest.thirdPartyBankName,
          accountName: fundingRequest.thirdPartyAccountName,
          accountNumber: fundingRequest.thirdPartyAccountNumber,
          bankCode: fundingRequest.thirdPartyBankCode,
        }
      : {
          bankName: campaign.funding?.bankName,
          accountName: campaign.funding?.accountName,
          accountNumber: campaign.funding?.accountNumber,
          bankCode: campaign.funding?.bankCode,
        };
    const data = {
      campaignId: fundingRequest.campaignId,
      amount: fundingRequest.amount,
      currency: fundingRequest.currency,
      bankName: revealSensitive(source.bankName),
      accountName: revealSensitive(source.accountName),
      accountNumber: revealSensitive(source.accountNumber),
      bankCode: source.bankCode || "",
    };

    try {
      await axios.post(
        `${process.env.BACKENDURL}/api/donations/stripeWebhook/${req.params.id}`,
        { ...data },
        {
          headers: {
            "x-internal-webhook-secret": process.env.INTERNAL_WEBHOOK_SECRET,
          },
          timeout: 15000,
        }
      );

      return res.status(200).json({
        status: "success",
        data: "Request approved",
      });
    } catch (error) {
      logger.error({ err: error.response?.data || error.message }, "Disbursement webhook failed");
      // Roll back to Pending ONLY if nothing was disbursed. The previous code
      // saved a stale document here, which could reset an already-paid request
      // to Pending (e.g. when a post-payout email failed) and allow a second
      // payout on retry.
      await FundingRequests.updateOne(
        {
          _id: req.params.id,
          status: "Approved",
          "disbursement.dateDisbursed": null,
          payoutLockedAt: { $exists: false },
        },
        { $set: { status: "Pending" }, $unset: { approvedAt: 1, adminId: 1, adminName: 1 } }
      ).catch((rollbackErr) => logger.error({ err: rollbackErr }, "Approval rollback failed"));
      const status = Number(error.response?.data?.status) || 502;
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
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    // Only a Pending request can be declined; an approved/disbursed request
    // must never be silently flipped to Declined.
    const fundingRequest = await FundingRequests.findOneAndUpdate(
      { _id: req.params.id, status: "Pending" },
      {
        $set: {
          status: "Declined",
          declinedAt: Date.now(),
          declineReason: message || "Declined by admin",
        },
      },
      { new: true }
    );
    if (!fundingRequest) {
      const exists = await FundingRequests.exists({ _id: req.params.id });
      return exists
        ? res.status(409).json({ status: 409, error: "Request has already been reviewed" })
        : res.status(404).json({ status: 404, error: "Funding request not found" });
    }

    // Notify the request's actual organizer (not a client-supplied id).
    const user = await Users.findOne({ _id: fundingRequest.organizerId });
    if (user) {
      await declinedFundingRequestMailService(user, fundingRequest, message).catch((mailErr) =>
        logger.warn({ err: mailErr }, "Decline mail failed")
      );
    }

    return res.status(200).json({
      status: "success",
      data: "Request Declined",
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
