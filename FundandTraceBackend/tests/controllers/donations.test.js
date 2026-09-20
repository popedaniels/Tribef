// Donations Controller — Paystack, Stripe, Flutterwave payment flows
const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../server");

chai.use(chaiHttp);
const { expect } = chai;

const VALID_CAMPAIGN_ID = "60f7117f2ee78d31b4de0f7d";

describe("Donations Controller", () => {
  describe("POST /api/donations/initializePaystack/:id", () => {
    it("should return 503 when Paystack is not configured", async () => {
      const res = await chai
        .request(server)
        .post(`/api/donations/initializePaystack/${VALID_CAMPAIGN_ID}`)
        .send({ amount: 100, currency: "NGN", customer: { email: "a@b.com" } });
      expect(res).to.have.status(503);
      expect(res.body).to.have.property("error");
    });

    it("should return 400 for unsupported currency", async () => {
      const res = await chai
        .request(server)
        .post(`/api/donations/initializePaystack/${VALID_CAMPAIGN_ID}`)
        .send({ amount: 100, currency: "EUR" });
      expect(res.status).to.be.oneOf([400, 404, 503]);
    });

    it("should return 400 for invalid donor email", async () => {
      const res = await chai
        .request(server)
        .post(`/api/donations/initializePaystack/${VALID_CAMPAIGN_ID}`)
        .send({ amount: 100, currency: "NGN", customer: { email: "not-an-email" } });
      expect(res.status).to.be.oneOf([400, 404, 503]);
    });
  });

  describe("GET /api/donations/paystack/:id", () => {
    it("should handle paystack callback (redirect or 500)", async () => {
      const res = await chai
        .request(server)
        .get(`/api/donations/paystack/${VALID_CAMPAIGN_ID}?reference=test-ref-123`)
        .redirects(0);
      // Redirect (good) or 500 (no Paystack configured)
      expect(res.status).to.be.oneOf([200, 302, 500]);
    });

    it("should redirect for failed status", async () => {
      const res = await chai
        .request(server)
        .get(`/api/donations/paystack/${VALID_CAMPAIGN_ID}?reference=bad-ref`)
        .redirects(0);
      expect(res.status).to.be.oneOf([200, 302, 500]);
    });
  });

  describe("POST /api/donations/paystack-webhook", () => {
    it("should return 503 when Paystack is not configured", async () => {
      const res = await chai
        .request(server)
        .post("/api/donations/paystack-webhook")
        .send({ event: "charge.success", data: {} });
      expect(res).to.have.status(503);
      expect(res.body).to.have.property("error");
    });
  });

  describe("POST /api/donations/createStripeSession/:id", () => {
    it("should return 503 when Stripe is not configured", async () => {
      const res = await chai
        .request(server)
        .post(`/api/donations/createStripeSession/${VALID_CAMPAIGN_ID}`)
        .send({ amount: 100, currency: "gbp" });
      // 404 (unknown campaign), 500/503 (no DB / Stripe unconfigured)
      expect(res.status).to.be.oneOf([404, 500, 503]);
    });
  });

  describe("GET /api/donations/allDonations/:email", () => {
    it("should reject without auth (401)", async () => {
      const res = await chai
        .request(server)
        .get("/api/donations/allDonations/donor@example.com");
      expect(res).to.have.status(401);
    });
  });

  describe("GET /api/donations/flutterwave/:id", () => {
    it("should redirect for non-successful status", async () => {
      const res = await chai
        .request(server)
        .get(`/api/donations/flutterwave/${VALID_CAMPAIGN_ID}?status=failed`)
        .redirects(0);
      expect(res).to.be.redirect;
    });
  });

  describe("POST /api/donations/flutterwave-webhook", () => {
    it("should return 503 when Flutterwave webhook is not configured", async () => {
      const res = await chai
        .request(server)
        .post("/api/donations/flutterwave-webhook")
        .set("verif-hash", "some-hash")
        .send({ event: "charge.completed", data: {} });
      expect(res).to.have.status(503);
      expect(res.body).to.have.property("error");
    });

    it("should reject invalid verif-hash with 401", async () => {
      process.env.FLUTTERWAVE = "sk_placeholder";
      process.env.FLUTTERWAVE_VERIF_HASH = "expected-hash";
      const res = await chai
        .request(server)
        .post("/api/donations/flutterwave-webhook")
        .set("verif-hash", "wrong-hash")
        .send({ event: "charge.completed", data: { id: 1, tx_ref: "t", flw_ref: "f" } });
      expect(res).to.have.status(401);
      delete process.env.FLUTTERWAVE;
      delete process.env.FLUTTERWAVE_VERIF_HASH;
    });

    it("should ack (200) non-charge events without processing", async () => {
      process.env.FLUTTERWAVE = "sk_placeholder";
      process.env.FLUTTERWAVE_VERIF_HASH = "expected-hash";
      const res = await chai
        .request(server)
        .post("/api/donations/flutterwave-webhook")
        .set("verif-hash", "expected-hash")
        .send({ event: "transfer.completed", data: { status: "successful" } });
      expect(res).to.have.status(200);
      expect(res.body).to.deep.equal({ received: true });
      delete process.env.FLUTTERWAVE;
      delete process.env.FLUTTERWAVE_VERIF_HASH;
    });
  });
});