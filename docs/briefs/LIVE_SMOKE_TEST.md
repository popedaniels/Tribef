# Live (real-money) smoke test

Run this once on **production**, with live keys and **small real amounts**, before inviting pilot organisations. It proves the parts that sandbox tests can't: live webhooks, real settlement, real bank transfers, real email delivery.

**People:** one operator and two admins (for the two-person rule) · **Budget:** about ₦20,000 + £20, all refundable or paid back to ourselves · **Time:** half a day, plus a check the next morning

## Setup

- [ ] The release is deployed from an immutable tag. `GET /ready` returns 200.
- [ ] Every item in `LAUNCH_RUNBOOK.md` §3 and §3a is done. Points to double-check:
  - [ ] `SMTP_URL`, `EMAIL_FROM`, `ALERT_WEBHOOK_URL` and `SENTRY_DSN` are set.
  - [ ] `ADMIN_REQUIRE_2FA` is unset (so on).
  - [ ] `TURNSTILE_SECRET` and `TURNSTILE_SITE_KEY` are set.
  - [ ] The live webhooks are registered for Stripe, Stripe Connect, Stripe Identity, Paystack and Flutterwave.
  - [ ] Paystack "pass fees to customers" is **off**; Flutterwave "merchant pays fees" is **on**.
- [ ] A test campaign is created by a team member's real organiser account, identity-verified, then launched. Its name says "TEST — do not donate".
- [ ] A team member's real bank account is added as the payout account. Use one Nigerian account and, for Stripe, a UK Connect account.

## One-off donations

| # | Gateway | Amount | Check |
|---|---|---|---|
| 1 | Paystack card | ₦1,000 | Total = donation + fee shown on the page. Charged once. |
| 2 | Paystack bank transfer / USSD | ₦1,000 | Recorded once, after the webhook. |
| 3 | Flutterwave card | ₦1,000 | Recorded once. Redirect lands on the thank-you page. |
| 4 | Stripe card (UK) | £2, "cover the fee" unticked | The campaign is credited £2. |
| 5 | Stripe card | £2 + £0.20 tip | The tip is not credited to the campaign. |

For each:

- [ ] The donation appears exactly once in the admin view.
- [ ] Raised and escrow balances are updated.
- [ ] A ledger entry exists, and the public tracker shows it.
- [ ] The receipt email arrives in Gmail and in Outlook, and is not marked as spam.

## Monthly gifts

- [ ] Stripe monthly at £1: the subscription appears in Dashboard → Subscriptions; the first charge is credited. Cancel it, and its status changes to "canceling".
- [ ] Paystack monthly at ₦500: the first charge is credited, and the status turns `active` after `subscription.create`. Cancel it: Paystack shows the subscription disabled. *(A renewal can't be tested on the same day. Check the next month's charge on the first pilot monthly gift.)*

## Refund

- [ ] The donor self-refunds donation #4. The Stripe refund is created, escrow goes down, the ledger shows the refund, and the donor gets an email.

## Payout

- [ ] The organiser requests ₦2,000 with a purpose and an invoice photo.
- [ ] The payout review checklist shows no "fail" items.
- [ ] **Bank-name check:** the approval goes through first time. The account holder's name matches the organiser's ID.
- [ ] The money arrives in the bank account. The transfer webhook flips the status to "successful".
- [ ] **Donor update:** every test donor gets "your money was paid out". The unsubscribe link works.
- [ ] The organiser adds a live-capture receipt. Donors get "receipt added", and the tracker shows it.
- [ ] **Cooldown:** change the payout account, then try to approve a new request. Expect it to be refused with the 48-hour hold, and the organiser to receive the "bank account changed" email.
- [ ] **Two-person rule:** set `PAYOUT_SECOND_APPROVAL_JSON={"NGN":1500}` temporarily. Expect the first admin's approval to return 202 and the second admin's approval to release the money. Then reset the setting.

## Controls

- [ ] Admin sign-in asks for the authenticator code. An admin without 2FA is sent to enrolment.
- [ ] Ten quick checkout starts from one phone trigger the Turnstile check, and then a 429.
- [ ] "Download my data" works for a test donor. Deleting a test donor account de-identifies their donations.

## Next morning

- [ ] The reconciliation report for the window has **0 discrepancies** across all three gateways. If it doesn't, stop and investigate.
- [ ] Integrity check and ledger anchor ran; the anchor is published.
- [ ] The mail outbox is empty (`status: queued` count is 0) and there are no "permanently failed" alerts.
- [ ] Sentry shows no new errors from the test.

## Pass or fail

**Pass:** every box is ticked and reconciliation is clean. Then refund or pay back the test money, mark the campaign as ended, and begin pilot onboarding.

**Fail:** any double credit, any missing credit, money that left escrow without both approvals, or an unexplained reconciliation gap. In any of these cases, suspend the test campaign, keep the logs, and fix the problem before taking any more real money.
