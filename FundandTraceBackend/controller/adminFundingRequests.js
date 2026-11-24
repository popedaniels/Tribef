const approvalPolicy = require("../services/payoutApproval");
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

// Destination checks for bank payouts that aren't to a verified vendor
// (vendors' accounts are checked when they join the network) or through
// Stripe Connect (Stripe verifies the account holder).
//  1. Organiser bank account changed recently -> wait out the cooldown.
//  2. Ask the payout provider whose account it is; the name must match the
//     organiser's verified ID name (or the named third party). A mismatch or a
//     failed lookup needs an admin override with a note, which is recorded.
async function checkPayoutDestination({ existing, campaign, body, admin }) {
  if (existing.vendorDisbursement?.vendorId) return {};
  const { railFor, resolveAccount } = require("../services/payoutRails");
  const { cooldownRemainingMs, cooldownHours } = require("../services/bankChange");
  const { namesMatch } = require("../utility/names");
  const thirdParty = isThirdParty(existing.fundingType);
  const currency = String(existing.currency || campaign.funding?.currency || "").toUpperCase();
  const connect = campaign.stripeConnect?.accountId && campaign.stripeConnect?.payoutsEnabled;
  if (!thirdParty && connect) return {};

  const bankCode = thirdParty ? existing.thirdPartyBankCode : campaign.funding?.bankCode;
  const accountNumber = thirdParty ? existing.thirdPartyAccountNumber : revealSensitive(campaign.funding?.accountNumber);
  if (!bankCode || !accountNumber || !railFor(currency)) return {}; // manual payment: checked by hand

  if (!thirdParty) {
    const wait = cooldownRemainingMs(campaign);
    if (wait > 0) {
      const hours = Math.ceil(wait / 3600e3);
      return {
        status: 423,
        error: {
          code: "bank_change_cooldown",
          error: `The organiser changed their payout bank account recently. Bank payouts resume in about ${hours} hour${hours === 1 ? "" : "s"} (${cooldownHours()}-hour hold).`,
        },
      };
    }
  }

  let expected = [];
  if (thirdParty) expected = [existing.thirdPartyAccountName, existing.thirdPartyNameOfRef];
  else {
    const organizer = await Users.findById(campaign.organizerId || existing.organizerId).select("firstName lastName identityVerification.nameOnId").lean();
    expected = [organizer?.identityVerification?.nameOnId, `${organizer?.firstName || ""} ${organizer?.lastName || ""}`];
  }
  expected = expected.map((n) => String(n || "").trim()).filter(Boolean);

  let resolvedName = "";
  let lookupError = "";
  try {
    resolvedName = (await resolveAccount({ bankCode, accountNumber })).accountName || "";
  } catch (err) {
    lookupError = err?.status === 503 ? "no payout provider configured for lookups" : "the provider couldn't find the account";
  }
  const matched = Boolean(resolvedName) && expected.some((n) => namesMatch(n, resolvedName));
  const record = { resolvedName, expected, matched, lookupError, at: new Date() };
  if (matched) return { record };

  const note = String(body.nameCheckOverride || "").trim().slice(0, 500);
  if (note.length >= 10) {
    const adminName = `${admin?.firstName || ""} ${admin?.lastName || ""}`.trim() || "Admin";
    logger.warn({ fundingRequestId: String(existing._id), resolvedName, expected, adminName }, "Payout name check overridden");
    return { record: { ...record, override: { note, adminId: String(admin?._id || ""), adminName } } };
  }
  return {
    status: 409,
    error: {
      code: "bank_name_mismatch",
      error: lookupError
        ? `Couldn't confirm who owns the account (${lookupError}). Check it another way and approve with a note.`
        : `The bank says this account belongs to "${resolvedName || "unknown"}", which doesn't match ${expected.map((n) => `"${n}"`).join(" or ") || "the expected name"}. Check it, then approve with a note if it's right.`,
      data: { resolvedName, expected },
    },
  };
}

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

    // Where the money is going: cooldown after a bank change, and the
    // provider's name for the account must match who should be paid.
    const destination = await checkPayoutDestination({ existing, campaign, body: req.body || {}, admin: req.admin });
    if (destination.error) return res.status(destination.status).json({ status: destination.status, ...destination.error });

    // Two-person rule: a large payout needs a second, different admin.
    const adminId = String(req.admin?._id || profile._id || profile.id || "");
    const adminName = `${req.admin?.firstName || profile.firstName || ""} ${req.admin?.lastName || profile.lastName || ""}`.trim() || "Admin";
    const payoutCurrency = existing.currency || campaign.funding?.currency;
    const dual = approvalPolicy.needsSecondApproval(existing.amount, payoutCurrency);
    if (dual) {
      const state = approvalPolicy.firstApprovalState(existing, adminId);
      if (state === "same_admin") {
        return res.status(409).json({ status: 409, code: "second_approver_required", error: "You've already approved this. A different admin has to give the second approval." });
      }
      if (state !== "other_admin") {
        // Record the first approval only (atomic: two admins clicking at once
        // can't both become "first").
        const first = await FundingRequests.findOneAndUpdate(
          { _id: req.params.id, status: "Pending", ...(state === "expired" ? {} : { $or: [{ "firstApproval.adminId": "" }, { "firstApproval.adminId": { $exists: false } }] }) },
          { $set: { firstApproval: { adminId, adminName, at: new Date() } } },
          { new: true }
        );
        if (!first) return res.status(409).json({ status: 409, error: "Someone else just reviewed this request. Reload and try again." });
        logger.info({ fundingRequestId: req.params.id, adminId, amount: existing.amount, currency: payoutCurrency }, "First payout approval recorded");
        return res.status(202).json({
          status: 202,
          code: "awaiting_second_approval",
          data: `First approval recorded. Over ${approvalPolicy.thresholdFor(payoutCurrency).toLocaleString("en-GB")} ${payoutCurrency}, a second admin must approve within ${approvalPolicy.TTL_HOURS()} hours before any money moves.`,
        });
      }
    }

    // Atomically claim Pending -> Approved. A double-click or two admins
    // approving at once can no longer both pass the status check and both
    // trigger a disbursement.
    const fundingRequest = await FundingRequests.findOneAndUpdate(
      { _id: req.params.id, status: "Pending", ...(dual ? { "firstApproval.adminId": { $nin: ["", adminId] } } : {}) },
      {
        $set: {
          status: "Approved",
          approvedAt: Date.now(),
          declineReason: "",
          adminId,
          adminName,
          ...(destination.record ? { bankNameCheck: destination.record } : {}),
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
        `${process.env.BACKENDURL}/api/donations/stripeWebhook/${encodeURIComponent(String(fundingRequest._id))}`,
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

// GET /api/admin/fundingRequest/:id/review — the checklist a reviewer needs
// before approving (services/payoutReview.js).
exports.reviewFundingRequest = async (req, res) => {
  try {
    if (!req.auth) return res.status(401).json({ status: 401, error: "Unauthorized" });
    const fr = await FundingRequests.findById(req.params.id).lean().maxTimeMS(3000);
    if (!fr) return res.status(404).json({ status: 404, error: "Funding request not found" });
    const campaign = await Campaign.findById(fr.campaignId)
      .select("basicInformation.campaignTitle organizer organizerId funding disputeGovernance stripeConnect")
      .lean()
      .maxTimeMS(3000);
    if (!campaign) return res.status(404).json({ status: 404, error: "Campaign not found" });
    const { Donations } = require("../models/donationsModel");
    const { evaluatePayout } = require("../services/payoutReview");
    const [organizer, history, total, flagged] = await Promise.all([
      Users.findById(campaign.organizerId || fr.organizerId).select("identityVerification suspended createdAt").lean(),
      FundingRequests.find({ campaignId: fr.campaignId })
        .select("_id status amount createdAt disbursement.dateDisbursed disbursement.receipt purposeOfFunding fundingType")
        .sort({ createdAt: 1 })
        .lean(),
      Donations.countDocuments({ campaignId: String(fr.campaignId) }),
      Donations.countDocuments({ campaignId: String(fr.campaignId), "fraud.flagged": true }),
    ]);
    const review = evaluatePayout({ fr, campaign, organizer, history, donations: { total, flagged } });
    return res.status(200).json({
      data: {
        ...review,
        campaign: {
          _id: campaign._id,
          title: campaign.basicInformation?.campaignTitle,
          organizer: campaign.organizer,
          currency: campaign.funding?.currency,
          raised: campaign.funding?.amountRaised,
          available: campaign.funding?.availableBalance,
          goal: campaign.funding?.amountExpected,
        },
        history: history.map((h) => ({
          _id: h._id,
          status: h.status,
          amount: h.amount,
          createdAt: h.createdAt,
          paidAt: h.disbursement?.dateDisbursed || null,
          hasReceipt: Boolean(h.disbursement?.receipt),
          purpose: String(h.purposeOfFunding || "").slice(0, 140),
          current: String(h._id) === String(fr._id),
        })),
      },
    });
  } catch (error) {
    logger.error({ err: error }, "reviewFundingRequest failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
