# Self-Service Donor Refunds — Feature Spec

**Status:** Approved, not yet implemented
**Owner:** Backend team
**Related code:** `controller/adminRefunds.js`, `models/donationsModel.js` (`refund` subdocument), Stripe/Flutterwave/Paystack controllers

## Problem

Donors who give in error (wrong amount, duplicate tap, changed mind inside the cooling-off window) currently have no self-service path. Every refund request becomes a support ticket handled manually through `adminRefunds`. This adds support load, slows donor trust recovery, and delays chargeback avoidance — a cardholder who cannot refund themselves disputes instead, which costs the platform fees and dispute ratio.

## Goal

Let an authenticated donor refund **their own** eligible donation in one step, within policy limits, without admin involvement.

## Scope

### In scope
- Donor-facing endpoint to initiate a refund of a specific donation they made
- Eligibility engine (rules below) evaluated server-side at request time
- Gateway refund execution reusing the existing per-processor clients
- Automatic reversal of the campaign credit (`amountRaised` / `availableBalance`)
- Status surfaced back to the donor; email confirmation via the existing mail service
- Full audit trail on the existing `refund` subdocument

### Out of scope (v1)
- Partial refunds (full-amount only)
- Refunds after funds have been disbursed to organizers (blocked by eligibility rule 4)
- Admin UI changes (existing admin refunds remain unchanged)
- Anonymous donations made >30 days ago (no way to authenticate ownership)

## Eligibility rules (all must pass)

| # | Rule | Rationale |
|---|------|-----------|
| 1 | Donation belongs to authenticated donor (`donorEmail === req.auth.email`) | Ownership |
| 2 | No existing refund (`refund.status` empty) | Idempotency |
| 3 | Within refund window: ≤ 30 days after `createdAt` | Policy |
| 4 | Campaign has sufficient `funding.availableBalance ≥ amount` **and** no approved disbursement has drawn those funds | Never claw back organizer money |
| 5 | Campaign not suspended with an active dispute lock (`disputeGovernance.isLocked`) | Disputes route to admin process |
| 6 | Gateway transaction still refundable (not already disputed/charged back) | Gateway constraint |

Rules are evaluated atomically where possible; rule 4 must use the same conditional atomic decrement pattern as disbursements (`$gte` guard on `updateOne`) so concurrent refunds cannot overdraw a campaign.

## API design

```
POST /api/donations/:donationId/refund        (requireAuth, apiLimiter)
  → 202 { status, message }                   accepted, processing async
  → 409 { error }                             ineligible (reason code returned)
GET  /api/donations/:donationId/refund-status (requireAuth)
  → 200 { refundStatus, amount, createdAt }
```

Rate limit: 5 refund initiations per donor per day (new named limiter `refund`).

## Processing flow

1. Validate eligibility (rules 1–5) → reserve balance atomically
2. Create refund intent record: `refund.status = "processing"` with `requestedBy: "donor"`
3. Execute gateway refund:
   - **Stripe**: `stripe.refunds.create({ payment_intent })` using existing `paymentId`
   - **Flutterwave**: `POST /v3/transactions/{id}/refund` using stored `transactionId`
   - **Paystack**: `POST /transaction/refund` with reference
   - All calls idempotent via gateway idempotency keys keyed on `refund-{donationId}`
4. On success: set `refund.status = "refunded"`, `refundId`, timestamps; reverse campaign credit; send confirmation mail; `addActivity("donorRefund", ...)`
5. On gateway failure: release reserved balance, `refund.status = "failed"`, surface retryable error
6. Webhook events (`charge.refunded`, `refund.updated`) reconcile final state — refunds must never be trusted complete without gateway confirmation, mirroring the donation flow's "webhook is source of truth" principle

## Edge cases

- **Concurrent double-submit:** unique pre-condition on `refund.status: ""` via findOneAndUpdate guard — second request gets 409
- **Gateway succeeded but DB write failed:** reconciliation job (see reconciliation feature) diffs gateway refunds vs DB and heals
- **Tip handling:** full refund includes tip; campaign credit reversal excludes tip (tips were platform revenue)
- **Anonymous donations:** allowed if donor still has the receipt link tied to their authenticated email

## Telemetry & alerts

- Metric/alert: donor-refund rate per campaign > threshold → notify admins (possible campaign-quality signal)
- All failures logged to Sentry with donation context

## Rollout

1. Ship behind `ENABLE_SELF_REFUNDS=false` default
2. Enable for internal accounts, then GA after two clean weeks of reconciliation reports
