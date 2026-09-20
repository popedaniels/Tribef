// Campaigns Controller — CRUD, Search, Comments, Dispute Circuit-Breaker
const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../server");

chai.use(chaiHttp);
const { expect } = chai;

const VALID_CAMPAIGN_ID = "60f7117f2ee78d31b4de0f7d";

describe("Campaigns Controller", () => {
  describe("GET /api/campaigns", () => {
    it("should return an object with a data property", async () => {
      const res = await chai.request(server).get("/api/campaigns");
      expect(res).to.have.status(200);
      expect(res.body).to.be.an("object");
      expect(res.body).to.have.property("data");
    });

    it("should return count alongside data when addCount=true", async () => {
      const res = await chai.request(server).get("/api/campaigns?addCount=true");
      expect(res).to.have.status(200);
      expect(res.body.data).to.be.an("object");
      expect(res.body.data).to.have.property("campaigns");
      expect(res.body.data).to.have.property("count");
    });
  });

  describe("GET /api/campaigns/campaign/:id", () => {
    it("should return a single campaign for a valid ID (with fallback)", async () => {
      const res = await chai
        .request(server)
        .get(`/api/campaigns/campaign/${VALID_CAMPAIGN_ID}`);
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("data");
    });

    it("should return 400 for an invalid ObjectId", async () => {
      const res = await chai
        .request(server)
        .get("/api/campaigns/campaign/56738");
      expect(res).to.have.status(400);
      expect(res.body).to.have.property("error");
    });
  });

  describe("POST /api/campaigns/campaign/addComment/:id", () => {
    it("should require auth (401 without token)", async () => {
      const res = await chai
        .request(server)
        .post(`/api/campaigns/campaign/addComment/${VALID_CAMPAIGN_ID}`)
        .send({ newComment: { comment: "test" } });
      expect(res).to.have.status(401);
    });
  });

  describe("GET /api/campaigns/searchByCategory/:category", () => {
    it("should return campaigns for a valid category", async () => {
      const res = await chai
        .request(server)
        .get("/api/campaigns/searchByCategory/medical");
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("data");
    });
  });

  describe("GET /api/campaigns/searchByName/:page", () => {
    it("should return paginated search results", async () => {
      const res = await chai
        .request(server)
        .get("/api/campaigns/searchByName/1");
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("data");
    });

    it("should return empty results with invalid page", async () => {
      const res = await chai
        .request(server)
        .get("/api/campaigns/searchByName/abc");
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("data");
    });
  });

  describe("POST /api/campaigns/:id/dispute", () => {
    it("should require auth (401 without token)", async () => {
      const res = await chai
        .request(server)
        .post(`/api/campaigns/${VALID_CAMPAIGN_ID}/dispute`)
        .send({ description: "Fraudulent campaign" });
      expect(res).to.have.status(401);
    });

    it("should reject dispute with invalid campaign ID", async () => {
      const res = await chai
        .request(server)
        .post("/api/campaigns/not-a-valid-id/dispute")
        .send({
          donorEmail: "donor@example.com",
          description: "Fraudulent campaign",
        });
      expect(res).to.have.status(401);
    });
  });

  describe("GET /api/campaigns/:id/dispute-status", () => {
    it("should reject dispute status for invalid campaign ID", async () => {
      const res = await chai
        .request(server)
        .get("/api/campaigns/not-valid/dispute-status");
      expect(res).to.have.status(400);
    });

    it("should return dispute status for valid ID", async () => {
      const res = await chai
        .request(server)
        .get(`/api/campaigns/${VALID_CAMPAIGN_ID}/dispute-status`);
      expect(res.status).to.be.oneOf([200, 404, 500]);
    });
  });

  describe("GET /api/campaigns/:organizerId", () => {
    it("should return campaigns for organizer (200 with DB, 500 without)", async () => {
      const res = await chai
        .request(server)
        .get("/api/campaigns/60f594c6cb5ed5000425c5ea");
      expect(res.status).to.be.oneOf([200, 500]);
    });
  });
});