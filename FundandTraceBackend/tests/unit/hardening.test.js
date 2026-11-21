// Production hardening: request IDs, webhook handling, signature checks.
process.env.NODE_ENV = "test";
process.env.PAYSTACK_SECRET = "sk_test_hardening";
process.env.STRIPE_CONNECT_WEBHOOK_SECRET = "whsec_test_hardening";

require("../setup"); // same test-only secrets as the Mocha suite
const crypto = require("crypto");
const request = require("supertest");
const express = require("express");
const { rateLimiter, isWebhook } = require("../../utility/security");

let app;
beforeAll(() => {
  app = require("../../server");
});

describe("request IDs", () => {
  it("mints an id and returns it", async () => {
    const res = await request(app).get("/live");
    expect(res.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });
  it("propagates a well-formed upstream id and ignores a malformed one", async () => {
    const ok = await request(app).get("/live").set("X-Request-Id", "lb-abc12345");
    expect(ok.headers["x-request-id"]).toBe("lb-abc12345");
    const bad = await request(app).get("/live").set("X-Request-Id", "<script>");
    expect(bad.headers["x-request-id"]).not.toBe("<script>");
  });
});

describe("webhooks", () => {
  it("are recognised regardless of query string", () => {
    expect(isWebhook({ originalUrl: "/api/donations/paystack-webhook?x=1" })).toBe(true);
    expect(isWebhook({ originalUrl: "/api/donations/initializePaystack/1" })).toBe(false);
  });

  it("are never rate limited, while normal routes are", async () => {
    const limited = express();
    limited.use(rateLimiter({ windowMs: 60000, max: 1, name: `t${Date.now()}` }));
    limited.all("*", (req, res) => res.sendStatus(200));
    const hook = "/api/donations/stripe-webhook";
    for (let i = 0; i < 3; i += 1) expect((await request(limited).post(hook)).status).toBe(200);
    expect((await request(limited).get("/api/campaigns")).status).toBe(200);
    expect((await request(limited).get("/api/campaigns")).status).toBe(429);
  });

  it("Paystack: verifies the signature over the raw bytes, not re-serialised JSON", async () => {
    // Paystack may escape characters that JSON.stringify would not (e.g. "é"
    // for "é"), so a signature over the raw body must still verify.
    const raw = '{"event":"subscription.create","data":{"customer":"Ren\\u00e9e"}}';
    const sig = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET).update(raw).digest("hex");
    const res = await request(app)
      .post("/api/donations/paystack-webhook")
      .set("Content-Type", "application/json")
      .set("x-paystack-signature", sig)
      .send(raw);
    expect(res.status).toBe(200);
  });

  it("Paystack: rejects a bad signature without leaking timing", async () => {
    const res = await request(app)
      .post("/api/donations/paystack-webhook")
      .set("Content-Type", "application/json")
      .set("x-paystack-signature", "0".repeat(128))
      .send('{"event":"charge.success"}');
    expect(res.status).toBe(401);
  });

  it("Stripe Connect: receives the raw body, so a correctly signed event verifies", async () => {
    const Stripe = require("stripe");
    const payload = JSON.stringify({ id: "evt_1", object: "event", type: "ping", data: { object: {} } });
    const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_CONNECT_WEBHOOK_SECRET });
    const res = await request(app)
      .post("/api/stripeConnect/webhook")
      .set("Content-Type", "application/json")
      .set("stripe-signature", header)
      .send(payload);
    // 400 "Invalid webhook signature" was the old behaviour for every event.
    expect(res.status).not.toBe(400);
  });
});
