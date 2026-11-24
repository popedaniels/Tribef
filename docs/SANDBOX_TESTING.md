# Testing payments end to end in the provider sandboxes

The unit and integration tests replace Stripe, Paystack and Flutterwave with
simulated responses. They prove our logic, but not that the real providers
accept our requests or send the webhooks we expect. Do this before launch and
after any change to payment code. It takes about an hour.

**Use test-mode keys only.** `scripts/sandbox-e2e.js` refuses to run with live keys.

## 1. Automated contract checks (10 minutes, no database)

```bash
cd FundandTraceBackend
# .env with TEST keys: STRIPESECRET=sk_test_…, PAYSTACK_SECRET=sk_test_…, FLUTTERWAVE=FLWSECK_TEST-…
node scripts/sandbox-e2e.js contract --country NG \
  --bank-code <test bank code> --account <test account number>
```

Take the bank code and account number from the provider's test-data page.
This checks that banks list, an account name resolves, a bank transfer is
accepted, a Stripe Checkout session is created, and a Stripe refund with an
idempotency key is deduplicated.

To run it weekly in GitHub Actions, add the repository secrets
`SANDBOX_STRIPE_SECRET`, `SANDBOX_PAYSTACK_SECRET`, `SANDBOX_FLUTTERWAVE_SECRET`,
`SANDBOX_SECURITY_KEY` and `SANDBOX_INIT_VECTOR`, and the variables
`SANDBOX_NG_BANK_CODE` and `SANDBOX_NG_ACCOUNT` (workflow: *Provider sandbox
contract*).

## 2. Staging environment

Deploy the API and site to staging with test keys and a separate database, then:

| Provider | Webhook URL to set in its dashboard (test mode) | Secret env var |
| --- | --- | --- |
| Stripe (checkout) | `https://<staging-api>/api/donations/stripe-webhook` | `STRIPE_WEBHOOK_SECRET` |
| Stripe Connect | `https://<staging-api>/api/stripeConnect/webhook` | `STRIPE_CONNECT_WEBHOOK_SECRET` |
| Stripe Identity | `https://<staging-api>/api/identity/webhook` | `STRIPE_IDENTITY_WEBHOOK_SECRET` |
| Paystack | `https://<staging-api>/api/donations/paystack-webhook` | uses `PAYSTACK_SECRET` |
| Flutterwave | `https://<staging-api>/api/donations/flutterwave-webhook` | `FLUTTERWAVE_VERIF_HASH` |

For a local backend, `stripe listen --forward-to localhost:5000/api/donations/stripe-webhook`
forwards Stripe events. For Paystack and Flutterwave, use a tunnel such as
`cloudflared tunnel --url http://localhost:5000`.

Create one test campaign per currency you'll launch with (e.g. NGN and GBP).

## 3. Automated checkout run (per campaign)

```bash
node scripts/sandbox-e2e.js checkout --api https://<staging-api> --campaign <campaignId> --wait 10
```

It confirms a wrong currency is refused, starts a checkout on every provider
that takes the campaign's currency, and prints the payment links. Pay each one
with the provider's test card. It then waits for the webhooks and checks that
each donation reached the public ledger, that the campaign was credited the
donation **without** the tip, and that the chain still verifies.

## 4. Manual checklist

Tick each one on staging. Each line is a flow the unit tests only cover with
simulated providers.

**Donations**
- [ ] Card donation via Stripe: receipt email arrives, ledger shows the credit, the total charged = donation + tip.
- [ ] Paystack card and bank transfer: same checks.
- [ ] Flutterwave card, USSD and mobile money (M-Pesa sandbox for KES).
- [ ] Monthly gift: subscription created, second invoice (use Stripe test clocks) credits again, cancel from *Monthly giving*.
- [ ] Declined test card: the donor is returned to the donate page with "you haven't been charged", nothing is credited.
- [ ] Replay a webhook from the provider dashboard: no duplicate donation or ledger entry.

**Organisers and payouts**
- [ ] Stripe Identity verification completes and the organiser shows as verified.
- [ ] Stripe Connect onboarding completes; the `account.updated` webhook marks payouts enabled.
- [ ] Approving a payout without KYC is refused (`kyc_required`).
- [ ] Bank payout (Paystack, then Flutterwave): transfer created, the `transfer.success` webhook marks it paid, the ledger shows the payout.
- [ ] Failed transfer (provider's failure test account): money returns to escrow, the ledger shows "Payout returned", the request reopens.
- [ ] Receipt upload after a payout; the Transparency Score updates.

**Refunds and disputes**
- [ ] Donor self-refund within 30 days: money returned in the provider dashboard; ledger shows the refund; balance never negative.
- [ ] Three donor reports freeze the campaign: donate buttons pause, checkout returns 423.
- [ ] Admin resolves by refund: every donor refunded pro-rata; failures listed for retry.

**Daily jobs**
- [ ] After 01:00 UTC, `GET /api/admin/ops/status` shows today's integrity check and ledger anchor.
- [ ] The anchor is in the public anchors repo; `node scripts/verify-anchor.js --api https://<staging-api>` passes.
- [ ] Deliberately edit one ledger entry in the staging database: the next integrity check alerts, the anchor job refuses, and **Verify ledger** on the tracker reports the broken entry. Then restore it.

## Ready-for-keys checklist

The *Provider sandbox contract* workflow skips (green) until keys exist. To
switch it on:

1. Add repository **secrets** (test mode only, the script refuses live keys):
   `SANDBOX_STRIPE_SECRET`, `SANDBOX_PAYSTACK_SECRET`,
   `SANDBOX_FLUTTERWAVE_SECRET`, `SANDBOX_SECURITY_KEY`, `SANDBOX_INIT_VECTOR`.
2. Optional **variables**: `SANDBOX_NG_BANK_CODE` + `SANDBOX_NG_ACCOUNT` (a test
   account from Paystack/Flutterwave's docs) to exercise account-name lookup;
   `STAGING_API_URL` + `SANDBOX_CAMPAIGN_ID` for the checkout run.
3. Run the workflow manually with **checkout** ticked, pay the printed links
   with test cards, and watch it confirm: webhook → credit → ledger, the
   campaign credited exactly the donation (no tip, no card fee), a tampered
   fee refused (`fee_mismatch`), Paystack charged exactly our total, and the
   fee we added covers Paystack's actual fee. The last two catch "Pass fees to
   customers" being switched on, or a processor changing its rates.
