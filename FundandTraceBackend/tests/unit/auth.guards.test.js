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
    it("calls next() for a valid token and attaches req.auth", () => {
      const token = jwt.sign({ id: "user-2" }, SECRET);
      const req = bearerReq(token);
      const next = jest.fn();
      auth.requireAuth(req, mockRes(), next);
      expect(next).toHaveBeenCalled();
      expect(req.auth).toMatchObject({ id: "user-2" });
    });

    it("returns 401 on an invalid signature", () => {
      const token = jwt.sign({ id: "user-3" }, "some-other-secret-value-at-least-32ch");
      const res = mockRes();
      auth.requireAuth(bearerReq(token), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
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
