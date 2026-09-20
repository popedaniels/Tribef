// Conditional Sentry initialization — zero overhead when SENTRY_DSN is unset
// (dev/test), full error tracking in production.
const logger = require("./logger");

let Sentry = null;

function initSentry() {
  if (!process.env.SENTRY_DSN) return null;
  try {
    Sentry = require("@sentry/node");
    const isProd = process.env.NODE_ENV === "production";
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: isProd ? 0.1 : 1.0,
      // Never send request bodies — they can contain donor PII.
      sendDefaultPii: false,
    });
    logger.info("Sentry error tracking enabled");
    return Sentry;
  } catch (err) {
    logger.warn({ err }, "Sentry installed but failed to initialize");
    return null;
  }
}

// Safe capture that works before/if init happened.
function captureException(err, context = {}) {
  if (Sentry) {
    Sentry.captureException(err, context);
  }
}

// Express error-reporting middleware (no-op without Sentry).
function sentryErrorHandler() {
  if (Sentry && typeof Sentry.expressErrorHandler === "function") {
    return Sentry.expressErrorHandler();
  }
  return (req, res, next) => next();
}

const isEnabled = () => Boolean(Sentry);

module.exports = { initSentry, captureException, sentryErrorHandler, isEnabled };
