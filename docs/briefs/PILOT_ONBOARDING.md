# Pilot onboarding checklist

**Goal:** 3–5 real organisations raise and spend real money through Fund&Trace for 8–12 weeks. We prove three things: donors give, payouts reach suppliers safely, and receipts come back.

**Pre-condition:** counsel has approved running a capped pilot under the current fund-holding structure (`COUNSEL_BRIEF.md`, question 4). The live smoke test (`LIVE_SMOKE_TEST.md`) has passed.

## Choosing pilot organisations

Aim for a mix that tests the main payout paths:

- [ ] **1 hospital or clinic** (medical bills paid directly to the hospital). Tests vendor-network payouts.
- [ ] **1 school** (fees or a building project). Tests a third-party payout and a receipt with photo evidence.
- [ ] **1 registered NGO or charity.** Tests a charity account, and Gift Aid if UK-based.
- [ ] **1–2 individual organisers** with a clear, verifiable need. They test the organiser KYC, the bank-name check and the bank-change cooldown.

Every organisation should:

- [ ] Have an existing donor base (a church, an alumni group, a community), so that donation volume reflects real behaviour.
- [ ] Agree to give feedback every week and to let us use the campaign as a case study.
- [ ] Accept the pilot caps: suggested ₦5,000,000 / £5,000 per campaign and ₦1,000,000 / £1,000 per payout, so that every payout needs two admin approvals.

## Before launch (per organisation)

- [ ] **Organiser account** created; email verified; **2FA turned on** (Settings → Privacy and safety).
- [ ] **Identity check** done with the live capture, and approved in `/admin/identity`. For Nigeria, the government database check returns "verified".
- [ ] **Payout route** set up:
  - [ ] Stripe Connect onboarding finished (UK); **or**
  - [ ] a bank account is added, and the bank's name for it matches the name on the ID (check at the first payout); **or**
  - [ ] the supplier is in the vendor network:
    - [ ] registry checked, bank name matched, contact confirmed in `/admin/vendors`.
- [ ] **Campaign** written with the organiser:
  - [ ] a clear goal and a budget broken into milestones;
  - [ ] a cover photo;
  - [ ] a story of at least 300 characters;
  - [ ] the risk score in the admin campaign list is "low", or the reasons for a higher score are understood.
- [ ] **Donor-facing explainer** shared with the organiser's community: how staged release works, the fee page, how to get updates, and the 30-day refund.
- [ ] **WhatsApp share card** tested from the campaign page.

## During the pilot (weekly)

- [ ] Reconciliation report clean (`/admin/reconciliation`). Investigate and note every discrepancy.
- [ ] Payout review checklist used for every funding request. No overrides without a note.
- [ ] Receipts uploaded within the deadline. Chase overdue ones from the organiser to-do list.
- [ ] Donor update emails sent for each payout and receipt. Spot-check one inbox.
- [ ] Fraud queue reviewed: flagged donations, high-risk launches.
- [ ] 15-minute call with each organiser. Log issues in the backlog.

## Measures of success

| Measure | Target |
|---|---|
| Donation completion (started checkouts that end in a payment) | ≥ 60% |
| Donor repeat or monthly rate | ≥ 10% |
| Median time from approved funding request to money received | ≤ 2 working days |
| Payouts with a receipt within the deadline | ≥ 90% |
| Reconciliation discrepancies unexplained after 48 h | 0 |
| Unsubscribe rate on donor update emails | ≤ 5% |
| Organiser satisfaction (would recommend, 0–10) | ≥ 8 |

## End of pilot

- [ ] Write a one-page case study per organisation, with permission.
- [ ] Decide on any fee, structure and product changes before general availability.
- [ ] Lift the caps only when counsel's recommended structure is in place.
