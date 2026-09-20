const mongoose = require("mongoose");
const { Campaign } = require("../models/campaignModel");
const { Donations } = require("../models/donationsModel");
const stripe = process.env.STRIPESECRET
  ? require("stripe")(process.env.STRIPESECRET)
  : null;
const logger = require("../utility/logger");

exports.stripeRefund = async (req, res) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    if (!stripe) {
      return res.status(503).json({ status: 503, error: "Stripe is not configured" });
    }
    const { campaignId, donationId } = req.params;
    if (
      !campaignId ||
      !donationId ||
      !mongoose.Types.ObjectId.isValid(campaignId) ||
      !mongoose.Types.ObjectId.isValid(donationId)
    ) {
      return res.status(400).json({ status: 400, error: "Invalid ID" });
    }
    const campaign = await Campaign.findById(campaignId).maxTimeMS(3000);
    const donation = await Donations.findOne({
      _id: donationId,
      campaignId: campaignId,
      paymentMethod: "Stripe",
    }).maxTimeMS(3000);

    if (!campaign || !donation || !donation.paymentId) {
      return res.status(404).json({ status: 404, error: "Donation not found" });
    }

    if (donation.refund.status === "succeeded") {
      return res
        .status(422)
        .json({ status: 422, error: "Refund already made." });
    }

    const refund = await stripe.refunds.create({
      payment_intent: donation.paymentId,
    });
    donation.refund.amount = refund.amount / 100;
    donation.refund.status = refund.status;
    donation.refund.adminId = req.admin?._id;
    donation.refund.refundId = refund.id;
    donation.refund.createdAt = Date.now();
    donation.refund.adminName = req.admin
      ? `${req.admin.firstName} ${req.admin.lastName}`
      : "Admin";
    await donation.save();
    await Campaign.updateOne(
      { _id: campaign._id },
      {
        $inc: {
          "funding.amountRaised": -Number(donation.amount),
          "funding.availableBalance": -Number(donation.amount),
        },
      }
    ).maxTimeMS(3000);
    return res.status(200).json({
      status: 200,
      message: "Refund successfully created.",
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.stripeRefundBatch = async (req, res) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    if (!stripe) {
      return res.status(503).json({ status: 503, error: "Stripe is not configured" });
    }
    const { campaignId } = req.params;
    if (!campaignId || !mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({ status: 400, error: "Invalid Campaign ID" });
    }
    const campaign = await Campaign.findById(campaignId).maxTimeMS(3000);

    if (!campaign) {
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }
    const donations = await Donations.find({
      campaignId: campaignId,
      paymentMethod: "Stripe",
    }).maxTimeMS(3000);
    if (campaign.funding.refunded) {
      return res.status(422).json({ status: 422, error: "Funds already made" });
    }

    if (donations.length) {
      let totalRefunded = 0;
      for (const donation of donations) {
        if (donation.refund.status === "succeeded" || !donation.paymentId) continue;

        const refund = await stripe.refunds.create({
          payment_intent: donation.paymentId,
        });
        donation.refund.amount = refund.amount / 100;
        donation.refund.status = refund.status;
        donation.refund.adminId = req.admin?._id;
        donation.refund.refundId = refund.id;
        donation.refund.createdAt = Date.now();
        donation.refund.adminName = req.admin
          ? `${req.admin.firstName} ${req.admin.lastName}`
          : "Admin";
        await donation.save();
        totalRefunded += Number(donation.amount);
      }

      await Campaign.updateOne(
        { _id: campaign._id },
        {
          $set: { "funding.refunded": true },
          $inc: {
            "funding.amountRaised": -totalRefunded,
            "funding.availableBalance": -totalRefunded,
          },
        }
      ).maxTimeMS(3000);
    } else {
      return res.status(422).json({ status: 422, error: "No donations" });
    }

    return res.status(200).json({
      status: 200,
      message: "Refunds successfully created.",
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.getAllDonations = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    let query = {};
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
        } else if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          // fallback: treat parsed directly as query if it doesn't contain nested query key
          const hasQueryKey = "query" in parsed || "queries" in parsed;
          if (!hasQueryKey) query = parsed;
        }
      } catch (e) {
        logger.warn({ err: e }, "Could not parse queries JSON");
        return res.status(400).json({ status: 400, error: "Invalid queries" });
      }
    }
    const page = Math.max(parseInt(req.params.query, 10) || 1, 1);
    const count = await Donations.find({ ...query }).countDocuments().maxTimeMS(3000);
    const donations = await Donations.find({ ...query })
      .skip((page - 1) * 10)
      .limit(10)
      .populate("campaignId")
      .maxTimeMS(3000);

    logger.debug({ donations }, "Donations queried");
    return res.status(200).json({
      data: { donations, count },
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.getSingleCampaign = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ status: 401, error: "Unauthorized" });
    }
    let query = {};
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
        } else if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const hasQueryKey = "query" in parsed || "queries" in parsed;
          if (!hasQueryKey) query = parsed;
        }
      } catch (e) {
        logger.warn({ err: e }, "Could not parse queries JSON");
        return res.status(400).json({ status: 400, error: "Invalid queries" });
      }
    }
    const page = Math.max(parseInt(req.params.query, 10) || 1, 1);
    const count = await Campaign.find({ ...query }).countDocuments().maxTimeMS(3000);
    const donations = await Campaign.find({ ...query })
      .skip((page - 1) * 10)
      .limit(10)
      .maxTimeMS(3000);

    logger.debug({ donations }, "Donations queried");
    return res.status(200).json({
      data: { donations, count },
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
