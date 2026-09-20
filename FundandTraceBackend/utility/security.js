// Security and rate-limiting utilities.

const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { getRedis } = require("./redis");

// Counter for unique prefixes when a limiter has no explicit name, so
// distinct policies (auth vs api vs admin) never share buckets in Redis.
let anonymousLimiterSeq = 0;

// Rate limiter backed by Redis when REDIS_URL is configured (correct limits
// across PM2 cluster instances / containers), falling back to the express-
// rate-limit built-in memory store otherwise (single instance / dev).
//
// passOnStoreError keeps the API available if Redis is briefly unreachable —
// a missed throttle is preferable to a full outage.
exports.rateLimiter = (options = {}) => {
  const windowMs = options.windowMs ?? 15 * 60 * 1000;
  const max = options.max ?? 100;
  const name = options.name || `anon${++anonymousLimiterSeq}`;

  const redis = getRedis();
  const config = {
    windowMs,
    max,
    standardHeaders: "draft-6",
    legacyHeaders: false,
    passOnStoreError: true,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        status: 429,
        error: "Too many requests. Please try again later.",
      });
    },
  };

  if (redis) {
    config.store = new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: `rl:${name}:`,
    });
  }

  return rateLimit(config);
};

exports.securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.removeHeader("X-Powered-By");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' https: data:; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:"
  );
  next();
};

// CSRF protection for cookie-authenticated state-changing requests.
//
// Browsers automatically attach cookies to cross-site POSTs, so an
// attacker-controlled page could trigger state changes on behalf of a logged-in
// donor. Modern browsers always send an Origin header on cross-origin POSTs
// (and on same-origin POSTs), while non-browser clients (curl, server-to-server
// webhooks, bearer-token APIs) do not carry our session cookie.
//
// Rule: if the request carries the session cookie AND is a mutation AND has no
// Authorization header, then an Origin header must be present and match an
// allowed origin — otherwise the request is a CSRF attempt.
exports.csrfOriginGuard = (allowedOrigins) => {
  const origins = (allowedOrigins || []).filter(Boolean);
  return (req, res, next) => {
    const method = req.method || "";
    const hasCookies = Boolean(req.cookies && (req.cookies.token || req.cookies.PHPSESSID));
    const hasBearer = Boolean(
      req.headers.authorization && String(req.headers.authorization).startsWith("Bearer ")
    );

    if (!["POST", "PUT", "PATCH", "DELETE"].includes(method) || !hasCookies || hasBearer) {
      return next();
    }

    const origin = req.headers.origin || "";
    if (origin && origins.includes(origin)) {
      return next();
    }

    // No Origin at all: non-browser client (curl, webhook, internal service).
    // Localhost dev origins are always allowed.
    if (!origin) {
      const host = req.headers.host || "";
      if (origins.some((o) => {
        try {
          return new URL(o).host === host;
        } catch {
          return false;
        }
      }) || /localhost|127\.0\.0\.1/.test(host)) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      status: 403,
      error: "Cross-site request rejected",
    });
  };
};

// Remove operator keys from mutation payloads before they reach Mongo queries.
exports.sanitizeInput = (req, res, next) => {
  if (
    ["POST", "PUT", "PATCH"].includes(req.method) &&
    req.body &&
    !Buffer.isBuffer(req.body)
  ) {
    const sanitize = (value) => {
      if (!value || typeof value !== "object") return;

      Object.keys(value).forEach((key) => {
        if (key.startsWith("$") || key.includes(".")) {
          delete value[key];
        } else if (value[key] && typeof value[key] === "object") {
          sanitize(value[key]);
        }
      });
    };

    sanitize(req.body);
  }
  next();
};
