// Stripe checkout webhook integration tests.
// Signs raw payloads the same way Stripe does (t=...,v1=hmac_sha256(secret, t.payload))
// and exercises one-time donation recording, amount validation, subscription
// lifecycle sync and idempotency against a real Express app + MongoDB.
const chai = require("chai");
const chaiHttp = require("chai-http");
const crypto = require("crypto");
const mongoose = require("mongoose");
const server = require("../../server");
const { Campaign } = require("../../models/campaignModel");
const { Donations } = require("../../models/donationsModel");

chai.use(chaiHttp);
const { expect } = chai;

// The Subscription model lives behind the stripe controller's shared deps.
const { FundingRequests } = require("../../models/fundingRequestModel");
let Subscription;
try {
  Subscription = require("../../models/subscriptionModel").Subscription;
} catch {
  Subscription = null;
}

const WEBHOOK_SECRET = "whsec_test_secret";
const runId = crypto.randomBytes(4).toString("hex");
const sid = (n) => `cs_test_${runId}_${n}`;
const pid = (n) => `pi_test_${runId}_${n}`;
let campaignId;
let dbAvailable = false;

const waitForDb = async () => {
  for (let i = 0; i < 50; i++) {
    if (mongoose.connection.readyState === 1) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("MongoDB not reachable — start mongo (docker run -p 27017:27017 mongo:7)");
};

const signedRequest = (event) => {
  const payload = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  return chai
    .request(server)
    .post("/api/donations/stripe-webhook")
    .set("Content-Type", "application/json")
    .set("stripe-signature", `t=${timestamp},v1=${signature}`)
    .send(payload);
};

const checkoutEvent = (sessionId, paymentIntent) => ({
  id: `evt_x`,
  type: "checkout.session.completed",
  data: {
    object: {
      id: sessionId,
      mode: "payment",
      payment_status: "paid",
      amount_total: 5000,
      payment_intent: paymentIntent,
      metadata: {
        campaignId: null,
        donorEmail: "stripe-donor@example.com",
        donorName: "Stripe Donor",
        amount: "50",
        tip: "0",
        anonymous: "false",
      },
    },
  },
});

describe("Stripe webhook", () => {
  before(async function () {
    try {
      await waitForDb();
    } catch {
      this.skip();
      return;
    }
    dbAvailable = true;
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

    const campaign = await Campaign.create({
      launched: true,
      suspended: false,
      funding: { amountExpected: 1000000, amountRaised: 0, availableBalance: 0 },
    });
    campaignId = String(campaign._id);
  });

  after(async () => {
    if (!dbAvailable) return;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    await Donations.deleteMany({
      $or: [
        { donorEmail: "stripe-donor@example.com" },
        { transactionId: { $regex: `^cs_test_${runId}_` } },
      ],
    });
    if (Subscription) {
      await Subscription.deleteMany({ stripeSubscriptionId: "sub_test_001" }).catch(() => {});
    }
    await Campaign.deleteOne({ _id: campaignId }).catch(() => {});
  });

  it("should reject an invalid signature with 400", async () => {
    const event = checkoutEvent(sid("badsig"), pid("badsig"));
    const res = await signedRequest(event).set("stripe-signature", "t=1,v1=deadbeef");
    expect(res).to.have.status(400);
  });

  it("should ack unknown event types", async () => {
    const event = { id: "evt_x", type: "payout.created", data: { object: {} } };
    const res = await signedRequest(event);
    expect(res).to.have.status(200);
    expect(res.body).to.deep.include({ received: true });
  });

  it("should record a paid one-time donation and credit the campaign", async () => {
    const event = checkoutEvent(sid(1), pid(1));
    event.data.object.metadata.campaignId = campaignId;

    const res = await signedRequest(event);
    expect(res).to.have.status(200);
    expect(res.body).to.deep.include({ received: true });

    const donation = await Donations.findOne({ transactionId: sid(1) });
    expect(donation).to.exist;
    expect(donation.amount).to.equal(50);
    expect(donation.paymentMethod).to.equal("Stripe");

    const campaign = await Campaign.findById(campaignId);
    expect(campaign.funding.amountRaised).to.equal(50);
  });

  it("should not double-credit when checkout.session.completed is retried", async () => {
    const event = checkoutEvent(sid(2), pid(2));
    event.data.object.metadata.campaignId = campaignId;

    const first = await signedRequest(event);
    expect(first).to.have.status(200);

    const replay = await signedRequest(event);
    expect(replay).to.have.status(200);

    const count = await Donations.countDocuments({ transactionId: sid(2) });
    expect(count).to.equal(1);

    const campaign = await Campaign.findById(campaignId);
    expect(campaign.funding.amountRaised).to.equal(100); // prior tests only
  });

  it("should reject an amount/metadata mismatch with 400", async () => {
    const event = checkoutEvent(sid(3), pid(3));
    event.data.object.metadata.campaignId = campaignId;
    event.data.object.amount_total = 123456;

    const res = await signedRequest(event);
    expect(res).to.have.status(400);
    const count = await Donations.countDocuments({ transactionId: sid(3) });
    expect(count).to.equal(0);
  });

  it("should ack unpaid sessions without recording", async () => {
    const event = checkoutEvent(sid(4), pid(4));
    event.data.object.metadata.campaignId = campaignId;
    event.data.object.payment_status = "unpaid";

    const res = await signedRequest(event);
    expect(res).to.have.status(200);
    const count = await Donations.countDocuments({ transactionId: sid(4) });
    expect(count).to.equal(0);
  });

  it("should sync subscription status on customer.subscription.deleted", async () => {
    if (!Subscription) return this.skip();

    const sub = await Subscription.create({
      campaignId,
      subscriberEmail: "stripe-donor@example.com",
      subscriberName: "Stripe Donor",
      amount: 25,
      tip: 0,
      currency: "gbp",
      interval: "month",
      anonymous: false,
      referralCode: "",
      stripeCustomerId: "cus_test_001",
      stripeSubscriptionId: "sub_test_001",
      status: "active",
      totalDonated: 0,
    });

    const event = {
      id: "evt_sub_001",
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_test_001", status: "canceled" } },
    };
    const res = await signedRequest(event);
    expect(res).to.have.status(200);

    const updated = await Subscription.findById(sub._id);
    expect(updated.status).to.equal("canceled");
    expect(updated.canceledAt).to.exist;
  });
});
