# Fund&Trace — Launch Runbook

This is the operational checklist for the remaining go-live work. The code and
build gates are green (November 2026: backend 200+ unit and 64 integration
tests, frontend 156 tests, type and lint gates, production build, no high or
critical dependency advisories, WCAG 2.1 AA audit clean). What remains is
**credential rotation, history purge, production secrets, the one-off
migrations, staging end-to-end tests with the payment providers, operations
setup, and legal sign-off** (§7).

> Treat every previously exposed value as compromised. Even though the
> plaintext values were removed from the working tree and `.env` is now
> git-ignored, any credential that was ever committed is considered public
> **until it is rotated and purged from history**.

---

## 1. Rotate every exposed credential

Rotate **first** (or in the same change window as the history purge). Purging
history does not revoke a still-valid secret.

| # | Secret | Used for | How to rotate |
| :-- | :-- | :-- | :-- |
| 1 | `MONGOURL` | Database connection | MongoDB Atlas → Database Access → edit user → generate new password (or provision a fresh cluster user). Update the connection string. |
| 2 | `TOKEN_SECRET` | Session/JWT signing | Generate `openssl rand -hex 64`. **Rotating invalidates all existing sessions** — users re-login. |
| 3 | `RESET_TOKEN_SECRET` | Password-reset tokens | Generate `openssl rand -hex 64`. Rotating invalidates outstanding reset links (desired). |
| 4 | `SECURITY_KEY` (32 bytes hex) | AES-256 encryption of bank/payout data at rest | ⚠️ Generate `openssl rand -hex 32`. **Existing encrypted fields cannot be decrypted with a new key.** If any real payout data exists, decrypt with the old key and re-encrypt with the new key before rotating (see §1.1). |
| 5 | `INIT_VECTOR` (16 bytes hex) | AES-256 IV | ⚠️ Same migration requirement as `SECURITY_KEY`. Generate `openssl rand -hex 16`. |
| 6 | `STRIPESECRET` | Stripe payments/refunds/Identity | Stripe Dashboard → Developers → API keys → roll the secret key. |
| 7 | `STRIPEPUBLIC` | Stripe publishable key | Stripe Dashboard → Developers → API keys → roll the publishable key. |
| 8 | `STRIPE_WEBHOOK_SECRET` | Stripe payment webhook signature | Stripe Dashboard → Webhooks → endpoint → "Roll secret" / "Reveal signing secret". |
| 9 | `STRIPE_IDENTITY_WEBHOOK_SECRET` | Stripe Identity (KYC) webhook | Stripe Dashboard → Webhooks → Identity endpoint → roll secret. |
| 10 | `FLUTTERWAVE` | Flutterwave payments | Flutterwave Dashboard → Settings → API keys → roll live key. |
| 11 | `CHARITIES_API` | Charity registry lookup key | Regenerate in the provider portal (Ocp-Apim-Subscription-Key). |
| 12 | `EMAIL` / `OAUTH_CLIENTID` / `OAUTH_CLIENT_SECRET` / `OAUTH_REFRESH_TOKEN` | Gmail OAuth2 email sending | Google Cloud Console → APIs & Services → Credentials → reset client secret, re-run OAuth consent to obtain a new refresh token. |
| 13 | `INTERNAL_WEBHOOK_SECRET` | Internal server-to-server webhook auth | Generate `openssl rand -hex 32`. |
| 14a | `PAYSTACK_SECRET` | Paystack payments, transfers, webhook HMAC | Paystack Dashboard → Settings → API Keys & Webhooks → generate new secret key. |
| 14b | `FLUTTERWAVE_VERIF_HASH` | Flutterwave webhook verification | Flutterwave Dashboard → Settings → Webhooks → set a new secret hash. |
| 14c | `STRIPE_CONNECT_WEBHOOK_SECRET` | Stripe Connect (organiser payouts) webhook | Stripe Dashboard → Webhooks → Connect endpoint → roll secret. |
| 14d | `ANCHOR_GITHUB_TOKEN` | Publishing daily ledger anchors | GitHub → fine-grained token, *contents: write* on the public anchors repo only; rotate yearly. |
| 14 | Mongo root / Mongo-Express credentials (`root`/`fundandtrace`) | Local Docker Mongo admin | Generate new passwords, set `MONGO_ROOT_USERNAME/PASSWORD` and `MONGO_EXPRESS_USERNAME/PASSWORD`. The compose files now read them from env (no hardcoded values remain). |

### 1.1 AES key rotation (items 4–5)

If production already holds encrypted bank/payout records:

1. Deploy a temporary script that reads each record with the **old**
   `SECURITY_KEY`/`INIT_VECTOR` and re-encrypts with the **new** values
   (`utility/encryption.js` exposes `encrypt`/`decrypt`).
2. After re-encryption succeeds and is verified, promote the new key.
3. If **no** production encrypted data exists yet, simply set fresh values.

---

## 2. Purge secrets from Git history

Both repositories have been pushed to GitHub, so history must be rewritten.

```bash
# Dry run first — prints the exact commands without changing anything.
./scripts/purge-secrets.sh

# Then apply (destructive: rewrites all commit SHAs, removes the origin remote).
./scripts/purge-secrets.sh --apply
```

After applying, for each repo:

```bash
git remote add origin <github-url>
git push --force --all
git push --force --tags
```

Notes:

- `git filter-repo` removes the `.env` files from history and replaces known
  secret-shaped values (`mongodb+srv://…`, `sk_live_…`, `FLWSECK-…`,
  `whsec_…`, etc.) with `[REDACTED]`.
- Coordinate with every collaborator: they must **re-clone** after the
  force-push (do not merge old branches back in).
- If GitHub is public or you are unsure who has cloned, rotate §1 credentials
  even after purging.
- Consider enabling GitHub Secret Scanning push protection on both repos.

---

## 3. Populate production secrets and validate

1. Copy the templates and fill in real values:

   ```bash
   cp FundandTraceBackend/.env.example FundandTraceBackend/.env
   cp FundandTrace/.env.example FundandTrace/.env
   # edit both, replace every placeholder
   ```

2. Generate the crypto values:

   ```bash
   openssl rand -hex 64   # TOKEN_SECRET, RESET_TOKEN_SECRET
   openssl rand -hex 32   # SECURITY_KEY (32 bytes)
   openssl rand -hex 16   # INIT_VECTOR (16 bytes)
   openssl rand -hex 32   # INTERNAL_WEBHOOK_SECRET
   ```

3. Validate the backend configuration fails fast on anything missing/weak:

   ```bash
   cd FundandTraceBackend && npm run validate-env
   ```

   The backend also calls `assertValidConfig()` at startup, so a misconfigured
   production deploy refuses to boot with a clear error instead of running with
   placeholder secrets.

4. Confirm production URLs use HTTPS (`MAINURL`, `BACKENDURL`,
   `NEXT_PUBLIC_API_URL`) — the validator rejects non-HTTPS public URLs.

---

## 3a. One-off steps for the November 2026 release

Do these once, in this order, when deploying the `fix/audit-hardening-ui-polish` work.

1. **Back up the database** (Atlas snapshot or `scripts/backup-mongo.sh`).
2. **Encrypt legacy plaintext bank details:** dry run, check the counts, then
   run for real:
   ```bash
   node scripts/migrate-encryption.js            # dry run
   node scripts/migrate-encryption.js --encrypt-plaintext
   ```
3. **Set `LEDGER_START_DATE`** to the deploy date. Campaigns created before the
   public ledger existed have balances with no ledger history, and the nightly
   integrity check skips their balance comparison.
4. **Anchoring:** create an empty **public** GitHub repo (e.g.
   `fundandtrace/ledger-anchors`), set `ANCHOR_GITHUB_REPO`, `ANCHOR_GITHUB_TOKEN`
   and `ANCHOR_OPENTIMESTAMPS=true`. In this repo's GitHub settings add the
   variable `PRODUCTION_API_URL` so the *Ledger watchdog* workflow re-verifies
   each anchor daily. See `docs/LEDGER_ANCHORING.md`.
5. **Alerts:** set `ALERT_WEBHOOK_URL` (Slack/Teams/Discord) and `SENTRY_DSN`.
6. **Email:** move transactional email to a provider with SMTP (Amazon SES,
   Postmark, Resend…) and set `SMTP_URL` and `EMAIL_FROM`. Gmail OAuth is capped
   at a few hundred to ~2,000 messages a day, and its refresh token expires
   after 7 days while the OAuth app is in "testing", which would stop donation
   receipts without any error a donor sees.
7. **Webhooks:** register all five endpoints in each provider's live dashboard
   (table in `docs/SANDBOX_TESTING.md` §2), including **Stripe Connect**, which
   never verified before this release.
8. **Process manager:** deploy with the updated `processes.json` (16 s kill
   timeout so payouts in flight finish during a deploy) or the updated
   Kubernetes manifests (30 s grace period, pre-stop pause, PodDisruptionBudget).
   **Use immutable image tags** (git SHA), not `:latest`.

---

## 4. Staging end-to-end test checklist

Run on a staging deployment with test-mode payment keys before any production
traffic. **The payment flows have their own detailed checklist and automated
script: `docs/SANDBOX_TESTING.md`.** Complete it in full; the unit tests only
use simulated providers.

### 4.1 Deployment smoke test

```bash
FRONTEND_URL=https://staging… API_URL=https://api.staging… ./scripts/smoke-test.sh
```

Expect all five checks to PASS (readiness requires MongoDB reachable).

### 4.2 Functional flows

- [ ] **Signup (individual)** — register → receive verification email → verify → login.
- [ ] **Charity signup** — charity registry lookup returns a match → account created.
- [ ] **Password reset** — request link → link works once → token expires/becomes invalid after use.
- [ ] **KYC / Stripe Identity** — create-session → complete verification → Identity webhook updates status.
- [ ] **Campaign launch** — every StartACampaign step saves → submit → owner-bound (cannot pass a different `organizerId`).
- [ ] **Admin approval** — admin approves campaign → becomes public.
- [ ] **Donation (Stripe)** — test card → redirect to success → webhook confirms → donation recorded **exactly once** (idempotency) → donor receipt emailed.
- [ ] **Donation (Flutterwave)** — test transaction → verify → recorded once.
- [ ] **Refunds** — admin issues full and partial refund → Stripe refund created → balances update sequentially and atomically.
- [ ] **Funding request & disbursement** — organizer requests payout → admin approves/declines → bank details stored encrypted → disbursement recorded.
- [ ] **Admin actions** — suspend/unsuspend user and campaign, reply to support tickets, review reports.
- [ ] **Ownership & auth** — non-owner cannot mutate another organizer's campaign/whitelist; non-admin gets 403 on admin routes; bad internal-webhook secret gets 401.
- [ ] **Security headers / rate limiting** — spot-check `Strict-Transport-Security`, `X-Frame-Options`, and 429 after repeated auth attempts.

---

## 5. Production operations checklist

- [ ] **HTTPS** — TLS cert for `fundandtrace.com`, `www`, and `api` subdomain; HTTP→HTTPS redirect; HSTS already set. See `docs/infrastructure/KUBERNETES_HELM_CICD_GUIDE.md` for cert-manager + ingress.
- [ ] **MongoDB backups** — enable Atlas continuous backup/PITR **and** a scheduled logical dump:
      ```cron
      0 2 * * *  MONGOURL="…" BACKUP_DIR=/backups ./scripts/backup-mongo.sh >> /var/log/ft-backup.log 2>&1
      ```
      Perform a restore drill with `scripts/restore-mongo.sh` to a throwaway DB.
- [ ] **Monitoring** — scrape `/live` (liveness) and `/ready` (readiness) with Prometheus or a hosted monitor; alert on 5xx rate > 0.5%, p99 latency > 800 ms, and readiness failures.
- [ ] **Alerting** — route alerts to a real channel (PagerDuty/Slack/Opsgenie), including DB-down, webhook-failure, and payment-error alerts.
- [ ] **Rollback** — publish immutable image tags (git SHA/semver); keep `helm rollback` / previous image tag documented and tested.
- [ ] **Webhook delivery** — verify Stripe and Flutterwave endpoints show successful delivery in the provider dashboards; confirm signatures are verified server-side; set up monitoring for failed webhook deliveries.

- [ ] **Daily jobs** — the morning after deploy, `GET /api/admin/ops/status` shows a succeeded `integrity-check` and `ledger-anchor`, the anchor appears in the public repo, and the *Ledger watchdog* workflow is green.
- [ ] **Gateway reconciliation** — set `RECONCILE_DAILY=true` once live keys are in place; review its first week of output.
- [ ] **Uptime** — external monitor on `https://api…/live` and `https://api…/ready`, plus the donate page.
- [ ] **Logs** — every response carries `X-Request-Id`; make sure your log store indexes `requestId` so support can trace a donor's failed payment from the id in the error.

---

## 6. Incident playbooks

**Integrity alert: `balance_mismatch` or `negative_balance` (critical).**
Freeze payouts for that campaign (admin → Disputes, or set
`disputeGovernance.isLocked`). Compare the campaign's ledger
(`GET /api/ledger/:id`) with the gateway records for the same period. A
mismatch usually means a credit, payout or refund that changed the balance but
failed to write its ledger entry (look for "Ledger append failed" in the logs
with that campaign id). Correct it with a new compensating ledger entry; never
edit or delete entries. Record what happened in the campaign's admin notes.

**Integrity alert: `ledger_broken` (critical).** Someone or something edited
the ledger collection directly. The anchor job will refuse to run until it's
resolved. Restore the affected entries from backup and compare with the last
anchor (`node scripts/verify-anchor.js`). Treat it as a security incident:
rotate database credentials and review database access logs.

**`balance_mismatch_in_flight`, `payout_stuck`, `refund_stuck` (warning).**
A payout or refund was interrupted (deploy, crash, provider timeout). Check the
provider dashboard for the reference. If the money moved, complete the record;
if it didn't, release the reservation (`payoutLockedAt` / refund `processing`)
and let the organiser or admin retry.

**`bank_transfer_unconfirmed` (warning).** The provider never sent the
transfer webhook. Look up the reference in the Paystack/Flutterwave dashboard;
replay the webhook from there, or apply the outcome manually.

**Provider outage.** Donations on the affected rail fail with "you haven't been
charged"; donors can pick another payment method. Post a status note. Nothing to
reconcile unless the provider later delivers late webhooks (they're idempotent).

**Suspected fraudulent campaign.** Freeze it (Disputes), decline pending
funding requests with a reason, and if confirmed resolve the dispute with a
pro-rata refund. Keep the evidence; you may have reporting obligations (§7).

**Leaked secret.** Rotate it immediately (§1), invalidate sessions with
`TOKEN_SECRET` rotation if it was an auth secret, and check the integrity report
and provider dashboards for anything unusual since the leak.

---

## 7. Legal and licensing: questions for your lawyer

This isn't legal advice. These are the questions a lawyer in each country you
operate in needs to answer **before** you hold donor money at scale or promise
donors that their money is "protected". Holding funds for others and releasing
them later is regulated in most places.

- **Holding and releasing funds.** Does holding donations and paying them out
  later need a licence or an exemption? For example: UK — FCA authorisation
  under the Payment Services Regulations 2017 / Electronic Money Regulations
  2011, or reliance on a regulated partner; US — state money transmitter
  licences unless a licensed processor holds the funds; Nigeria — CBN licensing
  for payment service providers; Kenya — National Payment System Act; Ghana —
  Payment Systems and Services Act 2019. Can the structure rely on Stripe,
  Paystack and Flutterwave holding the funds (e.g. Stripe Connect with delayed
  payouts) rather than Fund&Trace holding them?
- **Safeguarding.** If you do hold funds: segregated accounts, what happens to
  escrowed money if Fund&Trace becomes insolvent, and whether "escrow" is a
  word you're allowed to use without a licensed escrow agent.
- **Donor promises.** Review the wording of the 30-day self-refund, the
  pro-rata dispute refund and every "protected" claim on the site, so they're
  enforceable and not misleading under consumer-protection law.
- **AML/KYC.** What identity checks and transaction monitoring are required for
  organisers and for large or unusual donations, and do you need to report
  suspicious activity?
- **Charitable fundraising.** Registration requirements for soliciting on
  behalf of charities (UK Fundraising Regulator, US state charitable
  solicitation registration, local rules elsewhere).
- **Data protection.** UK/EU GDPR, Nigeria Data Protection Act 2023, Kenya
  Data Protection Act 2019: lawful basis, retention, cross-border transfers
  (data stored outside Africa), and the public ledger (it shows amounts and
  dates but no donor names; confirm that's acceptable).
- **Tax.** Receipts for tax relief, Gift Aid (UK) if you add it, and whether
  tips are taxable revenue.
- **Terms of service and privacy policy.** Have both rewritten to match how the
  product now works (escrow, staged release, ledger, refunds, disputes).

---

## Definition of done

- [ ] All §1 credentials rotated (and §1.1 re-encryption done if applicable).
- [ ] History purged and force-pushed on both repos; collaborators re-cloned.
- [ ] `npm run validate-env` exits 0 against the real production `.env`.
- [ ] All §4 staging flows pass.
- [ ] §3a one-off steps done.
- [ ] `docs/SANDBOX_TESTING.md` checklist passed on staging.
- [ ] §5 production ops items confirmed.
- [ ] §7 legal questions answered in writing, and site wording updated to match.
- [ ] A small, real pilot (a few campaigns paying hospitals or schools directly) has completed a full cycle: donations → payout → receipt → anchor.
