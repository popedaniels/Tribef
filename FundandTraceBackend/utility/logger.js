// Structured JSON logger backed by pino.
// Replaces ad-hoc console.log/warn/error calls across the backend with
// level-aware, timestamped, and optionally redacted structured output.
//
// In development, output is pretty-printed for readability.
// In production/staging, output is newline-delimited JSON (ndjson) suitable
// for ingestion by log aggregators (Datadog, Splunk, ELK, etc.).
//
// Usage:
//   const logger = require("../utility/logger");
//   logger.info({ campaignId: id }, "Campaign launched");
//   logger.warn({ err }, "Donation mail failed");
//   logger.error({ err, requestId: req.id }, "Unhandled error");
//
// Secret values (keys containing "secret", "token", "password", "key")
// are automatically redacted from logged objects to prevent credential
// leaks into log streams.

const pino = require("pino");

const NODE_ENV = process.env.NODE_ENV || "development";

const REDACT_KEYS = [
  "secret",
  "token",
  "password",
  "key",
  "authorization",
  "cookie",
  "set-cookie",
];

const logger = pino({
  level: process.env.LOG_LEVEL || (NODE_ENV === "production" ? "info" : "debug"),
  redact: {
    paths: REDACT_KEYS,
    censor: "[REDACTED]",
  },
  ...(NODE_ENV === "production"
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
      }),
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
});

module.exports = logger;