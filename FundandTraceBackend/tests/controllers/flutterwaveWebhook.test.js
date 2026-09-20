// Flutterwave webhook integration tests.
// Covers verif-hash verification, API re-verification, idempotency and
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

// Unique-per-run refs so repeated runs never collide with leftover docs.
const runId = crypto.randomBytes(4).toString("hex");

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

const postWebhook = (payload, hash) =>
  chai
    .request(server)
    .post("/api/donations/flutterwave-webhook")
    .set("verif-hash", hash)
    .send(payload);

const chargePayload = (n, amount) => ({
  event: "charge.completed",
  data: {
    id: `${runId}-9000-${n}`,
    status: "successful",
    flw_ref: `flw-${runId}-${n}`,
    tx_ref: `tx-${runId}-${n}`,
    amount,
    meta: {
      campaignId: null,
      email: "flutterwave-donor@example.com",
      name: "Flw Donor",
      amount: "70",
      tip: "0",
    },
  },
});

describe("Flutterwave webhook", () => {
  before(async function () {
    try {
      await waitForDb();
    } catch {
      this.skip();
      return;
    }
    dbAvailable = true;
    process.env.FLUTTERWAVE = "sk_test_flw_secret";
    process.env.FLUTTERWAVE_VERIF_HASH = "test-verif-hash";
    process.env.MAINURL = "http://localhost:3000";

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
    delete process.env.FLUTTERWAVE_VERIF_HASH;
    await Donations.deleteMany({
      $or: [
        { donorEmail: "flutterwave-donor@example.com" },
        { transactionRef: { $regex: `^tx-${runId}-` } },
      ],
    });
    await Campaign.deleteOne({ _id: campaignId }).catch(() => {});
  });

  it("should record the donation after successful re-verification", async () => {
    const payload = chargePayload(1, 70);
    payload.data.meta.campaignId = campaignId;

    axios.default.get = async () => ({
      data: {
        status: "success",
        data: { status: "successful", meta: { campaignId } },
      },
    });

    const res = await postWebhook(payload, "test-verif-hash");
    expect(res).to.have.status(200);
    expect(res.body).to.deep.equal({ received: true });

    const donation = await Donations.findOne({ transactionRef: `tx-${runId}-1` });
    expect(donation).to.exist;
    expect(donation.amount).to.equal(70);
    expect(donation.paymentMethod).to.equal("flutterwave");

    const campaign = await Campaign.findById(campaignId);
    expect(campaign.funding.amountRaised).to.equal(70);
  });

  it("should not double-credit on duplicate delivery", async () => {
    const payload = chargePayload(2, 70);
    payload.data.meta.campaignId = campaignId;

    axios.default.get = async () => ({
      data: { status: "success", data: { status: "successful", meta: { campaignId } } },
    });

    const first = await postWebhook(payload, "test-verif-hash");
    expect(first).to.have.status(200);

    const replay = await postWebhook(payload, "test-verif-hash");
    expect(replay).to.have.status(200);

    const count = await Donations.countDocuments({ transactionRef: `tx-${runId}-2` });
    expect(count).to.equal(1);

    const campaign = await Campaign.findById(campaignId);
    expect(campaign.funding.amountRaised).to.equal(140); // previous test (70) + this one only
  });

  it("should reject when re-verification reports failure", async () => {
    const payload = chargePayload(3, 70);
    payload.data.meta.campaignId = campaignId;

    axios.default.get = async () => ({
      data: { status: "success", data: { status: "failed", meta: { campaignId } } },
    });

    const res = await postWebhook(payload, "test-verif-hash");
    expect(res).to.have.status(400);
    const count = await Donations.countDocuments({ transactionRef: `tx-${runId}-3` });
    expect(count).to.equal(0);
  });

  it("should reject a campaignId mismatch between webhook and verification", async () => {
    const payload = chargePayload(4, 70);
    payload.data.meta.campaignId = campaignId;

    axios.default.get = async () => ({
      data: {
        status: "success",
        data: { status: "successful", meta: { campaignId: "60f7117f2ee78d31b4de0f7d" } },
      },
    });

    const res = await postWebhook(payload, "test-verif-hash");
    expect(res).to.have.status(400);
    const count = await Donations.countDocuments({ transactionRef: `tx-${runId}-4` });
    expect(count).to.equal(0);
  });
});
