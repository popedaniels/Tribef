# Security review

## Automated (every PR and weekly)

| Check | Where | Fails on |
|---|---|---|
| Route authorisation audit | `FundandTraceBackend/tests/unit/routeAudit.test.js` | any POST/PUT/PATCH/DELETE without `requireAuth`/`requireAdmin`/`requireInternalWebhook` that isn't on the reviewed public list; `requireCampaignOwner` without a session guard; stale allowlist entries |
| CodeQL (security-extended) | `.github/workflows/security.yml` | injection, XSS, SSRF, path traversal, prototype pollution… (results under *Security → Code scanning*) |
| Dependency audit | same | high/critical advisories in production dependencies |
| Secret scanning | same (gitleaks) | credentials in changed commits, or anywhere in the tree on the weekly run |
| Dependabot | `.github/dependabot.yml` | opens weekly update PRs against `stage` |
| Money invariants | unit + DB tests | double credit, double payout, fee tampering, wrong-currency credit, payout to a non-verified vendor account, single-admin large payout |
| Integrity | nightly job + backup drill | broken ledger or evidence hash chain, balance ≠ ledger |

When adding a public endpoint, add it to `PUBLIC` in the route audit with the
reason it's safe (e.g. "Stripe signature verified in handler").

## Controls on money movement

- **Two-person rule:** payouts above `PAYOUT_SECOND_APPROVAL_JSON` need two
  different admins within `SECOND_APPROVAL_TTL_HOURS`; the payout handler
  re-checks it.
- **Vendor lock:** vendor-backed requests pay only the vendor's verified account.
- **Escrow:** atomic claims, balance reserved before transfer, dispute freeze.

## Findings fixed in this review

- Push subscriptions accepted any `userEmail` from the request body, so anyone
  could register to receive another user's notifications (dormant: nothing
  sent pushes yet). The account now comes from the session only.
- The funding-request approval modal swallowed errors, so a refused approval
  looked like success.

## CodeQL triage (first full run: 110 findings)

Fixed:

| Finding | Fix |
|---|---|
| Campaign videos embedded any URL containing "youtube.com" (`https://evil.example/?youtube.com` would be iframed on the public campaign page) | URLs parsed by host on both ends (`utility/videoUrl.js`, `src/utils/video.ts`); only YouTube (via youtube-nocookie embed) or our own Cloudinary video uploads; the server rejects others |
| NoSQL operator injection via query strings (`?email[$ne]=x` parsed to an object) | `app.set("query parser", "simple")` and operator keys stripped from query strings (bodies already were) |
| Two unrouted search controllers fed user JSON into `find()`, one passing `$where` through its "safe" filter | Deleted (dead code) |
| Flutterwave transaction id spliced into the provider URL (request forgery with our secret key) | Must be numeric; encoded |
| Polynomial ReDoS in the email check on public checkout routes | `utility/isEmail.js`: bounded, linear, length-capped |
| Crafted dynamic segments (`..%2F`) steering server-side API fetches | Middleware returns 404 for encoded slashes and dot-segments |
| Unencoded email in the forgot-password URLs; service worker accepted messages from any origin | Encoded; origin checked |

Reviewed, not exploitable (kept as documented false positives): remaining
`js/sql-injection` on route params and validated/sanitised bodies (params are
always strings; bodies have operator keys stripped); `js/request-forgery` on
the web app's server-side fetches to our own API (ids now constrained by the
middleware); open-redirect alerts on sign-in/verify pages (`safeNextPath`
allows same-origin paths only); type confusion on evidence uploads (checked
with `Buffer.isBuffer`); "insufficient password hash" (a fingerprint of the
bcrypt hash for single-use reset links, not a password store); helmet CSP
disabled (a stricter custom CSP is set in `utility/security.js`); preflight's
`file-access-to-http` (it reads the operator's own env file by design).

## Still needs a human

A penetration test before handling money at scale (auth/session handling,
admin panel, file uploads, payment callbacks), plus a review of the admin
account lifecycle (2FA enforcement for admins, offboarding).
