// Checkout velocity limits and bot protection for payment initialisation.
//
// Card testers and bots hammer "start a payment" with stolen cards. The
// fraud score (utility/fraud.js) flags what gets through; this stops the
// flood before a gateway session is even created:
//
//  1. Hard limits, per IP and per donor email -> 429.
//     CHECKOUT_IP_MAX (default 30) and CHECKOUT_EMAIL_MAX (15) per
//     CHECKOUT_WINDOW_MIN (15) minutes.
//  2. Step-up challenge: after CHECKOUT_CHALLENGE_AFTER (5) starts from one
//     IP in the window, further starts need a Cloudflare Turnstile token
//     (only when TURNSTILE_SECRET is set). Ordinary donors never see it; the
//     API answers 428 {code: "challenge_required", siteKey} and the donate
//     page shows the widget and retries.
const axios = require("axios");
const { rateLimiter } = require("./security");
const logger = require("./logger");

const num = (v, d) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d);
const windowMs = () => num(process.env.CHECKOUT_WINDOW_MIN, 15) * 60 * 1000;
const emailOf = (req) => String(req.body?.customer?.email || req.body?.payment?.customer?.email || req.body?.email || "").trim().toLowerCase();

async function verifyTurnstile(token, ip) {
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET, response: String(token).slice(0, 2048) });
    if (ip) body.set("remoteip", ip);
    const { data } = await axios.post("https://challenges.cloudflare.com/turnstile/v0/siteverify", body.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 5000,
    });
    return data?.success === true;
  } catch (err) {
    // Turnstile down: let the donor through (hard limits still apply).
    logger.warn({ err: err?.message }, "Turnstile verification unavailable; allowing");
    return true;
  }
}

// One set of limiters for every checkout route, so starting a one-off and a
// monthly payment count against the same budget.
let guard = null;
function checkoutGuard() {
  if (guard) return guard;
  const hardIp = rateLimiter({
    name: "checkout-ip",
    windowMs: windowMs(),
    max: num(process.env.CHECKOUT_IP_MAX, 30),
    message: "Too many payment attempts from this connection. Please wait a few minutes and try again.",
  });
  const hardEmail = rateLimiter({
    name: "checkout-email",
    windowMs: windowMs(),
    max: num(process.env.CHECKOUT_EMAIL_MAX, 15),
    keyGenerator: (req) => `e:${emailOf(req)}`,
    skip: (req) => !emailOf(req),
    message: "Too many payment attempts for this email address. Please wait a few minutes and try again.",
  });
  const challenge = rateLimiter({
    name: "checkout-challenge",
    windowMs: windowMs(),
    max: num(process.env.CHECKOUT_CHALLENGE_AFTER, 5),
    skip: () => !process.env.TURNSTILE_SECRET,
    handler: async (req, res, next) => {
      const token = req.body?.turnstileToken || req.get?.("cf-turnstile-response");
      if (await verifyTurnstile(token, req.ip)) return next();
      return res.status(428).json({
        status: 428,
        code: "challenge_required",
        siteKey: process.env.TURNSTILE_SITE_KEY || "",
        error: "Please confirm you're not a robot to continue.",
      });
    },
  });
  guard = [hardIp, hardEmail, challenge];
  return guard;
}

module.exports = { checkoutGuard, verifyTurnstile };
