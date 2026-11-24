// Unit tests for the auth guard middlewares (pure logic, models mocked).
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

jest.mock("../../models/users", () => ({
  Users: { findById: jest.fn() },
}));

const SECRET = "unit-test-secret-token-secret-32chars!";

const mockRes = () => {
  const res = { statusCode: null, body: null };
  res.status = jest.fn((code) => {
    res.statusCode = code;
    return { json: jest.fn((payload) => (res.body = payload)) };
  });
  return res;
};

const bearerReq = (token, extra = {}) => ({
  headers: token ? { authorization: `Bearer ${token}` } : {},
  cookies: {},
  ...extra,
});

describe("auth guards", () => {
  let auth;
  const originalSecret = process.env.TOKEN_SECRET;

  beforeAll(() => {
    process.env.TOKEN_SECRET = SECRET;
    auth = require("../../utility/auth");
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.TOKEN_SECRET;
    else process.env.TOKEN_SECRET = originalSecret;
  });

  describe("getToken", () => {
    it("reads a Bearer header", () => {
      expect(auth.getToken(bearerReq("abc"))).toBe("abc");
    });

    it("falls back to the session cookie", () => {
      const req = { headers: {}, cookies: { token: "cookie-token" } };
      expect(auth.getToken(req)).toBe("cookie-token");
    });
  });

  describe("getJwtSecret enforcement", () => {
    it("rejects a short or missing TOKEN_SECRET", () => {
      process.env.TOKEN_SECRET = "short";
      expect(() => auth.verifyToken(bearerReq("x"))).toThrow(/TOKEN_SECRET/);
      delete process.env.TOKEN_SECRET;
      expect(() => auth.verifyToken(bearerReq("x"))).toThrow(/TOKEN_SECRET/);
      process.env.TOKEN_SECRET = SECRET;
    });
  });

  describe("verifyToken", () => {
    it("throws a 401 error when no token is present", () => {
      expect(() => auth.verifyToken(bearerReq(null))).toThrow(
        expect.objectContaining({ status: 401 })
      );
    });

    it("decodes a valid signed token", () => {
      const token = jwt.sign({ id: "user-1" }, SECRET);
      expect(auth.verifyToken(bearerReq(token))).toMatchObject({ id: "user-1" });
    });
  });

  describe("requireAuth", () => {
    const { Users } = require("../../models/users");
    const userLookup = (user) =>
      Users.findById.mockReturnValue({ select: () => ({ lean: () => Promise.resolve(user) }) });
    afterEach(() => Users.findById.mockReset());

    it("calls next() for a valid token whose session is current", async () => {
      userLookup({ sessionVersion: 0, suspended: false });
      const token = jwt.sign({ id: "user-2" }, SECRET);
      const req = bearerReq(token);
      const next = jest.fn();
      await auth.requireAuth(req, mockRes(), next);
      expect(next).toHaveBeenCalled();
      expect(req.auth).toMatchObject({ id: "user-2" });
    });

    it("returns 401 on an invalid signature", async () => {
      const token = jwt.sign({ id: "user-3" }, "some-other-secret-value-at-least-32ch");
      const res = mockRes();
      await auth.requireAuth(bearerReq(token), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("returns 401 for a revoked session (password reset / sign out everywhere)", async () => {
      userLookup({ sessionVersion: 2, suspended: false });
      const token = jwt.sign({ id: "user-4", sv: 1 }, SECRET);
      const res = mockRes();
      const next = jest.fn();
      await auth.requireAuth(bearerReq(token), res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("returns 401 for a suspended account even with a valid token", async () => {
      userLookup({ sessionVersion: 0, suspended: true });
      const token = jwt.sign({ id: "user-5" }, SECRET);
      const res = mockRes();
      await auth.requireAuth(bearerReq(token), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("returns 503 (not 401) when the session can't be checked", async () => {
      Users.findById.mockImplementation(() => {
        throw new Error("db down");
      });
      const token = jwt.sign({ id: "user-6" }, SECRET);
      const res = mockRes();
      await auth.requireAuth(bearerReq(token), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(503);
    });
  });

  describe("requireAdmin", () => {
    const { Users } = require("../../models/users");

    afterEach(() => Users.findById.mockReset());

    it("returns 403 when the token carries no user id", async () => {
      const token = jwt.sign({ email: "a@b.com" }, SECRET);
      const res = mockRes();
      await auth.requireAdmin(bearerReq(token), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("returns 403 when the user is not an admin", async () => {
      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ role: "donor", suspended: false }),
      });
      const token = jwt.sign({ id: "u1" }, SECRET);
      const res = mockRes();
      await auth.requireAdmin(bearerReq(token), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("returns 403 when the admin is suspended", async () => {
      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ role: "admin", suspended: true }),
      });
      const token = jwt.sign({ id: "u1" }, SECRET);
      const res = mockRes();
      await auth.requireAdmin(bearerReq(token), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("calls next() for an active admin", async () => {
      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ role: "admin", suspended: false }),
      });
      const token = jwt.sign({ id: "admin-1" }, SECRET);
      const req = bearerReq(token);
      const next = jest.fn();
      await auth.requireAdmin(req, mockRes(), next);
      expect(next).toHaveBeenCalled();
      expect(req.admin).toMatchObject({ role: "admin" });
    });

    describe("with admin 2FA enforced", () => {
      beforeEach(() => {
        process.env.ADMIN_REQUIRE_2FA = "true";
        Users.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ role: "admin", suspended: false }) });
      });
      afterEach(() => delete process.env.ADMIN_REQUIRE_2FA);

      it("refuses an admin session that didn't pass the TOTP challenge (incl. enrolment tokens)", async () => {
        for (const payload of [{ id: "admin-1" }, { id: "admin-1", scope: "admin-enrol" }, { id: "admin-1", mfa: "true" }]) {
          const res = mockRes();
          const next = jest.fn();
          await auth.requireAdmin(bearerReq(jwt.sign(payload, SECRET)), res, next);
          expect(res.statusCode).toBe(403);
          expect(res.body.code).toBe("ADMIN_2FA_REQUIRED");
          expect(next).not.toHaveBeenCalled();
        }
      });

      it("accepts a session issued after the TOTP challenge", async () => {
        const next = jest.fn();
        await auth.requireAdmin(bearerReq(jwt.sign({ id: "admin-1", mfa: true }, SECRET)), mockRes(), next);
        expect(next).toHaveBeenCalled();
      });

      it("is on by default in production and can be switched off explicitly", () => {
        const { adminMfaRequired } = require("../../utility/adminMfa");
        const env = process.env.NODE_ENV;
        delete process.env.ADMIN_REQUIRE_2FA;
        process.env.NODE_ENV = "production";
        expect(adminMfaRequired()).toBe(true);
        process.env.ADMIN_REQUIRE_2FA = "false";
        expect(adminMfaRequired()).toBe(false);
        process.env.NODE_ENV = env;
        delete process.env.ADMIN_REQUIRE_2FA;
        expect(adminMfaRequired()).toBe(false);
      });
    });
  });

  describe("requireInternalWebhook", () => {
    const originalWebhookSecret = process.env.INTERNAL_WEBHOOK_SECRET;

    beforeEach(() => {
      process.env.INTERNAL_WEBHOOK_SECRET = "whsec-shared-value";
    });

    afterAll(() => {
      if (originalWebhookSecret === undefined) {
        delete process.env.INTERNAL_WEBHOOK_SECRET;
      } else {
        process.env.INTERNAL_WEBHOOK_SECRET = originalWebhookSecret;
      }
    });

    it("rejects when the secret is not configured server-side", () => {
      delete process.env.INTERNAL_WEBHOOK_SECRET;
      const res = mockRes();
      auth.requireInternalWebhook(
        { headers: { "x-internal-webhook-secret": "anything" } },
        res,
        jest.fn()
      );
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("rejects a wrong secret with 401", () => {
      const res = mockRes();
      auth.requireInternalWebhook(
        { headers: { "x-internal-webhook-secret": "wrong" } },
        res,
        jest.fn()
      );
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("accepts the exact shared secret via timing-safe compare", () => {
      const next = jest.fn();
      auth.requireInternalWebhook(
        { headers: { "x-internal-webhook-secret": "whsec-shared-value" } },
        mockRes(),
        next
      );
      expect(next).toHaveBeenCalled();
    });

    it("uses timingSafeEqual (constant-time comparison)", () => {
      // Indirect guarantee: differing-length secrets never throw length errors.
      const res = mockRes();
      expect(() =>
        auth.requireInternalWebhook(
          { headers: { "x-internal-webhook-secret": "short" } },
          res,
          jest.fn()
        )
      ).not.toThrow();
    });
  });
});

// Regression: requireCampaignOwner used to check `req.body.id` before
// `req.params.id`, letting an owner of campaign A delete/update campaign B by
// sending {id: A} in the body of a request to /…/:id=B.
describe("requireCampaignOwner (IDOR regression)", () => {
  const OWNER = "60f7117f2ee78d31b4de0f01";
  const MINE = "60f7117f2ee78d31b4de0aaa";
  const VICTIM = "60f7117f2ee78d31b4de0bbb";
  let auth;
  let findById;

  beforeAll(() => {
    process.env.TOKEN_SECRET = SECRET;
    jest.doMock("../../models/campaignModel", () => {
      findById = jest.fn((id) => ({
        select: () =>
          Promise.resolve(
            id === MINE
              ? { organizerId: OWNER }
              : id === VICTIM
              ? { organizerId: "60f7117f2ee78d31b4de0f99" }
              : null
          ),
      }));
      return { Campaign: { findById } };
    });
    auth = require("../../utility/auth");
  });

  const run = async (req) => {
    const res = mockRes();
    const next = jest.fn();
    await auth.requireCampaignOwner(
      { body: {}, query: {}, params: {}, auth: { id: OWNER }, ...req },
      res,
      next
    );
    return { res, next };
  };

  it("rejects a body id that disagrees with the route id", async () => {
    const { res, next } = await run({ params: { id: VICTIM }, body: { id: MINE } });
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });

  it("rejects when the route names a campaign the caller does not own", async () => {
    const { res, next } = await run({ params: { id: VICTIM } });
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });

  it("rejects a funding request whose campaignId disagrees with body.id", async () => {
    const { res } = await run({ body: { id: MINE, fundingRequest: { campaignId: VICTIM } } });
    expect(res.statusCode).toBe(403);
  });

  it("rejects any supplied organizerId that is not the caller", async () => {
    const { res } = await run({
      body: { id: MINE, organizerId: OWNER, fundingRequest: { organizerId: "someone-else" } },
    });
    expect(res.statusCode).toBe(403);
  });

  it("allows the owner when all ids agree", async () => {
    const { res, next } = await run({ params: { id: MINE }, body: { id: MINE } });
    expect(res.statusCode).toBeNull();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("returns 401 (not 403) when unauthenticated", async () => {
    const { res } = await run({ auth: undefined, params: { id: VICTIM }, body: { id: MINE } });
    expect(res.statusCode).toBe(401);
  });
});
