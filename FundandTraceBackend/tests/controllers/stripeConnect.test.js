// Stripe Express Connect Controller tests
const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../server");

chai.use(chaiHttp);
const { expect } = chai;

const VALID_CAMPAIGN_ID = "60f7117f2ee78d31b4de0f7d";

describe("Stripe Connect Controller", () => {
  describe("GET /api/stripeConnect/status/:id", () => {
    it("should reject without auth (401)", async () => {
      const res = await chai
        .request(server)
        .get(`/api/stripeConnect/status/${VALID_CAMPAIGN_ID}`);
      expect(res).to.have.status(401);
    });
  });

  describe("POST /api/stripeConnect/account/:id", () => {
    it("should reject without auth (401)", async () => {
      const res = await chai
        .request(server)
        .post(`/api/stripeConnect/account/${VALID_CAMPAIGN_ID}`)
        .send({});
      expect(res).to.have.status(401);
    });
  });

  describe("POST /api/stripeConnect/webhook", () => {
    it("should return 503 when Stripe Connect webhook is not configured", async () => {
      const res = await chai
        .request(server)
        .post("/api/stripeConnect/webhook")
        .set("stripe-signature", "t=1,v1=abc")
        .send({ type: "account.updated", data: { object: { id: "acct_1" } } });
      expect(res).to.have.status(503);
      expect(res.body).to.have.property("error");
    });

    it("should reject an invalid signature with 400", async () => {
      // Fresh module instance so `stripe` initializes with the mocked secret.
      process.env.STRIPESECRET = "sk_test_placeholder";
      process.env.STRIPE_CONNECT_WEBHOOK_SECRET = "whsec_placeholder";
      delete require.cache[require.resolve("../../controller/stripeConnect")];
      const controller = require("../../controller/stripeConnect");

      const res = { statusCode: 0, body: null };
      const req = {
        body: { type: "account.updated", data: {} },
        headers: { "stripe-signature": "t=123,v1=bad" },
      };
      await controller.connectWebhook(req, {
        status: (code) => ({
          json: (payload) => {
            res.statusCode = code;
            res.body = payload;
          },
        }),
      });

      expect(res.statusCode).to.equal(400);
      expect(res.body.error).to.match(/signature/i);
      delete process.env.STRIPESECRET;
      delete process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
    });
  });
});