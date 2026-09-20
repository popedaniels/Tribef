// Centralized environment validation and configuration access.
//
// The server calls `assertValidConfig()` at startup so that a misconfigured
// production deployment fails fast (with a clear, actionable error) instead of
// silently accepting unsigned webhooks, weak tokens, or placeholder secrets.
//
// Behavior by NODE_ENV:
//   - production : missing/weak required variables throw (fail fast).
//   - test       : validation is skipped entirely (tests load server.js).
//   - development: problems are printed as warnings only.

const logger = require("./logger");

const NODE_ENV = process.env.NODE_ENV || "development";

const IS_PRODUCTION = NODE_ENV === "production";
const IS_TEST = NODE_ENV === "test";

// Universally required to boot the server at all.
const CORE_REQUIRED = ["MONGOURL", "TOKEN_SECRET"];

// Required in production in addition to the core set. These are the variables
// whose absence or weakness would undermine security guarantees (auth tokens,
// reset tokens, at-rest encryption, internal/webhook signing, public URLs).
const PRODUCTION_REQUIRED = [
  ...CORE_REQUIRED,
  "RESET_TOKEN_SECRET",
  "SECURITY_KEY",
  "INTERNAL_WEBHOOK_SECRET",
  "MAINURL",
  "BACKENDURL",
];

// Feature-scoped secrets. These are only needed when the corresponding feature
// is enabled (Stripe/Flutterwave payments, Gmail OAuth email, charity lookup).
// They are reported as warnings in production rather than hard failures so a
// partial deployment is not blocked, but every one used in a live flow must be
// populated before that flow is enabled.
const FEATURE_SECRETS = [
  "STRIPESECRET",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_IDENTITY_WEBHOOK_SECRET",
  "STRIPE_CONNECT_WEBHOOK_SECRET",
  "FLUTTERWAVE",
  "FLUTTERWAVE_VERIF_HASH",
  "PAYSTACK_SECRET",
  "EMAIL",
  "OAUTH_CLIENTID",
  "OAUTH_CLIENT_SECRET",
  "OAUTH_REFRESH_TOKEN",
  "CHARITIES_API",
  "SENTRY_DSN",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
];

// Values that look like the .env.example placeholders rather than real secrets.
const PLACEHOLDER_PATTERN = /(replace|example|changeme|your[_-]?secret|user:password@|00000000000000000000|sk_(test|live)_replace)/i;

const isPlaceholder = (value) =>
  typeof value === "string" && PLACEHOLDER_PATTERN.test(value);

// Validate the current process environment and return a structured report.
// This does NOT throw; callers decide how to react (assertValidConfig does).
function validate() {
  if (IS_TEST) {
    return { ok: true, missing: [], weak: [], featureWarnings: [], problems: [] };
  }

  const required = IS_PRODUCTION ? PRODUCTION_REQUIRED : CORE_REQUIRED;
  const missing = required.filter((key) => !process.env[key]);

  const weak = [];

  // Flag placeholder / obviously-fake values on any required variable.
  required.forEach((key) => {
    if (process.env[key] && isPlaceholder(process.env[key])) {
      weak.push(`${key} (placeholder value)`);
    }
  });

  // Strength checks.
  if (process.env.TOKEN_SECRET && process.env.TOKEN_SECRET.length < 32) {
    weak.push("TOKEN_SECRET (must be at least 32 characters)");
  }
  if (process.env.RESET_TOKEN_SECRET && process.env.RESET_TOKEN_SECRET.length < 32) {
    weak.push("RESET_TOKEN_SECRET (must be at least 32 characters)");
  }
  if (process.env.SECURITY_KEY && !/^[0-9a-fA-F]{64}$/.test(process.env.SECURITY_KEY)) {
    weak.push("SECURITY_KEY (must be 32 bytes hex, i.e. 64 hex characters)");
  }
  if (process.env.INIT_VECTOR && !/^[0-9a-fA-F]{32}$/.test(process.env.INIT_VECTOR)) {
    weak.push("INIT_VECTOR (must be 16 bytes hex, i.e. 32 hex characters)");
  }
  // INIT_VECTOR is only needed to decrypt legacy (pre-v2) encrypted records.
  // Once scripts/migrate-encryption.js has been run it can be removed.

  // Public URLs must be HTTPS in production.
  if (IS_PRODUCTION) {
    ["MAINURL", "BACKENDURL"].forEach((key) => {
      if (process.env[key] && !/^https:\/\//i.test(process.env[key])) {
        weak.push(`${key} (must use https:// in production)`);
      }
    });
  }

  // Feature secrets: warn (production only) if unset or placeholder.
  const featureWarnings = [];
  if (IS_PRODUCTION) {
    if (!process.env.REDIS_URL) {
      featureWarnings.push(
        "REDIS_URL (rate limits fall back to per-instance memory; required for correct limits with multiple instances)"
      );
    }
    FEATURE_SECRETS.forEach((key) => {
      if (!process.env[key]) {
        featureWarnings.push(`${key} (feature secret not set)`);
      } else if (isPlaceholder(process.env[key])) {
        featureWarnings.push(`${key} (placeholder value)`);
      }
    });
  }

  const problems = [...missing, ...weak];
  return { ok: problems.length === 0, missing, weak, featureWarnings, problems };
}

// Throw (production) or warn (development) on invalid configuration.
function assertValidConfig() {
  const result = validate();
  if (result.ok && result.featureWarnings.length === 0) return;

  const lines = [
    ...result.missing.map((key) => `missing: ${key}`),
    ...result.weak.map((key) => `weak: ${key}`),
    ...result.featureWarnings.map((key) => `feature: ${key}`),
  ];

  if (IS_PRODUCTION && (result.missing.length > 0 || result.weak.length > 0)) {
    logger.error({ problems: lines }, "Invalid production configuration");
    throw new Error("Configuration validation failed: " + result.problems.join("; "));
  }

  if (!IS_TEST && lines.length > 0) {
    logger.warn({ problems: lines }, "Configuration warnings");
  }
}

module.exports = {
  NODE_ENV,
  validate,
  assertValidConfig,
  CORE_REQUIRED,
  PRODUCTION_REQUIRED,
  FEATURE_SECRETS,
};
