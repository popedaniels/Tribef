// Funding-request disbursement via Stripe Express Connect.
// POST /api/donations/stripeWebhook/:fundingRequestId
const { CampaignEmailWhitelist } = require("../../models/campaignEmailWhitelist");
const {
  approvedFundingRequestMailService,
} = require("../../services/approvedFundingRequest");
const { fundingSummaryMailService } = require("../../services/fundingSummaryMail");
const { encrypt } = require("../../utility/encryption");

const {
  Campaign,
  FundingRequests,
  addActivity,
  logger,
  stripe,
} = require("./shared");

exports.stripePayoutWebhook = async (req, res, next) => {
  try {
    logger.debug("stripePayoutWebhook called");
    const fundingRequest = await FundingRequests.findById(req.params.id);
    const amount = Number(req.body.amount);
    const campaignId = String(req.body.campaignId || "");
    const currency = String(req.body.currency || "");
    if (
      !fundingRequest ||
      fundingRequest.status !== "Approved" ||
      fundingRequest.disbursement?.dateDisbursed ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      String(fundingRequest.campaignId) !== campaignId
    ) {
      return res.status(409).json({ status: 409, error: "Invalid or already processed funding request" });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign || !campaign.funding || campaign.funding.availableBalance < amount) {
      return res.status(422).json({ status: 422, error: "Insufficient campaign balance" });
    }
    if (currency && campaign.funding.currency && currency.toLowerCase() !== String(campaign.funding.currency).toLowerCase()) {
      return res.status(422).json({ status: 422, error: "Currency mismatch" });
    }

    // ── Stripe Express Connect disbursement ────────────────────────────
    // When Stripe is configured and the campaign has an onboarding-complete
    // Express account, move the approved amount to the organizer's Stripe
    // account with a real Transfer (idempotent per funding request).
    // Without a connected account, organizer payouts are refused so the
    // escrow is never silently released to an unverified destination.
    let transfer = null;
    if (stripe) {
      const connect = campaign.stripeConnect || {};
      if (connect.accountId && connect.payoutsEnabled) {
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
      } else if (String(fundingRequest.fundingType).toLowerCase() !== "third-party") {
        return res.status(422).json({
          status: 422,
          error:
            "Organizer must connect their Stripe payouts account before funds can be disbursed.",
        });
      }
    }

    const requests = await FundingRequests.find({
      campaignId: req.body.campaignId,
      status: "Approved",
      disbursement: { $ne: null },
    });
    const totalDisbursed = requests.reduce(
      (accumulator, approved) => accumulator + approved.disbursement.amount,
      0
    );

    const campaigns = await Campaign.find({
      _id: { $ne: req.body.campaignId },
    }).limit(2);

    // Reserve the balance atomically so concurrent webhook retries cannot
    // overdraw the campaign.
    const balanceUpdate = await Campaign.updateOne(
      { _id: campaignId, "funding.availableBalance": { $gte: amount } },
      { $inc: { "funding.availableBalance": -amount } }
    );
    if (!balanceUpdate.nModified && !balanceUpdate.modifiedCount) {
      return res.status(409).json({ status: 409, error: "Campaign balance changed; retry" });
    }

    fundingRequest.disbursement = {
      amount,
      currency: currency || campaign.funding.currency,
      bankName: encrypt(req.body.bankName),
      accountName: encrypt(req.body.accountName),
      accountNumber: encrypt(req.body.accountNumber),
      dateDisbursed: Date.now(),
      receipt: "",
      stripeTransferId: transfer?.id || "",
      stripeTransferStatus: transfer?.status || "",
    };

    if (transfer) {
      logger.info(
        { transferId: transfer.id, fundingRequestId: req.params.id, amount },
        "Stripe Connect transfer created for approved funding request"
      );
    }

    await fundingRequest.save();

    // Notify whitelisted donors about the approved funding request.
    const campaignWhitelist = await CampaignEmailWhitelist.distinct("email", {
      campaignId: campaignId,
    });
    await Promise.all(
      campaignWhitelist.map(async (email) => {
        await approvedFundingRequestMailService(email, fundingRequest, campaign);
        await fundingSummaryMailService(
          email,
          requests,
          campaign,
          campaigns,
          totalDisbursed
        );
      })
    );

    addActivity("Disbursement Approved", req.params.id);
    return res
      .status(200)
      .json({ status: 200, data: "Request Approved and disbursed" });
  } catch (error) {
    logger.error({ err: error }, "stripePayoutWebhook failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
