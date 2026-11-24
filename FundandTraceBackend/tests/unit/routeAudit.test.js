// Security review, automated: every state-changing API route must be behind
// an auth guard, or be on this reviewed allowlist with a reason. A new public
// POST/PUT/PATCH/DELETE fails CI until someone looks at it.
process.env.NODE_ENV = "test";
require("../setup");

const GUARDS = new Set(["requireAuth", "requireAdmin", "requireInternalWebhook"]);

// method path → why it is safe without a session
const PUBLIC = {
  "POST /api/auth/signup": "account creation",
  "POST /api/auth/signup/charity": "account creation",
  "POST /api/auth/login": "login",
  "POST /api/auth/logout": "clears the caller's own cookie",
  "POST /api/auth/signup/verifyEmail/:p": "single-use emailed token",
  "POST /api/auth/2fa/challenge": "second login step; requires the short-lived login ticket",
  "POST /api/resetPassword/": "single-use reset token in body",
  "POST /api/resetPassword/sendResetMail/:p": "sends to the address on file; rate-limited, no enumeration",
  "POST /api/admin/login": "admin login (rate-limited)",
  "POST /api/donations/initialize": "guest checkout (amount/fee validated server-side)",
  "POST /api/donations/createStripeSession/:p": "guest checkout",
  "POST /api/donations/initializePaystack/:p": "guest checkout",
  "POST /api/recurring/subscribe/:p": "guest checkout (monthly)",
  "POST /api/recurring/paystack/:p": "guest checkout (monthly, Paystack)",
  "POST /api/donations/stripe-webhook": "Stripe signature verified in handler",
  "POST /api/donations/paystack-webhook": "Paystack HMAC verified in handler",
  "POST /api/donations/flutterwave-webhook": "Flutterwave verif-hash checked in handler",
  "POST /api/stripeConnect/webhook": "Stripe signature verified in handler",
  "POST /api/identity/webhook": "Stripe signature verified in handler",
  "POST /api/evidence/sessions/:p/media/:p": "per-session capture token checked in handler",
  "POST /api/evidence/sessions/:p/submit": "per-session capture token checked in handler",
  "POST /api/waitlist/:p": "newsletter signup",
  "POST /api/supports/": "contact form",
  "POST /api/reports/": "public 'report this campaign'",
  "POST /api/pushSubscriptions/": "browser push; account bound only from the session",
  "DELETE /api/pushSubscriptions/": "unsubscribe by the unguessable endpoint URL",
  "POST /api/email/unsubscribe": "HMAC token over email + scope checked in handler; only ever opts out",
};

function routes(app) {
  const out = [];
  const walk = (stack, prefix, inherited) => {
    const routerGuards = [];
    for (const layer of stack) {
      if (layer.route) {
        for (const m of Object.keys(layer.route.methods)) {
          out.push({ method: m.toUpperCase(), path: prefix + layer.route.path, guards: [...inherited, ...routerGuards, ...layer.route.stack.map((s) => s.name)] });
        }
      } else if (layer.name === "router" && layer.handle?.stack) {
        const src = layer.regexp.source
          .replace(/^\^/, "")
          .replace("\\/?(?=\\/|$)", "")
          .replace(/\\\//g, "/")
          .replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ":p");
        walk(layer.handle.stack, prefix + src, [...inherited, ...routerGuards]);
      } else if (layer.name) {
        routerGuards.push(layer.name); // router.use(requireAdmin) etc.
      }
    }
  };
  walk(app._router.stack, "", []);
  return out.map((r) => ({ ...r, key: `${r.method} ${r.path.replace(/\/:[A-Za-z_]+/g, "/:p")}` }));
}

describe("route authorisation audit", () => {
  const app = require("../../server");
  const all = routes(app).filter((r) => ["POST", "PUT", "PATCH", "DELETE"].includes(r.method));

  it("finds the API's mutating routes", () => {
    expect(all.length).toBeGreaterThan(50);
  });

  it("guards every mutating route, or lists it as reviewed-public", () => {
    const unguarded = all.filter((r) => !r.guards.some((g) => GUARDS.has(g)) && !PUBLIC[r.key]).map((r) => r.key);
    expect(unguarded).toEqual([]);
  });

  it("never relies on requireCampaignOwner without a session guard before it", () => {
    const bad = all.filter((r) => r.guards.includes("requireCampaignOwner") && !r.guards.slice(0, r.guards.indexOf("requireCampaignOwner")).some((g) => GUARDS.has(g))).map((r) => r.key);
    expect(bad).toEqual([]);
  });

  it("keeps the allowlist honest (no stale entries)", () => {
    const keys = new Set(all.map((r) => r.key));
    expect(Object.keys(PUBLIC).filter((k) => !keys.has(k))).toEqual([]);
  });
});
