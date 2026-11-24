const { offlineChecks } = require("../../scripts/preflight");

const good = {
  NODE_ENV: "production",
  MONGOURL: "mongodb+srv://app:s3cret@cluster0.abcde.mongodb.net/fundandtrace",
  TOKEN_SECRET: "a".repeat(64),
  RESET_TOKEN_SECRET: "b".repeat(64),
  SECURITY_KEY: "c".repeat(64),
  INTERNAL_WEBHOOK_SECRET: "d".repeat(32),
  MAINURL: "https://fundandtrace.com",
  BACKENDURL: "https://api.fundandtrace.com",
  REDIS_URL: "rediss://cache:6379",
  PAYSTACK_SECRET: "sk_live_abc123",
  STRIPESECRET: "sk_live_xyz",
  STRIPE_WEBHOOK_SECRET: "whsec_123",
  STRIPE_CONNECT_WEBHOOK_SECRET: "whsec_456",
  EVIDENCE_SIGNING_KEY: "k",
  LEDGER_START_DATE: "2026-12-01",
  ANCHOR_GITHUB_REPO: "fundandtrace/ledger-anchors",
  ANCHOR_GITHUB_TOKEN: "ghp_x",
  REQUIRE_KYC_TO_LAUNCH: "submitted",
  ID_MEDIA_RETENTION_DAYS: "365",
  PAYOUT_SECOND_APPROVAL_OVER: "1000000",
  SENTRY_DSN: "https://x@sentry.io/1",
  ALERT_WEBHOOK_URL: "https://hooks.slack.com/x",
  SMTP_URL: "smtps://u:p@email-smtp.eu-west-2.amazonaws.com:465",
  EMAIL_FROM: "receipts@fundandtrace.com",
  STORAGE_BUCKET: "ft-evidence",
};
const fails = (env, fe) => offlineChecks(env, fe).filter((c) => c.status === "fail").map((c) => c.check);

describe("preflight offline checks", () => {
  it("passes a complete production config (only the manual fee check warns)", () => {
    const r = offlineChecks(good);
    expect(r.filter((c) => c.status === "fail")).toEqual([]);
    expect(r.filter((c) => c.status === "warn").map((c) => c.area)).toEqual(["Fees"]);
  });
  it("fails test keys, surcharges and placeholders", () => {
    const f = fails({ ...good, PAYSTACK_SECRET: "sk_test_1", FEE_MODE_STRIPE: "required", EMAIL: "notifications@example.com" });
    expect(f).toEqual(expect.arrayContaining(["paystack uses a LIVE secret key", "Stripe card fee is not a mandatory surcharge", "No .env.example placeholder values left"]));
  });
  it("fails insecure URLs, weak keys and a live/test publishable-key mismatch", () => {
    const f = fails({ ...good, MAINURL: "http://fundandtrace.com", SECURITY_KEY: "short", RESET_TOKEN_SECRET: good.TOKEN_SECRET }, { NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_1" });
    expect(f).toEqual(expect.arrayContaining(["MAINURL is a public https URL", "SECURITY_KEY is 32 bytes hex", "RESET_TOKEN_SECRET is ≥ 64 chars and differs from TOKEN_SECRET", "Frontend Stripe publishable key matches the backend mode (live/test)"]));
  });
});
