// Password reset: no account enumeration, and each link works exactly once.
const jwt = require("jsonwebtoken");

const SECRET = "reset-secret-for-unit-tests-0123456789abcdef";
const state = { credential: null };
const mockSend = jest.fn(async () => undefined);

jest.mock("../../models/users", () => ({
  Users: { updateOne: jest.fn(async () => ({ modifiedCount: 1 })) },
  Credentials: { findOne: jest.fn(async () => state.credential) },
}));
jest.mock("../../services/resetPassword", () => ({ resetPasswordMailService: (...a) => mockSend(...a) }));
jest.mock("../../services/activityLog", () => ({ addActivity: jest.fn() }));

const res = () => {
  const r = { statusCode: null, body: null };
  r.status = (c) => {
    r.statusCode = c;
    return r;
  };
  r.json = (b) => {
    r.body = b;
    return r;
  };
  return r;
};

describe("password reset", () => {
  let controller;
  beforeAll(() => {
    process.env.RESET_TOKEN_SECRET = SECRET;
    controller = require("../../controller/resetPassword");
  });
  beforeEach(() => {
    mockSend.mockClear();
    state.credential = { password: "$2b$10$originalhash", save: jest.fn(async function () {}) };
  });

  it("returns the same response for unknown and known emails", async () => {
    const known = res();
    await controller.verifyEmail({ params: { email: "a@b.com" } }, known);
    state.credential = null;
    const unknown = res();
    await controller.verifyEmail({ params: { email: "nobody@b.com" } }, unknown);

    expect(known.statusCode).toBe(201);
    expect(unknown.statusCode).toBe(201);
    expect(unknown.body).toEqual(known.body);
    expect(mockSend).toHaveBeenCalledTimes(1); // only the real account gets mail
  });

  it("accepts a fresh link once and rejects it after the password changed", async () => {
    await controller.verifyEmail({ params: { email: "a@b.com" } }, res());
    const token = mockSend.mock.calls[0][1];

    const first = res();
    await controller.resetPassword({ body: { email: "a@b.com", password: "new-password-1", token } }, first);
    expect(first.statusCode).toBe(201);
    expect(state.credential.password).not.toBe("$2b$10$originalhash");
    // every existing session is revoked
    expect(require("../../models/users").Users.updateOne).toHaveBeenCalledWith(
      { email: "a@b.com" },
      { $inc: { sessionVersion: 1 } }
    );

    const replay = res();
    await controller.resetPassword({ body: { email: "a@b.com", password: "new-password-2", token } }, replay);
    expect(replay.statusCode).toBe(400);
  });

  it("rejects legacy tokens without a password fingerprint", async () => {
    const legacy = jwt.sign({ email: "a@b.com" }, SECRET, { expiresIn: "15m" });
    const r = res();
    await controller.resetPassword({ body: { email: "a@b.com", password: "new-password-1", token: legacy } }, r);
    expect(r.statusCode).toBe(400);
  });
});
