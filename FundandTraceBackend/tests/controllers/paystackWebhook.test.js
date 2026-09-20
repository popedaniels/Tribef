// Paystack webhook integration tests.
// Exercises signature verification, idempotency, amount validation and
// campaign crediting against a real Express app + MongoDB instance.
const chai = require("chai");
const chaiHttp = require("chai-http");
const crypto = require("crypto");
const mongoose = require("mongoose");
const axios = require("axios");
const server = require("../../server");
const { Campaign } = require("../../models/campaignModel");
const { Donations } = require("../../models/donationsModel");

chai.use(chaiHttp);
const { expect } = chai;

const PAYSTACK_SECRET = "sk_test_paystack_webhook_secret";
const runId = crypto.randomBytes(4).toString("hex");
const ref = (n) => `ps-${runId}-${n}`;
let campaignId;
let originalAxiosGet;
let dbAvailable = false;

const waitForDb = async () => {
  for (let i = 0; i < 50; i++) {
    if (mongoose.connection.readyState === 1) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("MongoDB not reachable — start mongo (docker run -p 27017:27017 mongo:7)");
};

const sign = (body) =>
  crypto
    .createHmac("sha512", PAYSTACK_SECRET)
    .update(JSON.stringify(body))
    .digest("hex");

const postWebhook = (payload, sigHeader) =>
  chai
    .request(server)
    .post("/api/donations/paystack-webhook")
    .set("x-paystack-signature", sigHeader || sign(payload))
    .send(payload);

const successPayload = (reference) => ({
  event: "charge.success",
  data: {
    status: "success",
    reference,
    amount: 10500,
    channel: "card",
    paid_at: "2026-08-25T10:00:00Z",
    customer: { first_name: "Test" },
    metadata: {
      campaignId: null,
      donorEmail: "paystack-donor@example.com",
      donorName: "Test Donor",
      amount: "100",
      tip: "5",
      anonymous: "false",
    },
  },
});

describe("Paystack webhook", () => {
  before(async function () {
    try {
      await waitForDb();
    } catch {
      this.skip();
      return;
    }
    dbAvailable = true;
    process.env.PAYSTACK_SECRET = PAYSTACK_SECRET;

    const campaign = await Campaign.create({
      launched: true,
      suspended: false,
      funding: { amountExpected: 1000000, amountRaised: 0, availableBalance: 0 },
    });
    campaignId = String(campaign._id);
    originalAxiosGet = axios.default.get;
  });

  after(async () => {
    if (!dbAvailable) return;
    axios.default.get = originalAxiosGet;
    delete process.env.PAYSTACK_SECRET;
    await Donations.deleteMany({
      $or: [
        { donorEmail: "paystack-donor@example.com" },
        { transactionRef: { $regex: `^ps-${runId}-` } },
      ],
    });
    await Campaign.deleteOne({ _id: campaignId }).catch(() => {});
  });

  it("should reject an invalid signature with 401", async () => {
    const payload = successPayload(ref("bad-sig"));
    payload.data.metadata.campaignId = campaignId;
    const res = await postWebhook(payload, "deadbeef");
    expect(res).to.have.status(401);
  });

  it("should ack non-charge.success events without recording", async () => {
    const res = await postWebhook({ event: "transfer.failed", data: { status: "failed" } });
    expect(res).to.have.status(200);
    expect(res.body).to.deep.equal({ received: true });
  });

  it("should ack charge.success without campaignId", async () => {
    const res = await postWebhook(successPayload(ref("no-campaign")));
    expect(res).to.have.status(200);
    const count = await Donations.countDocuments({ transactionRef: ref("no-campaign") });
    expect(count).to.equal(0);
  });

  it("should record the donation and credit the campaign", async () => {
    const payload = successPayload(ref("happy"));
    payload.data.metadata.campaignId = campaignId;

    const res = await postWebhook(payload);
    expect(res).to.have.status(200);
    expect(res.body).to.deep.equal({ received: true });

    const donation = await Donations.findOne({ transactionRef: ref("happy") });
    expect(donation).to.exist;
    expect(donation.amount).to.equal(100);
    expect(donation.tip).to.equal(5);
    expect(donation.paymentMethod).to.equal("paystack");

    const campaign = await Campaign.findById(campaignId);
    expect(campaign.funding.amountRaised).to.equal(100);
    expect(campaign.funding.availableBalance).to.equal(100);
  });

  it("should not double-credit on duplicate delivery", async () => {
    const payload = successPayload(ref("idem"));
    payload.data.metadata.campaignId = campaignId;

    const first = await postWebhook(payload);
    expect(first).to.have.status(200);

    const replay = await postWebhook(payload);
    expect(replay).to.have.status(200);

    const count = await Donations.countDocuments({ transactionRef: ref("idem") });
    expect(count).to.equal(1);

    const campaign = await Campaign.findById(campaignId);
    expect(campaign.funding.amountRaised).to.equal(200); // happy path (100) + this one only
  });

  it("should reject an amount mismatch with 400 and record nothing", async () => {
    const payload = successPayload(ref("mismatch"));
    payload.data.metadata.campaignId = campaignId;
    payload.data.amount = 99900; // metadata says 105 kobo total

    const res = await postWebhook(payload);
    expect(res).to.have.status(400);
    const count = await Donations.countDocuments({ transactionRef: ref("mismatch") });
    expect(count).to.equal(0);
  });

  it("should reject an unknown campaign with 400", async () => {
    const payload = successPayload(ref("unknown-campaign"));
    payload.data.metadata.campaignId = "60f7117f2ee78d31b4de0f7d";

    const res = await postWebhook(payload);
    expect(res).to.have.status(400);
  });
});
