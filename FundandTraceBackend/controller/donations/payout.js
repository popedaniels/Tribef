// Funding-request disbursement via Stripe Express Connect.
// POST /api/donations/stripeWebhook/:fundingRequestId
const { CampaignEmailWhitelist } = require("../../models/campaignEmailWhitelist");
const {
  approvedFundingRequestMailService,
} = require("../../services/approvedFundingRequest");
const { fundingSummaryMailService } = require("../../services/fundingSummaryMail");
const { encrypt } = require("../../utility/encryption");
const { isThirdParty } = require("../../utility/fundingType");

const {
  Campaign,
  FundingRequests,
  addActivity,
  logger,
  stripe,
} = require("./shared");

exports.stripePayoutWebhook = async (req, res, next) => {
  let lockedRequestId = null;
  let reservedAmount = 0;
  let reservedCampaignId = null;
  let disbursed = false;

  // Undo the in-flight lock (and balance reservation) when a payout fails
  // before money moved, so an admin can safely retry.
  const release = async () => {
    if (disbursed) return;
    if (reservedAmount > 0 && reservedCampaignId) {
      await Campaign.updateOne(
        { _id: reservedCampaignId },
        { $inc: { "funding.availableBalance": reservedAmount } }
      ).catch((err) => logger.error({ err }, "Failed to release reserved balance"));
    }
    if (lockedRequestId) {
      await FundingRequests.updateOne(
        { _id: lockedRequestId, "disbursement.dateDisbursed": { $exists: false } },
        { $unset: { payoutLockedAt: 1 } }
      ).catch((err) => logger.error({ err }, "Failed to release payout lock"));
    }
  };

  try {
    logger.debug("stripePayoutWebhook called");
    const campaignId = String(req.body.campaignId || "");
    const currency = String(req.body.currency || "");

    // 1) Atomically claim the request. Only one concurrent/retried call can
    //    win; the rest get 409 instead of double-debiting the escrow ledger.
    const fundingRequest = await FundingRequests.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "Approved",
        campaignId,
        "disbursement.dateDisbursed": { $exists: false },
        payoutLockedAt: { $exists: false },
      },
      { $set: { payoutLockedAt: new Date() } },
      { new: true }
    );
    if (!fundingRequest) {
      return res.status(409).json({ status: 409, error: "Invalid or already processed funding request" });
    }
    lockedRequestId = fundingRequest._id;

    // The amount is the one the admin reviewed — never the caller's number.
    const amount = Number(fundingRequest.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      await release();
      return res.status(422).json({ status: 422, error: "Funding request has no valid amount" });
    }
    if (req.body.amount !== undefined && Number(req.body.amount) !== amount) {
      await release();
      return res.status(409).json({ status: 409, error: "Amount does not match the approved request" });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign || !campaign.funding) {
      await release();
      return res.status(422).json({ status: 422, error: "Insufficient campaign balance" });
    }
    if (campaign.disputeGovernance?.isLocked) {
      await release();
      return res.status(423).json({
        status: 423,
        error: "Campaign escrow is frozen under active dispute review. Payouts are locked.",
      });
    }
    if (currency && campaign.funding.currency && currency.toLowerCase() !== String(campaign.funding.currency).toLowerCase()) {
      await release();
      return res.status(422).json({ status: 422, error: "Currency mismatch" });
    }

    const thirdParty = isThirdParty(fundingRequest.fundingType);
    const connect = campaign.stripeConnect || {};
    const useConnect = Boolean(stripe && connect.accountId && connect.payoutsEnabled);
    if (stripe && !useConnect && !thirdParty) {
      // Without a connected account, organizer payouts are refused so the
      // escrow is never silently released to an unverified destination.
      await release();
      return res.status(422).json({
        status: 422,
        error: "Organizer must connect their Stripe payouts account before funds can be disbursed.",
      });
    }

    // 2) Reserve the balance BEFORE any money moves. Previously the Stripe
    //    transfer was created first, so a failed reservation left funds sent
    //    with no ledger entry.
    const balanceUpdate = await Campaign.updateOne(
      { _id: campaignId, "funding.availableBalance": { $gte: amount } },
      { $inc: { "funding.availableBalance": -amount } }
    );
    if (!balanceUpdate.nModified && !balanceUpdate.modifiedCount) {
      await release();
      return res.status(422).json({ status: 422, error: "Insufficient campaign balance" });
    }
    reservedAmount = amount;
    reservedCampaignId = campaignId;

    // 3) Move the money (idempotent per funding request at Stripe).
    let transfer = null;
    if (useConnect) {
      transfer = await stripe.transfers.create(
        {
          amount: Math.round(amount * 100),
          currency: (currency || campaign.funding.currency || "GBP").toLowerCase(),
          destination: connect.accountId,
          transfer_group: `funding-request-${req.params.id}`,
          metadata: {
            campaignId,
            fundingRequestId: req.params.id,
            source: "fundandtrace",
          },
        },
        { idempotencyKey: `funding-request-${req.params.id}` }
      );
      logger.info(
        { transferId: transfer.id, fundingRequestId: req.params.id, amount },
        "Stripe Connect transfer created for approved funding request"
      );
    }

    // 4) Record the disbursement. From here on the payout is final.
    fundingRequest.disbursement = {
      amount,
      currency: currency || campaign.funding.currency,
      bankName: encrypt(req.body.bankName || ""),
      accountName: encrypt(req.body.accountName || ""),
      accountNumber: encrypt(req.body.accountNumber || ""),
      dateDisbursed: Date.now(),
      receipt: "",
      stripeTransferId: transfer?.id || "",
      stripeTransferStatus: transfer?.status || "",
    };
    fundingRequest.payoutLockedAt = undefined;
    await fundingRequest.save();
    disbursed = true;
    addActivity("Disbursement Approved", req.params.id);

    // 5) Notify whitelisted donors. Best-effort: a mail failure must never
    //    turn a completed payout into an error response (the approver would
    //    then see a failure for money that already moved).
    try {
      const requests = await FundingRequests.find({
        campaignId,
        status: "Approved",
        "disbursement.dateDisbursed": { $exists: true },
      });
      const totalDisbursed = requests.reduce(
        (accumulator, approved) => accumulator + (approved.disbursement?.amount || 0),
        0
      );
      const campaigns = await Campaign.find({ _id: { $ne: campaignId } }).limit(2);
      const campaignWhitelist = await CampaignEmailWhitelist.distinct("email", { campaignId });
      const results = await Promise.allSettled(
        campaignWhitelist.map(async (email) => {
          await approvedFundingRequestMailService(email, fundingRequest, campaign);
          await fundingSummaryMailService(email, requests, campaign, campaigns, totalDisbursed);
        })
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed) logger.warn({ failed, fundingRequestId: req.params.id }, "Some donor notifications failed");
    } catch (notifyErr) {
      logger.warn({ err: notifyErr }, "Donor notification step failed after disbursement");
    }

    return res
      .status(200)
      .json({ status: 200, data: "Request Approved and disbursed" });
  } catch (error) {
    logger.error({ err: error }, "stripePayoutWebhook failed");
    await release();
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
