// Admin Controller — Login, Overview Stats, Campaign Management
const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../server");

chai.use(chaiHttp);
const { expect } = chai;

describe("Admin Controller", () => {
  describe("POST /api/admin/login", () => {
    it("should reject login with empty body", async () => {
      const res = await chai.request(server).post("/api/admin/login").send({});
      expect(res.status).to.be.oneOf([404, 500]);
    });

    it("should reject login with non-existent email", async () => {
      const res = await chai.request(server).post("/api/admin/login").send({
        email: `admin_nonexistent_${Date.now()}@test.com`,
        password: "anything",
      });
      expect(res.status).to.be.oneOf([404, 500]);
    });
  });

  describe("GET /api/admin/overview", () => {
    it("should require authorization token (401 without)", async () => {
      const res = await chai.request(server).get("/api/admin/overview");
      expect(res).to.have.status(401);
    });
  });

  describe("GET /api/admin/campaigns", () => {
    it("should require authorization token (401 without)", async () => {
      const res = await chai.request(server).get("/api/admin/campaigns/1");
      expect(res).to.have.status(401);
    });
  });

  describe("GET /api/admin/users", () => {
    it("should require authorization token (401 without)", async () => {
      const res = await chai.request(server).get("/api/admin/users/1");
      expect(res).to.have.status(401);
    });
  });

  describe("GET /api/admin/fundingRequests", () => {
    it("should require authorization token (401 without)", async () => {
      const res = await chai.request(server).get("/api/admin/fundingRequests/1");
      expect(res).to.have.status(401);
    });
  });
});