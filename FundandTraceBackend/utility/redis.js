// Shared Redis client for cross-instance state (rate limiting).
//
// Returns null when REDIS_URL is not configured so callers can fall back to
// in-process behavior (fine for single-instance development). The connection
// is created lazily on first use and failures are logged, never thrown —
// rate limiting must not take the API down when Redis blips.
const logger = require("./logger");

let client = null;

function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (client) return client;

  const Redis = require("ioredis");
  client = new Redis(process.env.REDIS_URL, {
    // Fail queued commands fast after one retry instead of buffering
    // unbounded work while disconnected; callers degrade gracefully.
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
    retryStrategy: ({ attempt }) => Math.min(attempt * 500, 10000),
    lazyConnect: false,
  });

  client.on("error", (err) => {
    logger.error({ err }, "Redis error (rate limiting falls back per request)");
  });
  client.on("connect", () => logger.info("Redis connected"));

  return client;
}

module.exports = { getRedis };
