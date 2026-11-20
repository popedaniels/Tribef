// Mocha bootstrap — loaded via `--require ./tests/setup.js` before any test file.
//
// Several modules (utility/encryption.js, utility/auth.js) read secrets at
// require-time. Without these defaults the whole suite crashes on import with
// `ERR_INVALID_ARG_TYPE` before a single test runs. The values below are
// deterministic, test-only placeholders — they are never used outside
// NODE_ENV=test and real environment values always take precedence.
process.env.NODE_ENV = "test";

const defaults = {
  TOKEN_SECRET: "test_token_secret_for_mocha_suite_only_0123456789",
  RESET_TOKEN_SECRET: "test_reset_secret_for_mocha_suite_only_0123456789",
  SECURITY_KEY: "a".repeat(64),
  INIT_VECTOR: "b".repeat(32),
  INTERNAL_WEBHOOK_SECRET: "test_internal_webhook_secret",
  MAINURL: "http://localhost:3000",
  BACKENDURL: "http://localhost:5000",
  MONGOURL: "mongodb://127.0.0.1:27017/fundandtrace_test",
};

Object.entries(defaults).forEach(([key, value]) => {
  if (!process.env[key]) process.env[key] = value;
});
