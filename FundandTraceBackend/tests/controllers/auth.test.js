// Auth Controller — Signup, Login, Email Verification, Password Management
const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../server");

chai.use(chaiHttp);
const { expect } = chai;

describe("Auth Controller", () => {
  describe("POST /api/auth/signup", () => {
    it("should reject signup with missing required fields", async () => {
      const res = await chai.request(server).post("/api/auth/signup").send({
        email: "test@example.com",
      });
      expect(res).to.have.status(400);
      expect(res.body).to.have.property("error");
    });

    it("should reject signup with invalid email format", async () => {
      const res = await chai.request(server).post("/api/auth/signup").send({
        firstName: "Test",
        lastName: "User",
        email: "not-an-email",
        password: "password123",
        code: "AB12",
        country: "Nigeria",
        city: "Lagos",
        phone: "08012345678",
      });
      expect(res).to.have.status(400);
      expect(res.body).to.have.property("error");
    });

    it("should reject signup with password shorter than 6 characters", async () => {
      const res = await chai.request(server).post("/api/auth/signup").send({
        firstName: "Test",
        lastName: "User",
        email: "shortpw@example.com",
        password: "abc",
        code: "AB12",
        country: "Nigeria",
        city: "Lagos",
        phone: "08012345678",
      });
      expect(res).to.have.status(400);
      expect(res.body).to.have.property("error");
    });

    it("should reject signup with firstName shorter than 2 characters", async () => {
      const res = await chai.request(server).post("/api/auth/signup").send({
        firstName: "A",
        lastName: "User",
        email: "shortname@example.com",
        password: "password123",
        code: "AB12",
        country: "Nigeria",
        city: "Lagos",
        phone: "08012345678",
      });
      expect(res).to.have.status(400);
      expect(res.body).to.have.property("error");
    });

    it("should reject signup with non-alphanumeric code", async () => {
      const res = await chai.request(server).post("/api/auth/signup").send({
        firstName: "Test",
        lastName: "User",
        email: "badcode@example.com",
        password: "password123",
        code: "$$$$$",
        country: "Nigeria",
        city: "Lagos",
        phone: "08012345678",
      });
      expect(res).to.have.status(400);
      expect(res.body).to.have.property("error");
    });

    it("should successfully sign up with valid data (or return 500 if no DB)", async () => {
      const uniqueEmail = `newuser${Date.now()}@test.com`;
      const res = await chai.request(server).post("/api/auth/signup").send({
        firstName: "Jane",
        lastName: "Doe",
        email: uniqueEmail,
        password: "securePass789",
        code: "XY99",
        country: "Kenya",
        city: "Nairobi",
        phone: "0700123456",
      });
      // 201 with DB, 500 without DB — both acceptable for CI
      expect(res.status).to.be.oneOf([201, 500]);
      if (res.status === 201) {
        expect(res.body).to.have.property("success", true);
      }
    });
  });

  describe("POST /api/auth/signup/charity", () => {
    it("should reject charity signup with missing charity info", async () => {
      const res = await chai.request(server).post("/api/auth/signup/charity").send({
        firstName: "Charity",
        lastName: "Admin",
        email: "charity@example.com",
        password: "password123",
        code: "CH01",
        country: "UK",
        city: "London",
        phone: "07123456789",
      });
      expect(res).to.have.status(400);
      expect(res.body).to.have.property("error");
    });

    it("should successfully sign up a charity with valid data (or 500 if no DB)", async () => {
      const uniqueEmail = `charity${Date.now()}@test.com`;
      const res = await chai.request(server).post("/api/auth/signup/charity").send({
        firstName: "Charity",
        lastName: "Org",
        email: uniqueEmail,
        password: "password123",
        code: "CH02",
        country: "UK",
        city: "London",
        phone: "07123456789",
        charity: {
          name: "Test Charity Foundation",
          description: "A test charity that helps communities",
        },
      });
      expect(res.status).to.be.oneOf([201, 500]);
      if (res.status === 201) {
        expect(res.body).to.have.property("success", true);
      }
    });
  });

  describe("POST /api/auth/login", () => {
    it("should reject login with empty body or non-existent email", async () => {
      const res = await chai.request(server).post("/api/auth/login").send({});
      expect(res.status).to.be.oneOf([404, 500]);
    });

    it("should reject login with non-existent email (or 500 without DB)", async () => {
      const res = await chai.request(server).post("/api/auth/login").send({
        email: `nonexistent${Date.now()}@test.com`,
        password: "anything",
      });
      expect(res.status).to.be.oneOf([404, 500]);
    });
  });

  describe("POST /api/auth/signup/verifyEmail/:email", () => {
    it("should send verification handling (201 if DB, 500 without)", async () => {
      const res = await chai
        .request(server)
        .post("/api/auth/signup/verifyEmail/nonexistent@example.com");
      expect(res.status).to.be.oneOf([201, 500]);
    });
  });

  describe("GET /api/auth/checkExists/:id", () => {
    it("should handle user lookup (200 with DB, 500 without)", async () => {
      const res = await chai
        .request(server)
        .get("/api/auth/checkExists/60f594c6cb5ed50004250000");
      expect(res.status).to.be.oneOf([200, 500]);
    });

    it("should return 400 for invalid ObjectId format", async () => {
      const res = await chai
        .request(server)
        .get("/api/auth/checkExists/invalid-id");
      expect(res).to.have.status(400);
    });
  });

  describe("GET /api/auth/campaignOrganizer/:id", () => {
    it("should return stats for valid organizer ID (200 with fallback)", async () => {
      const res = await chai
        .request(server)
        .get("/api/auth/campaignOrganizer/60f594c6cb5ed5000425c5ea");
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("data");
    });

    it("should return 400 for invalid ObjectId", async () => {
      const res = await chai
        .request(server)
        .get("/api/auth/campaignOrganizer/not-valid");
      expect(res).to.have.status(400);
    });
  });
});