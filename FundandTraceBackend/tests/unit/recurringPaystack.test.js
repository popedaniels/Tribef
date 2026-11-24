// Monthly giving on Paystack: plan per subscription, renewals matched by plan code.
process.env.PAYSTACK_SECRET = "sk_test_unit";
process.env.MAINURL = "https://app.test";

const db = { subs: [], donations: [], credited: [], posted: [] };
jest.mock("axios", () => ({
  __esModule: true,
  default: {
    post: jest.fn(async (url, body) => {
      db.posted.push([url, body]);
      if (url.endsWith("/plan")) return { data: { data: { plan_code: "PLN_1" } } };
      if (url.endsWith("/transaction/initialize")) return { data: { data: { authorization_url: "https://checkout.paystack.com/x" } } };
      return { data: { status: true } };
    }),
  },
}));
jest.mock("../../utility/fraud", () => ({
  getClientIp: () => "203.0.113.5",
  assessDonation: async () => ({ score: 0, reasons: [], ip: "203.0.113.5" }),
  withCardSignals: async (s) => s,
  FLAG_THRESHOLD: 50,
}));
jest.mock("../../services/targetReached", () => ({ notifyTargetReachedIfNeeded: jest.fn() }));
jest.mock("../../models/subscriptionModel", () => {
  const match = (s, q) => Object.entries(q).every(([k, v]) => String(s[k]) === String(v));
  return {
    Subscription: {
      create: jest.fn(async (d) => {
        const s = { _id: "sub1", ...d };
        db.subs.push(s);
        return s;
      }),
      findOne: jest.fn(async (q) => db.subs.find((s) => match(s, q)) || null),
      findById: jest.fn(() => ({ select: async () => db.subs[0] })),
      updateOne: jest.fn(async (q, u) => {
        const s = db.subs.find((x) => match(x, q));
        if (s) {
          Object.assign(s, u.$set || {});
          for (const [k, v] of Object.entries(u.$inc || {})) s[k] = (s[k] || 0) + v;
        }
        return {};
      }),
    },
  };
});
jest.mock("../../controller/donations/shared", () => {
  const real = jest.requireActual("../../controller/donations/shared");
  return {
    ...real,
    Campaign: { findOne: () => ({ maxTimeMS: async () => ({ _id: "c1", funding: { currency: "NGN" }, basicInformation: { campaignTitle: "Clinic roof" }, disputeGovernance: {} }) }) },
    Donations: {
      findOne: jest.fn(async (q) => db.donations.find((d) => q.$or.some((o) => d.transactionId === o.transactionId)) || null),
      create: jest.fn(async (d) => db.donations.push(d)),
    },
    creditCampaign: jest.fn(async (id, amount) => db.credited.push(amount)),
    sendDonationMailSafely: jest.fn(),
    addActivity: jest.fn(),
    checkoutCurrency: () => "NGN",
  };
});

const ctrl = require("../../controller/recurringPaystack");
const fees = require("../../services/fees");

const res = () => ({ status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } });

describe("Paystack monthly giving", () => {
  it("creates a monthly plan for donation + card fee and starts checkout on it", async () => {
    const fee = fees.quote({ rail: "paystack", currency: "NGN", base: 5000 }).fee;
    const r = res();
    await ctrl.createPaystackSubscription(
      { params: { id: "c1" }, headers: {}, body: { amount: 5000 + fee, currency: "NGN", meta: { tip: 0, processingFee: fee }, customer: { email: "Ada@X.com", name: "Ada" } } },
      r
    );
    expect(r.code).toBe(200);
    const plan = db.posted.find(([u]) => u.endsWith("/plan"))[1];
    expect(plan).toMatchObject({ interval: "monthly", currency: "NGN", amount: Math.round((5000 + fee) * 100) });
    const init = db.posted.find(([u]) => u.endsWith("/transaction/initialize"))[1];
    expect(init).toMatchObject({ plan: "PLN_1", metadata: { subscriptionId: "sub1", recurring: "true", amount: "5000" } });
    expect(db.subs[0]).toMatchObject({ gateway: "paystack", amount: 5000, processingFee: fee, subscriberEmail: "ada@x.com", status: "incomplete" });
  });

  it("refuses tips on monthly gifts", async () => {
    const fee = fees.quote({ rail: "paystack", currency: "NGN", base: 5500 }).fee;
    const r = res();
    await ctrl.createPaystackSubscription({ params: { id: "c1" }, headers: {}, body: { amount: 5500 + fee, meta: { tip: 500, processingFee: fee }, customer: { email: "a@x.com" } } }, r);
    expect(r.code).toBe(400);
  });

  it("stores the subscription code on subscription.create", async () => {
    await ctrl.handlePaystackSubscriptionEvent({ event: "subscription.create", data: { plan: { plan_code: "PLN_1" }, subscription_code: "SUB_9", email_token: "tok", next_payment_date: "2026-12-24T00:00:00Z" } });
    expect(db.subs[0]).toMatchObject({ paystackSubscriptionCode: "SUB_9", paystackEmailToken: "tok", status: "active" });
  });

  it("records and credits a renewal once, for the donation only", async () => {
    const sub = db.subs[0];
    const ev = { event: "charge.success", data: { status: "success", reference: "R-2", amount: Math.round((sub.amount + sub.processingFee) * 100), currency: "NGN", plan: { plan_code: "PLN_1" }, customer: { email: "ada@x.com" }, metadata: {} } };
    expect(await ctrl.handlePaystackSubscriptionEvent(ev)).toBe(true);
    expect(await ctrl.handlePaystackSubscriptionEvent(ev)).toBe(true);
    expect(db.donations).toHaveLength(1);
    expect(db.donations[0]).toMatchObject({ amount: 5000, transactionId: "R-2", paymentMethod: "paystack" });
    expect(db.credited).toEqual([5000]);
    expect(db.subs[0].totalDonated).toBe(5000);
  });

  it("doesn't credit a renewal whose amount or customer doesn't match the plan", async () => {
    const base = { status: "success", currency: "NGN", plan: { plan_code: "PLN_1" }, metadata: {} };
    await ctrl.handlePaystackSubscriptionEvent({ event: "charge.success", data: { ...base, reference: "R-3", amount: 100, customer: { email: "ada@x.com" } } });
    await ctrl.handlePaystackSubscriptionEvent({ event: "charge.success", data: { ...base, reference: "R-4", amount: 999999, customer: { email: "mallory@x.com" } } });
    expect(db.donations).toHaveLength(1);
  });

  it("leaves first charges (with our metadata) to the normal recorder", async () => {
    expect(await ctrl.handlePaystackSubscriptionEvent({ event: "charge.success", data: { status: "success", plan: { plan_code: "PLN_1" }, metadata: { campaignId: "c1" } } })).toBe(false);
  });

  it("cancels through Paystack's disable endpoint", async () => {
    await ctrl.disablePaystackSubscription(db.subs[0]);
    expect(db.posted.at(-1)).toEqual(["https://api.paystack.co/subscription/disable", { code: "SUB_9", token: "tok" }]);
  });
});
