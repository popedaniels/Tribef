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

## Still needs a human

A penetration test before handling money at scale (auth/session handling,
admin panel, file uploads, payment callbacks), plus a review of the admin
account lifecycle (2FA enforcement for admins, offboarding).
