# Fund&Trace — Launch Runbook

This is the operational checklist for the remaining go-live work. The code and
build gates are green (frontend production build passes, backend tests 12/12,
strict type/lint gates restored). What remains is **credential rotation,
history purge, production secret population, staging E2E verification, and
production operations hardening**.

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

## 4. Staging end-to-end test checklist

Run on a staging deployment with test-mode payment keys before any production
traffic.

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

---

## Definition of done

- [ ] All §1 credentials rotated (and §1.1 re-encryption done if applicable).
- [ ] History purged and force-pushed on both repos; collaborators re-cloned.
- [ ] `npm run validate-env` exits 0 against the real production `.env`.
- [ ] All §4 staging flows pass.
- [ ] §5 production ops items confirmed.
