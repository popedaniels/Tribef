// Stripe Checkout donation flow: session creation, donor redirect, webhook.
const {
  Campaign,
  Donations,
  addActivity,
  logger,
  stripe,
  creditCampaign,
  sendDonationMailSafely,
} = require("./shared");
const { Subscription } = require("../../models/subscriptionModel");
const { getClientIp, assessDonation } = require("../../utility/fraud");
const { notifyTargetReachedIfNeeded } = require("../../services/targetReached");

exports.createStripeSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ status: 503, error: "Stripe is not configured" });
    }
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      launched: true,
      suspended: false,
    });
    if (!campaign) {
      return res.status(404).json({ status: 404, error: "Campaign not found" });
    }

    const amount = Number(req.body.amount);
    const tip = Number(req.body.meta?.tip || 0);
    const currency = String(req.body.currency || campaign.funding.currency || "gbp").toLowerCase();
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) {
      return res.status(400).json({ status: 400, error: "Invalid donation amount" });
    }
    if (!Number.isFinite(tip) || tip < 0 || tip > amount) {
      return res.status(400).json({ status: 400, error: "Invalid tip amount" });
    }
    if (!["gbp", "usd", "ngn"].includes(currency)) {
      return res.status(400).json({ status: 400, error: "Unsupported currency" });
    }
    if (req.body.customer?.email && !/^\S+@\S+\.\S+$/.test(req.body.customer.email)) {
      return res.status(400).json({ status: 400, error: "Invalid donor email" });
    }

    // Fraud snapshot rides through session metadata to the webhook recorder.
    const fraud = await assessDonation({
      email: req.body.customer?.email,
      campaignId: req.params.id,
      ip: getClientIp(req),
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: req.body.customizations?.title || "Fund&Trace Donation",
              images: req.body.customizations?.logo ? [req.body.customizations.logo] : [],
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        campaignId: req.params.id,
        donorEmail: req.body.customer?.email,
        donorName: req.body.customer?.name,
        amount: String(amount - tip),
        tip: String(tip),
        paymentMethod: "Stripe",
        paymentOption: "card",
        zipCode: req.body.meta?.zipCode || "",
        anonymous: String(Boolean(req.body.meta?.anonymous)),
        referralCode: String(req.body.meta?.referralCode || "").slice(0, 64),
        fraudScore: String(fraud.score),
        fraudReasons: fraud.reasons.join("|").slice(0, 500),
        fraudIp: fraud.ip,
      },
      client_reference_id: req.body.transactionRef || `fundandtrace-${Date.now()}`,
      mode: "payment",
      cancel_url: `${process.env.MAINURL || "http://localhost:3000"}/donate/${req.params.id}?status=failed`,
      success_url: `${process.env.BACKENDURL || "http://localhost:5000"}/api/donations/saveStripe/{CHECKOUT_SESSION_ID}`,
    });
    if (req.body.customer?.email) {
      addActivity("initializeDonation", req.body.customer.email);
    }
    return res.status(200).json({
      id: session.id,
    });
  } catch (error) {
    logger.error({ err: error }, "paymentFlutterwave failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.paymentStripe = async (req, res, next) => {
  try {
    if (!stripe) {
      return res.redirect(`${process.env.MAINURL || "http://localhost:3000"}/?status=payment_unavailable`);
    }
    const session = await stripe.checkout.sessions.retrieve(
      req.params.sessionId
    );

    if (!session || !session.metadata || session.payment_status !== "paid") {
      return res.redirect(`${process.env.MAINURL || "http://localhost:3000"}/?status=invalid_session`);
    }

    // The signed webhook is the only code path that records and credits a
    // donation. This success URL only shows the payment result to the donor.
    const donatedAmount = Number(session.metadata.amount || 0);
    const tip = Number(session.metadata.tip || 0);
    const verifiedTotal = Number(session.amount_total || 0) / 100;
    if (!Number.isFinite(donatedAmount) || donatedAmount <= 0 ||
        Math.abs(verifiedTotal - (donatedAmount + tip)) > 0.01) {
      return res.redirect(`${process.env.MAINURL || "http://localhost:3000"}/?status=invalid_session`);
    }
    return res.redirect(
      `${process.env.MAINURL || "http://localhost:3000"}/donated/${
        session.metadata.campaignId
      }?status=successful&name=${encodeURIComponent(session.metadata.donorName || "Donor")}&amount=${
        donatedAmount
      }&email=${encodeURIComponent(session.metadata.donorEmail || "")}&campaignId=${
        session.metadata.campaignId
      }&anonymous=${session.metadata.anonymous || "false"}`
    );
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.stripeCheckoutWebhook = async (req, res) => {
  let event;
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe) {
      return res.status(503).json({ status: 503, error: "Stripe is not configured" });
    }
    if (!webhookSecret) {
      return res.status(503).json({ status: 503, error: "Stripe webhook is not configured" });
    }
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      webhookSecret
    );
  } catch (error) {
    return res.status(400).json({ status: 400, error: "Invalid Stripe webhook" });
  }

  // ── Recurring giving: monthly billing cycle ─────────────────────────
  if (event.type === "invoice.paid") {
    try {
      const invoice = event.data.object;
      const subId = invoice.subscription;
      if (!subId) return res.status(200).json({ received: true });

      const subDoc = await Subscription.findOne({ stripeSubscriptionId: subId });
      if (!subDoc) return res.status(200).json({ received: true });

      // Idempotency: one invoice id == one recorded donation.
      const existing = await Donations.findOne({ transactionId: invoice.id });
      if (existing) {
        return res.status(200).json({ received: true });
      }

      const campaign = await Campaign.findOne({
        _id: subDoc.campaignId,
        launched: true,
        suspended: false,
      });

      await Donations.create({
        campaignId: subDoc.campaignId,
        donorEmail: subDoc.subscriberEmail,
        donorName: subDoc.subscriberName || "Donor",
        amount: subDoc.amount,
        tip: 0,
        transactionId: invoice.id,
        transactionRef: invoice.number || invoice.id,
        paymentMethod: "stripe-subscription",
        paymentOption: "card",
        paymentId: invoice.payment_intent || "",
        createdAt: new Date(invoice.status_transitions?.paid_at * 1000 || Date.now()),
        anonymous: subDoc.anonymous,
        referralCode: subDoc.referralCode || "",
        referralCode: subDoc.referralCode || "",
        fraud: {
          score: (subDoc.fraudSnapshot && subDoc.fraudSnapshot.score) || 0,
          reasons: (subDoc.fraudSnapshot && subDoc.fraudSnapshot.reasons) || [],
          flagged: Boolean(subDoc.fraudSnapshot && subDoc.fraudSnapshot.score >= 50),
          ip: (subDoc.fraudSnapshot && subDoc.fraudSnapshot.ip) || "",
          assessedAt: null,
        },
      });

      await creditCampaign(subDoc.campaignId, subDoc.amount);
      notifyTargetReachedIfNeeded(subDoc.campaignId);
      subDoc.totalDonated = (subDoc.totalDonated || 0) + subDoc.amount;
      subDoc.status = subDoc.status === "canceling" ? "canceling" : "active";
      await subDoc.save();

      addActivity("recurringDonation", subDoc.subscriberEmail);
      await sendDonationMailSafely(
        { email: subDoc.subscriberEmail, name: subDoc.subscriberName },
        campaign,
        subDoc.amount
      );
      return res.status(200).json({ received: true });
    } catch (error) {
      logger.error({ err: error }, "Subscription invoice.paid failed");
      return res.status(500).json({ status: 500, error: "Webhook processing error" });
    }
  }

  // ── Recurring giving: subscription lifecycle sync ────────────────────
  if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
    try {
      const remote = event.data.object;
      const subDoc = await Subscription.findOne({ stripeSubscriptionId: remote.id });
      if (subDoc) {
        subDoc.status =
          remote.status === "active" && remote.cancel_at_period_end
            ? "canceling"
            : remote.status === "canceled"
            ? "canceled"
            : remote.status;
        if (subDoc.status === "canceled" && !subDoc.canceledAt) {
          subDoc.canceledAt = new Date();
        }
        await subDoc.save();
      }
      return res.status(200).json({ received: true });
    } catch (error) {
      logger.error({ err: error }, "Subscription lifecycle sync failed");
      return res.status(500).json({ status: 500, error: "Webhook processing error" });
    }
  }

  if (event.type !== "checkout.session.completed") {
    return res.status(200).json({ received: true });
  }

  try {
    const session = event.data.object;

    // ── Recurring giving: first activation ─────────────────────────────
    // Records the Subscription; monthly crediting happens on invoice.paid.
    if (session.mode === "subscription") {
      try {
        const subId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
        if (!subId) return res.status(200).json({ received: true });

        // Idempotency: checkout.session.completed may be retried.
        const existingSub = await Subscription.findOne({ stripeSubscriptionId: subId });
        if (existingSub) return res.status(200).json({ received: true });

        const remote = await stripe.subscriptions.retrieve(subId);
        const meta = remote.metadata || {};
        await Subscription.create({
          campaignId: meta.campaignId,
          subscriberEmail: meta.subscriberEmail || "",
          subscriberName: meta.subscriberName || "",
          amount: Number(meta.amount || 0),
          tip: Number(meta.tip || 0),
          currency: meta.currency || "gbp",
          interval: "month",
          anonymous: meta.anonymous === "true",
          referralCode: meta.referralCode || "",
          stripeCustomerId: String(remote.customer || ""),
          stripeSubscriptionId: subId,
          status: remote.status,
          totalDonated: 0,
          // Preserve the fraud snapshot captured at initialization.
          ...(meta.fraudScore
            ? { fraudSnapshot: { score: Number(meta.fraudScore), reasons: String(meta.fraudReasons || "").split("|").filter(Boolean), ip: meta.fraudIp || "" } }
            : {}),
        });
        return res.status(200).json({ received: true });
      } catch (error) {
        logger.error({ err: error }, "Subscription activation failed");
        return res.status(500).json({ status: 500, error: "Webhook processing error" });
      }
    }

    if (session.payment_status !== "paid" || !session.metadata?.campaignId) {
      return res.status(200).json({ received: true });
    }

    const existingDonation = await Donations.findOne({
      $or: [{ transactionId: session.id }, { paymentId: session.payment_intent }],
    });
    if (existingDonation) return res.status(200).json({ received: true });

    const amount = Number(session.amount_total || 0) / 100;
    const tip = Number(session.metadata.tip || 0);
    const metadataAmount = Number(session.metadata.amount || 0);
    if (!Number.isFinite(amount) || !Number.isFinite(tip) || !Number.isFinite(metadataAmount) ||
        tip < 0 || metadataAmount <= 0 || Math.abs(amount - (metadataAmount + tip)) > 0.01) {
      return res.status(400).json({ status: 400, error: "Invalid donation amount" });
    }
    const donationAmount = metadataAmount;
    const campaign = await Campaign.findOne({
      _id: session.metadata.campaignId,
      launched: true,
      suspended: false,
    });
    if (!campaign || !Number.isFinite(donationAmount) || donationAmount <= 0) {
      return res.status(400).json({ status: 400, error: "Invalid donation webhook" });
    }

    const donation = await Donations.create({
      campaignId: campaign._id,
      donorEmail: session.metadata.donorEmail,
      donorName: session.metadata.donorName,
      amount: donationAmount,
      transactionId: session.id,
      transactionRef: session.client_reference_id || session.id,
      tip,
      paymentMethod: "Stripe",
      paymentOption: "card",
      zipCode: session.metadata.zipCode || "",
      paymentId: session.payment_intent,
      createdAt: Date.now(),
      anonymous: session.metadata.anonymous === "true",
      referralCode: session.metadata.referralCode || "",
      fraud: {
        score: Number(session.metadata.fraudScore || 0),
        reasons: String(session.metadata.fraudReasons || "").split("|").filter(Boolean),
        flagged: Number(session.metadata.fraudScore || 0) >= 50,
        ip: session.metadata.fraudIp || "",
        assessedAt: new Date(),
      },
    });

    await creditCampaign(campaign._id, donationAmount);
    notifyTargetReachedIfNeeded(campaign._id);

    await sendDonationMailSafely(
      { email: session.metadata.donorEmail, name: session.metadata.donorName },
      campaign,
      donationAmount
    );
    addActivity("donation", session.metadata.donorEmail);
    return res.status(200).json({ received: true, donationId: donation._id });
  } catch (error) {
    logger.error({ err: error }, "Stripe webhook failed");
    return res.status(500).json({ status: 500, error: "Webhook processing error" });
  }
};
