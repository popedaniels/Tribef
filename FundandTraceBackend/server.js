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
const stripeConnect = require("./routes/stripeConnect");
const recurring = require("./routes/recurring");
const twoFactor = require("./routes/twoFactor");
const discovery = require("./routes/discovery");
const pushSubscriptions = require("./routes/pushSubscriptions");

// Web push (no-op without VAPID keys).
require("./services/push").initPush();

const { securityHeaders, rateLimiter, sanitizeInput, csrfOriginGuard } = require("./utility/security");

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);
mongoose.set("bufferCommands", false);

if (process.env.MONGOURL) {
  mongoose
    .connect(process.env.MONGOURL, {
      serverSelectionTimeoutMS: 2000,
    })
    .then(() => logger.info("MongoDB Connected Successfully"))
    .catch((err) => logger.error({ err }, "MongoDB connection failed"));
} else {
  logger.error("MONGOURL is not configured");
}

app.use(securityHeaders);
app.use(
  helmet({
    contentSecurityPolicy: false, // custom CSP in securityHeaders is authoritative
    crossOriginEmbedderPolicy: false,
    hsts: false, // HSTS set in securityHeaders to avoid duplicate headers
  })
);

// Stripe Identity requires the exact raw request body for signature verification.
app.use(
  ["/api/identity/webhook", "/api/donations/stripe-webhook"],
  express.raw({ type: "application/json", limit: "1mb" })
);
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(express.json({ limit: "1mb" }));
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
    return callback(new Error("Origin not allowed by CORS"));
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
app.use("/api/stripeConnect", apiLimiter, stripeConnect);
app.use("/api/recurring", apiLimiter, recurring);
app.use("/api/auth/2fa", authLimiter, twoFactor);
app.use("/api/discovery", apiLimiter, discovery);
app.use("/api/pushSubscriptions", apiLimiter, pushSubscriptions);

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
  logger.error({ err }, "Global Error Handler");
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    status: statusCode,
    error: process.env.NODE_ENV === "production" && statusCode === 500
      ? "Internal Server Error"
      : err.message || "Internal Server Error",
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, "FundandTrace backend server started");

    // Optional daily reconciliation sweep (multi-instance safe via Redis lock).
    if (process.env.RECONCILE_DAILY === "true") {
      const { runReconciliation } = require("./services/reconciliation");
      const run = () => runReconciliation({ days: 1 }).catch((err) =>
        logger.error({ err }, "Scheduled reconciliation failed")
      );
      setInterval(run, 24 * 60 * 60 * 1000).unref();
      setTimeout(run, 30 * 1000).unref();
    }
  });
}

process.on("unhandledRejection", (err) => {
  logger.error({ err }, "Unhandled Rejection");
});

module.exports = app;
