# Penetration test: scope and rules of engagement

**System:** Fund&Trace (web app, API, admin dashboard) · **Environment:** staging, with production-equivalent configuration and test-mode payment keys · **Window:** to be agreed, 5–8 tester-days suggested

## Targets

| Target | URL | Notes |
|---|---|---|
| Website | `https://staging.fundandtrace.com` | Next.js 15. Includes the admin dashboard under `/admin` |
| API | `https://api.staging.fundandtrace.com` | Express 4, about 175 routes, listed in `docs/API_REFERENCE.md` |
| Evidence capture | `/capture/*` (web) + `/api/evidence/*` | Phone camera upload with a per-session capture token |

Out of scope:

- Stripe, Paystack, Flutterwave, Cloudinary/S3, MongoDB Atlas, Cloudflare and Smile ID infrastructure. You may test our *use* of them (webhooks, signatures, redirects), not the providers themselves.
- Denial of service and volumetric testing. Rate-limit *logic* is in scope; flooding is not.
- Social engineering of staff.

## Accounts provided

- Two donor accounts.
- Two organiser accounts: one identity-verified with a launched campaign holding test escrow, and one not verified.
- One charity account.
- Two admin accounts with 2FA enrolled (seeds supplied). The two-person approval rule needs two different admins.
- Test cards and Paystack/Flutterwave test credentials.

## What we most want tested

1. **Money movement.**
   - Can anyone get money out of escrow without the approvals? Try to bypass the two-person rule, the KYC gate, the bank-name check or the 48-hour cooldown after a bank change.
   - Can a payout go to an account other than the verified vendor's?
   - Can the same request be paid twice? Try races and replays on approve and payout.
2. **Checkout integrity.**
   - Fee manipulation: the server recomputes `donation + tip + fee`.
   - Crediting more than was charged (metadata vs. charged amount).
   - Currency mismatch.
   - Replayed or forged webhooks: Stripe signature, Paystack HMAC-SHA512, Flutterwave verif-hash.
   - Paystack monthly renewals matched by plan code.
3. **Authorisation (IDOR).**
   - Campaigns, funding requests, team members, email whitelists, evidence sessions and records, subscriptions.
   - Admin-only data: risk scores, fraud flags, bank details.
   - Another user's data export or deletion.
4. **Authentication.**
   - JWT cookie for users, bearer token for admins.
   - Session revocation (`sessionVersion`).
   - 2FA: the challenge token, the admin enrolment-only token, enforced admin 2FA.
   - Password reset tokens; login rate limits.
5. **Evidence and identity.**
   - Can captured media or its metadata be altered after sealing? Records are append-only and hash-chained, with signed manifests.
   - Can someone upload into another user's session?
   - Access control on private ID media.
6. **Injection and content.**
   - Stored XSS via campaign story, updates, comments, team names and vendor names.
   - HTML in emails: donor updates escape titles.
   - JSON-LD script injection.
   - NoSQL injection: query parsing is set to "simple", but check every filter.
7. **SSRF.**
   - Any server-side fetch with user-influenced URLs: OG image generation, media proxy, charity registry lookups, the `SENTINEL_URL` integration.
8. **CSRF and CORS.**
   - Cookie-authenticated mutations from foreign origins.
   - The unsubscribe endpoint: public and HMAC-signed, and it only ever opts out.
9. **Rate limits and bot controls.**
   - Checkout velocity: per IP and per email, with Turnstile step-up. Try to bypass it with `X-Forwarded-For` or IPv6 rotation.
   - Login and password-reset limits.
10. **Ledger.**
    - Can a ledger entry be altered, removed or reordered without the integrity check or the daily public anchor noticing?

## Rules of engagement

- Testing runs only from the agreed source IPs. Send them beforehand so alerts can be recognised.
- Stop and call the named contact straight away on any finding that exposes real personal data, or that moves money on a live key. Neither should exist on staging.
- Report: findings with severity (CVSS 3.1 or 4.0), reproduction steps, affected routes and a suggested fix. Include a short executive summary.
- A free retest of fixed critical and high findings is wanted within 30 days.

## Contacts

- Technical lead: (name, phone) · Escalation: (name, phone) · Alerts channel: the `ALERT_WEBHOOK_URL` target
