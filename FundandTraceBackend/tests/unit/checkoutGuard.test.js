// Checkout velocity limits and the step-up Turnstile challenge.
process.env.CHECKOUT_IP_MAX = "6";
process.env.CHECKOUT_EMAIL_MAX = "3";
process.env.CHECKOUT_CHALLENGE_AFTER = "2";
process.env.TURNSTILE_SECRET = "ts-secret";
process.env.TURNSTILE_SITE_KEY = "ts-site";
delete process.env.REDIS_URL;

const mockTurnstile = { ok: true, calls: 0 };
jest.mock("axios", () => ({ post: jest.fn(async () => (mockTurnstile.calls++, { data: { success: mockTurnstile.ok } })) }));

const express = require("express");
const request = require("supertest");
const { checkoutGuard } = require("../../utility/checkoutGuard");

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.post("/start", ...checkoutGuard(), (req, res) => res.json({ ok: true }));
const start = (ip, email, token) =>
  request(app).post("/start").set("X-Forwarded-For", ip).send({ customer: { email }, ...(token ? { turnstileToken: token } : {}) });

describe("checkout guard", () => {
  it("lets the first few starts through, then asks for a challenge instead of blocking", async () => {
    expect((await start("198.51.100.1", "a@x.com")).status).toBe(200);
    expect((await start("198.51.100.1", "b@x.com")).status).toBe(200);
    const r = await start("198.51.100.1", "c@x.com");
    expect(r.status).toBe(428);
    expect(r.body).toMatchObject({ code: "challenge_required", siteKey: "ts-site" });
    expect((await start("198.51.100.1", "c@x.com", "good-token")).status).toBe(200);
    mockTurnstile.ok = false;
    expect((await start("198.51.100.1", "d@x.com", "bad-token")).status).toBe(428);
    mockTurnstile.ok = true;
  });

  it("hard-limits one email across different connections", async () => {
    for (const ip of ["198.51.100.20", "198.51.100.21", "198.51.100.22"]) expect((await start(ip, "Card@Tester.com")).status).toBe(200);
    const r = await start("198.51.100.23", "card@tester.com");
    expect(r.status).toBe(429);
    expect(r.body.error).toMatch(/email address/);
  });

  it("hard-limits one connection even with solved challenges", async () => {
    let last;
    for (let i = 0; i < 7; i++) last = await start("198.51.100.30", `u${i}@x.com`, "tok");
    expect(last.status).toBe(429);
    expect(last.body.error).toMatch(/connection/);
  });
});
