require("dotenv").config();
const logger = require("./utility/logger");
const { initSentry, sentryErrorHandler, captureException } = require("./utility/sentry");
initSentry();
const { assertValidConfig } = require("./utility/config");
assertValidConfig();

const express = require("express");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");

const users = require("./routes/user");
const resetPassword = require("./routes/resetPassword");
const campaigns = require("./routes/campaign");
const startCampaign = require("./routes/startCampaign");
const donations = require("./routes/donations");
const fundingRequests = require("./routes/fundingRequest");
const categories = require("./routes/category");
const waitlist = require("./routes/waitlist");
const admin = require("./routes/admin");
const support = require("./routes/support");
const charities = require("./routes/charity");
const report = require("./routes/reports");
const CampaignEmailWhitelist = require("./routes/campaignEmailWhitelist");
const identity = require("./routes/identity");
const evidence = require("./routes/evidence");
const fxRoutes = require("./routes/fx");
const feeRoutes = require("./routes/fees");
const stripeConnect = require("./routes/stripeConnect");
const recurring = require("./routes/recurring");
const twoFactor = require("./routes/twoFactor");
const discovery = require("./routes/discovery");
const pushSubscriptions = require("./routes/pushSubscriptions");
const ledger = require("./routes/ledger");
const payouts = require("./routes/payouts");

// Web push (no-op without VAPID keys).
require("./services/push").initPush();

const { securityHeaders, rateLimiter, sanitizeInput, csrfOriginGuard } = require("./utility/security");

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);
mongoose.set("bufferCommands", false);

// Connect with retry: mongoose does not retry a failed *initial* connection,
// so without this a database blip during a deploy left the API serving 503s
// until someone restarted it. Readiness (/ready) reports the state meanwhile.
async function connectWithRetry(attempt = 1) {
  try {
    await mongoose.connect(process.env.MONGOURL, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_SELECTION_TIMEOUT_MS || 5000),
      maxPoolSize: Number(process.env.MONGO_POOL_SIZE || 20),
    });
    logger.info("MongoDB Connected Successfully");
  } catch (err) {
    const delay = Math.min(30000, 1000 * 2 ** Math.min(attempt, 5));
    logger.error({ err, attempt, retryInMs: delay }, "MongoDB connection failed; retrying");
    if (!shuttingDown) setTimeout(() => connectWithRetry(attempt + 1), delay).unref();
  }
}
let shuttingDown = false;

if (process.env.MONGOURL && process.env.NODE_ENV !== "test") {
  connectWithRetry();
} else if (!process.env.MONGOURL) {
  logger.error("MONGOURL is not configured");
}

// Request IDs: accept an upstream X-Request-Id (load balancer) or mint one,
// echo it back, and log one line per request with status and duration.
const crypto = require("crypto");
const QUIET_PATHS = new Set(["/live", "/ready", "/health", "/api/health"]);
app.use((req, res, next) => {
  const incoming = String(req.headers["x-request-id"] || "");
  req.id = /^[\w-]{8,64}$/.test(incoming) ? incoming : crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);
  if (QUIET_PATHS.has(req.path) || process.env.NODE_ENV === "test") return next();
  const started = process.hrtime.bigint();
  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    logger[level]({ requestId: req.id, method: req.method, path: req.originalUrl.split("?")[0], status: res.statusCode, ms: Math.round(ms) }, "request");
  });
  next();
});

app.use(securityHeaders);
app.use(
  helmet({
    contentSecurityPolicy: false, // custom CSP in securityHeaders is authoritative
    crossOriginEmbedderPolicy: false,
    hsts: false, // HSTS set in securityHeaders to avoid duplicate headers
  })
);

// Stripe Identity requires the exact raw request body for signature verification.
// (Stripe Connect was missing here, so every Connect webhook failed its
// signature check and organisers' payout status never updated.)
app.use(
  ["/api/identity/webhook", "/api/donations/stripe-webhook", "/api/stripeConnect/webhook"],
  express.raw({ type: "application/json", limit: "1mb" })
);
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
// Keep the exact bytes of HMAC-signed webhooks (Paystack, Flutterwave).
app.use(
  express.json({
    limit: "1mb",
    verify: (req, res, buf) => {
      if (/^\/api\/donations\/(paystack|flutterwave)-webhook/.test(req.originalUrl)) req.rawBody = Buffer.from(buf);
    },
  })
);
app.use(cookieParser());
app.use(sanitizeInput);

const allowedOrigins = [
  process.env.MAINURL,
  "https://www.fundandtrace.com",
  "https://fundandtrace.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

const corsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // 403, not the global handler's default 500: a foreign origin is a
    // client/policy problem, not a server fault, and must not page on-call.
    const corsError = new Error("Origin not allowed by CORS");
    corsError.status = 403;
    return callback(corsError);
  },
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// CSRF: reject cookie-authenticated mutations from unapproved origins.
app.use(csrfOriginGuard(allowedOrigins));

const authLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 50, name: "auth" });
const apiLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 300, name: "api" });
const adminLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 100, name: "admin" });

app.use("/api/auth", authLimiter, users);
app.use("/api/resetPassword", authLimiter, resetPassword);
app.use("/api/campaigns", apiLimiter, campaigns);
app.use("/api/donations", apiLimiter, donations);
app.use("/api/startCampaign", apiLimiter, startCampaign);
app.use("/api/fundingRequests", apiLimiter, fundingRequests);
app.use("/api/categories", apiLimiter, categories);
app.use("/api/waitlist", apiLimiter, waitlist);
app.use("/api/admin", adminLimiter, admin);
app.use("/api/supports", apiLimiter, support);
app.use("/api/reports", apiLimiter, report);
app.use("/api/charities", apiLimiter, charities);
app.use("/api/campaignEmailWhitelist", apiLimiter, CampaignEmailWhitelist);
app.use("/api/identity", apiLimiter, identity);
app.use("/api/evidence", apiLimiter, evidence);
app.use("/api/fx", apiLimiter, fxRoutes);
app.use("/api/fees", apiLimiter, feeRoutes);
app.use("/api/giving", apiLimiter, require("./routes/giving"));
app.use("/api/vendors", apiLimiter, require("./routes/vendors"));
app.use("/api/stripeConnect", apiLimiter, stripeConnect);
app.use("/api/recurring", apiLimiter, recurring);
app.use("/api/auth/2fa", authLimiter, twoFactor);
app.use("/api/discovery", apiLimiter, discovery);
app.use("/api/pushSubscriptions", apiLimiter, pushSubscriptions);
app.use("/api/ledger", apiLimiter, ledger);
app.use("/api/payouts", apiLimiter, payouts);

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

// Liveness: the process is up and serving. Deliberately independent of the
// database so a transient DB outage does not trigger pod restarts.
app.get("/live", (req, res) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// Readiness: the service can serve traffic (database reachable).
const readinessHandler = (req, res) => {
  const databaseConnected = isDatabaseConnected();
  const statusCode = databaseConnected ? 200 : 503;

  res.status(statusCode).json({
    status: databaseConnected ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: databaseConnected ? "connected" : "disconnected",
  });
};

app.get("/ready", readinessHandler);
app.get("/health", readinessHandler);
app.get("/api/health", readinessHandler);

app.get("/", (req, res) => {
  res.json({ message: "FundandTrace API Server is running", version: "1.0.0" });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    status: 404,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Report to Sentry before the terminal handler renders the response.
app.use(sentryErrorHandler());

app.use((err, req, res, next) => {
  captureException(err, { extra: { path: req.originalUrl, method: req.method } });
  logger.error({ err, requestId: req.id }, "Global Error Handler");
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    status: statusCode,
    error: process.env.NODE_ENV === "production" && statusCode === 500
      ? "Internal Server Error"
      : err.message || "Internal Server Error",
    requestId: req.id,
  });
});

if (require.main === module) {
  let scheduler = null;
  const server = app.listen(PORT, () => {
    logger.info({ port: PORT }, "FundandTrace backend server started");

    // Daily jobs (integrity check, ledger anchor, optional gateway
    // reconciliation). Each runs once per UTC day across all instances.
    scheduler = require("./services/scheduler").startScheduler();
  });
  // Slow clients must not hold sockets open forever behind the load balancer.
  server.headersTimeout = 65000;
  server.keepAliveTimeout = 61000;

  // Graceful shutdown (deploys, autoscaling): stop accepting connections,
  // let in-flight requests finish (payouts/refunds mid-call), then close the
  // database. Force-exit after SHUTDOWN_GRACE_MS.
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "Shutting down");
    scheduler?.stop();
    const force = setTimeout(() => {
      logger.error("Graceful shutdown timed out; exiting");
      process.exit(1);
    }, Number(process.env.SHUTDOWN_GRACE_MS || 15000));
    force.unref();
    server.close(async () => {
      await mongoose.disconnect().catch(() => {});
      logger.info("Shutdown complete");
      process.exit(0);
    });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

// A thrown exception leaves the process in an unknown state: log it, report
// it, and exit so the process manager starts a clean one.
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception; exiting");
  try {
    captureException(err);
  } catch {
    /* ignore */
  }
  setTimeout(() => process.exit(1), 500).unref();
});

process.on("unhandledRejection", (err) => {
  logger.error({ err }, "Unhandled Rejection");
});

module.exports = app;
