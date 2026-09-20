const assert = require("assert");
const { requireAuth } = require("../../utility/auth");

describe("Auth Security Middleware", () => {
  it("should reject requests without authorization token with 401", (done) => {
    const req = {
      headers: {},
      cookies: {},
    };
    const res = {
      status(code) {
        assert.strictEqual(code, 401);
        return {
          json(payload) {
            assert.strictEqual(payload.success, false);
            assert.strictEqual(payload.status, 401);
            done();
          },
        };
      },
    };
    const next = () => {
      done(new Error("next() should not be called"));
    };

    requireAuth(req, res, next);
  });
});
