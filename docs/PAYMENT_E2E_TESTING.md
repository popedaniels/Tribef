# Payment E2E Testing Runbook

Unit tests cover pure logic (diffing, scoring, PDF layout) with mocked transports. This runbook covers what mocks cannot: real gateway signature verification, webhook delivery, and end-to-end money movement. Run this against a staging deployment before releases that touch payment code.

## Prerequisites

- Staging backend deployed with test-mode keys: `STRIPESECRET` (`sk_test_…`), `FLUTTERWAVE` (test secret), `PAYSTACK_SECRET` (`sk_test_…`)
- All webhook secrets configured (`STRIPE_WEBHOOK_SECRET`, `FLUTTERWAVE_VERIF_HASH`, `STRIPE_IDENTITY_WEBHOOK_SECRET`, `STRIPE_CONNECT_WEBHOOK_SECRET`)
- Stripe CLI installed: https://stripe.com/docs/stripe-cli

## Stripe

```bash
# Forward Stripe events to the staging backend (gives you a webhook secret).
stripe listen --forward-to https://api.staging.fundandtrace.com/api/donations/stripe-webhook

# Trigger each handler path:
stripe trigger checkout.session.completed                 # one-time donation recording
stripe trigger invoice.paid                               # recurring monthly crediting
stripe trigger customer.subscription.deleted              # subscription lifecycle sync
```

**Verify after each trigger:**
1. `Donations` / `Subscription` row created, `transactionId` unique
2. Campaign `amountRaised`/`availableBalance` incremented exactly once
3. Re-running the same trigger produces **no duplicate credit** (idempotency guard)

Full checkout flow with real redirect:
```bash
curl -X POST https://api.staging.fundandtrace.com/api/donations/createStripeSession/campaignId \
  -H 'Content-Type: application/json' \
  -d '{"amount":10,"currency":"gbp","customer":{"email":"donor@example.com"},"meta":{"tip":0,"anonymous":false}}'
# Open returned session id via https://checkout.stripe.com/c/pay/{id} and pay with 4242 4242 4242 4242.
```

## Flutterwave

Dashboard → Test cards; complete a donation through the hosted link from `POST /api/donations/initialize`. Then:

1. Confirm callback recorded the donation (`GET /api/donations/flutterwave/:id?status=successful&transaction_id=…`)
2. Dashboard → Webhooks → **Resend** the `charge.completed` event → confirm the webhook path acks without double-crediting
3. Tamper check: replay with a wrong `verif-hash` header → expect `401`

## Paystack

Same pattern with test card `4084 0840 8408 4081`:

1. Complete checkout via authorization URL from `POST /api/donations/initializePaystack/:id`
2. Verify callback + webhook both record exactly one donation
3. Tamper check: POST `/api/donations/paystack-webhook` with an unsigned body → expect `401`

## Reconciliation dry-run

After completing test donations on all three rails:

```bash
node scripts/reconcile.js 7   # look back 7 days
```

Expected output: `Reconciliation clean for the last 7 day(s).` — any discrepancy line is a bug to investigate **before** the release ships.

## Fraud signal verification

Fire 6+ rapid `POST /api/donations/createStripeSession/:id` calls for one email within 15 minutes (test card never completed):

```bash
GET /api/admin/fraud/flagged   # as admin
```

Expect the email to appear via `email_velocity` once ≥5 complete, or via `init_attempts` at ≥8 initialize calls even with zero completions.

## Known residual noise in reconciliation

- Donations recorded before the idempotency work may lack `paymentId`; they are rescued by the `client_reference_id` ↔ `transactionRef` match, but rows missing *both* will surface as discrepancies. Triage manually; do not auto-refund based on reconciliation output alone.
