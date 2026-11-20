// Funding-request disbursement via Stripe Express Connect.
// POST /api/donations/stripeWebhook/:fundingRequestId
const { CampaignEmailWhitelist } = require("../../models/campaignEmailWhitelist");
const {
  approvedFundingRequestMailService,
} = require("../../services/approvedFundingRequest");
const { fundingSummaryMailService } = require("../../services/fundingSummaryMail");
const { encrypt } = require("../../utility/encryption");
const { isThirdParty } = require("../../utility/fundingType");
const { railFor, sendBankTransfer } = require("../../services/payoutRails");
const { appendEntry } = require("../../services/ledger");

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
        { _id: lockedRequestId, "disbursement.dateDisbursed": null },
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
        "disbursement.dateDisbursed": null,
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
    const payoutCurrency = String(currency || campaign.funding.currency || "GBP").toUpperCase();
    const useConnect = Boolean(stripe && connect.accountId && connect.payoutsEnabled);
    const bankCode = String(req.body.bankCode || "");
    const bankRail = !useConnect && bankCode && req.body.accountNumber ? railFor(payoutCurrency) : null;
    if (!useConnect && !bankRail && !thirdParty) {
      // No verified destination: never release escrow into the void.
      await release();
      return res.status(422).json({
        status: 422,
        error:
          "Organizer needs a payout destination: connect Stripe payouts, or add a bank account (bank code + account number) in a supported currency.",
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

    // 3) Move the money.
    let transfer = null;
    let bankTransfer = null;
    if (useConnect) {
      transfer = await stripe.transfers.create(
        {
          amount: Math.round(amount * 100),
          currency: payoutCurrency.toLowerCase(),
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
    } else if (bankRail) {
      // Flutterwave / Paystack bank transfer. Settles asynchronously; the
      // provider webhook calls applyTransferOutcome() with the final state.
      bankTransfer = await sendBankTransfer({
        fundingRequestId: `${req.params.id}-${(fundingRequest.payoutAttempts || 0) + 1}`,
        amount,
        currency: payoutCurrency,
        bankCode,
        accountNumber: req.body.accountNumber,
        accountName: req.body.accountName,
        narration: `Fund&Trace milestone payout ${req.params.id}`,
      });
      if (bankTransfer.status === "failed") {
        throw Object.assign(new Error("Bank transfer was rejected by the payout provider"), { status: 502 });
      }
    }

    const provider = transfer ? "stripe_connect" : bankTransfer ? bankTransfer.provider : "manual";

    // 4) Record the disbursement. From here on the payout is final (bank
    //    transfers can still be reversed by webhook — see applyTransferOutcome).
    fundingRequest.disbursement = {
      amount,
      currency: payoutCurrency,
      bankName: encrypt(req.body.bankName || ""),
      accountName: encrypt(req.body.accountName || ""),
      accountNumber: encrypt(req.body.accountNumber || ""),
      dateDisbursed: Date.now(),
      receipt: "",
      stripeTransferId: transfer?.id || "",
      stripeTransferStatus: transfer?.status || "",
      provider,
      providerReference: bankTransfer?.reference || transfer?.id || "",
      providerId: bankTransfer?.providerId || transfer?.id || "",
      // "manual": an approved third-party payment made off-platform by ops.
      providerStatus: bankTransfer ? bankTransfer.status : "successful",
    };
    fundingRequest.payoutAttempts = (fundingRequest.payoutAttempts || 0) + 1;
    fundingRequest.payoutLockedAt = undefined;
    await fundingRequest.save();
    disbursed = true;
    addActivity("Disbursement Approved", req.params.id);
    await appendEntry({
      campaignId,
      type: "payout",
      amount,
      currency: payoutCurrency,
      refId: `payout:${req.params.id}:${fundingRequest.payoutAttempts}`,
      memo: thirdParty ? "Milestone payout to third party" : "Milestone payout to organiser",
    });

    // 5) Notify whitelisted donors. Best-effort: a mail failure must never
    //    turn a completed payout into an error response (the approver would
    //    then see a failure for money that already moved).
    try {
      const requests = await FundingRequests.find({
        campaignId,
        status: "Approved",
        "disbursement.dateDisbursed": { $ne: null },
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
    logger.error({ err: error.response?.data || error }, "stripePayoutWebhook failed");
    await release();
    const status = error.status === 502 || error.response ? 502 : 500;
    return res.status(status).json({
      status,
      error: status === 502 ? "The payout provider rejected the transfer. Nothing was disbursed." : "Server error.",
    });
  }
};

/**
 * Apply the final state of an asynchronous bank transfer (provider webhook).
 * A failed or reversed transfer returns the money to escrow, writes a
 * payout_reversal to the public ledger and puts the request back to Pending
 * so it can be re-approved (with a new transfer reference).
 * Idempotent: repeated webhooks for the same outcome are no-ops.
 */
exports.applyTransferOutcome = async ({ reference, status }) => {
  if (!reference) return { applied: false, reason: "no reference" };
  const outcome = /success|successful|completed/i.test(status) ? "successful" : /fail|revers/i.test(status) ? "failed" : null;
  if (!outcome) return { applied: false, reason: `ignored status ${status}` };

  if (outcome === "successful") {
    const r = await FundingRequests.updateOne(
      { "disbursement.providerReference": reference, "disbursement.providerStatus": "pending" },
      { $set: { "disbursement.providerStatus": "successful" } }
    );
    return { applied: Boolean(r.modifiedCount || r.nModified), outcome };
  }

  // Failed / reversed: flip pending -> failed exactly once, then refund escrow.
  const fr = await FundingRequests.findOneAndUpdate(
    { "disbursement.providerReference": reference, "disbursement.providerStatus": { $in: ["pending", "successful"] } },
    { $set: { "disbursement.providerStatus": "failed" } },
    { new: true }
  );
  if (!fr) return { applied: false, reason: "already applied or unknown reference" };

  const amount = Number(fr.disbursement?.amount || 0);
  await Campaign.updateOne({ _id: fr.campaignId }, { $inc: { "funding.availableBalance": amount } });
  await appendEntry({
    campaignId: fr.campaignId,
    type: "payout_reversal",
    amount,
    currency: fr.disbursement?.currency,
    refId: `reversal:${reference}`,
    memo: "Bank transfer failed or reversed; funds returned to escrow",
  });
  await FundingRequests.updateOne(
    { _id: fr._id },
    {
      $set: {
        status: "Pending",
        declineReason: `Payout failed at the bank (${status}). Funds were returned to escrow; please confirm the account details.`,
        "disbursement.dateDisbursed": null,
      },
    }
  );
  logger.warn({ fundingRequestId: String(fr._id), reference, status }, "Bank payout failed; escrow restored");
  return { applied: true, outcome };
};
