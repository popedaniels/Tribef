# Data protection

How Fund&Trace handles personal data: what it holds, for how long, and what users can do. It covers the UK GDPR / Data Protection Act 2018 and the Nigeria Data Protection Act 2023 (NDPA). It is a working document for the team and **not legal advice**. Have counsel review it before launch, together with the fund-holding brief (`docs/briefs/COUNSEL_BRIEF.md`).

## What we hold

| Data | Whose | Why (lawful basis) | Where |
|---|---|---|---|
| Name, email, password hash, phone, country | Account holders | Contract (running the account) | `users`, `credentials` |
| Donation records: amount, tip, card fee, gateway reference, donor name and email | Donors | Contract; legal obligation (financial records) | `donations` |
| Gift Aid declaration (name, house number, postcode) | UK donors who opt in | Legal obligation (HMRC requires the charity to keep it) | `donations.giftAid` |
| Payout bank details (encrypted at rest) | Organisers, third-party payees | Contract | `campaigns.funding`, `fundingrequests` |
| Identity verification: status, document type and country, name on ID, live-capture media (sealed, encrypted) | Organisers | Legal obligation (AML/KYC before paying out); legitimate interest (fraud prevention) | `users.identityVerification`, evidence store |
| Fraud signals: IP address, keyed card hash, scores | Donors | Legitimate interest (fraud prevention) | `donations.fraud` |
| Organiser risk score | Organisers | Legitimate interest (fraud prevention) | `campaigns.riskAssessment` (admins only) |
| Activity log | All users, admins | Legitimate interest (security, audit) | `activitylogs` |
| Email preferences, push subscriptions | Donors, users | Consent | `emailoptouts`, `pushsubscriptions` |

We never hold card numbers: the gateways (Stripe, Paystack, Flutterwave) do. The "card hash" is a keyed HMAC of the gateway's own card signature. It cannot be reversed into a card number.

## Retention

The daily job `data-retention` (`services/privacy.js`) applies these limits. Set `RETENTION_JOBS=false` to stop it.

| Data | Kept for | Then |
|---|---|---|
| Donor IP address (fraud checks) | 90 days (`RETAIN_DONOR_IP_DAYS`) | Cleared |
| Activity log, excluding the admin audit trail | 2 years (`RETAIN_ACTIVITY_DAYS`) | Deleted |
| Admin audit trail (entries with an actor) | Indefinitely | Review with counsel |
| Unsubmitted live-capture sessions | 30 days after expiry | Deleted |
| Unverified accounts that never ran a campaign or donated | 90 days (`RETAIN_UNVERIFIED_DAYS`) | Deleted |
| Queued emails (`mailoutboxes`) | 30 days | TTL index |
| Reconciliation reports | 400 days | TTL index |
| Donations, payouts, ledger, Gift Aid | 6 years after the transaction | **Not yet automated**: de-identify after 6 years (see below) |
| KYC records | 5 years after the relationship ends (AML) | **Not yet automated** |

## Users' rights

- **Access / portability.** *Settings → Privacy and safety → Download my data* (`GET /api/auth/me/export`). The download includes the profile, campaigns (with bank numbers masked to the last 4 digits), funding requests, donations made with the account email, monthly gifts, email preferences and activity. It does not include identity document images; support provides those on request after checking identity.
- **Erasure.** *Delete my account* (`POST /api/auth/me/delete`; needs the password and the word DELETE). It:
  - removes the login and the profile details;
  - signs the user out everywhere;
  - deletes draft campaigns that never took money;
  - de-identifies the user's donations: the name becomes "Former donor", the email is replaced and the IP address is cleared. The amounts are kept.

  Deletion is refused while money is held in escrow, while funding requests are pending, or while monthly gifts are active. Those obligations have to be settled first.
- **Guest donors**, who give without an account, ask support to erase their data. Support runs the same de-identification on donations under that email.
- **Rectification** is done through the profile page. Name-on-ID changes require a new identity check.
- **Objection to fraud processing** goes to support and is reviewed by a person. We don't switch fraud checks off for individuals.

## DPIA notes

A Data Protection Impact Assessment is required, because we:

- process identity documents and biometric-adjacent video (live capture);
- profile users for fraud (risk score, card and IP signals);
- operate across borders (UK and Nigeria).

The points below are inputs for the DPIA, not the DPIA itself.

1. **Live capture and ID.**
   - Purpose: confirm that a real, present person matches the ID before money is paid to them.
   - Necessity: payouts go to individuals; AML requires KYC.
   - Minimisation: we keep the last 4 digits and a keyed hash of government ID numbers, never the full number. Media is encrypted, and access to it is logged.
   - Risks: breach of ID images; misuse by staff.
   - Mitigations: encryption at rest, admin 2FA (enforced), audit trail.
   - Gaps: retention of ID media after verification is not yet automated; counsel should advise on the period.
2. **Automated decisions.**
   - The risk score and fraud flags never block anyone on their own. They route cases to human review. Checkout velocity limits do block, but only temporarily (15 minutes), and the user can retry or contact support.
   - This keeps us outside UK GDPR Art. 22 / NDPA s.37 "solely automated decisions with legal or similarly significant effect". Confirm with counsel.
3. **International transfers.**
   - Processors include MongoDB Atlas (region to confirm), Stripe, Paystack, Flutterwave, the email provider (SES/Postmark), Cloudflare (Turnstile) and, optionally, SentinelNG.
   - Each needs a DPA, and transfer safeguards (IDTA/SCCs) for UK→Nigeria/US flows.
   - NDPA registration with the NDPC is needed as a data controller of major importance, depending on volume.
4. **Third-party payees.** Hospitals, schools and suppliers are named in funding requests and appear on the public tracker. Show organisers a notice, and give payees a contact route.
5. **Children.** Campaigns for minors' medical or school costs will name children. Add guidance for organisers: no full names or faces without parental consent. Moderation already exists.

## Still to do

- Automate 6-year de-identification of donation and payout records, and KYC media retention, once counsel confirms the periods.
- Add a records-of-processing (ROPA) spreadsheet and a processor list with signed DPAs.
- Set up a breach procedure: 72-hour notification to the ICO and NDPC, with named owners.
- Put a cookie banner in front of analytics (GTM only loads in production builds today).
