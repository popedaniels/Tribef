# Fund&Trace — Competitive Analysis & Product Strategy

> Researched November 2026. Figures are from each platform's public pages or
> reputable comparisons at that date; fees change, so re-check before quoting
> them externally. Sources are listed at the end.

## 1. Executive summary

The crowdfunding market has converged on **"0% platform fee + optional donor
tip + card processing fees"** (GoFundMe, JustGiving, Chuffed, Givebutter).
Price is no longer a differentiator; Fund&Trace's "zero platform fee" message
is table stakes, not an advantage.

What competitors still **don't** offer is *verifiable* proof of where money
went. Today donors are asked to trust:

- **a guarantee after the fact** (GoFundMe Giving Guarantee: refund if
  something goes wrong),
- **vetting before the fact** (GlobalGiving due diligence, Ketto/Milaap
  hospital checks), or
- **a public blockchain** (Giveth), which mainstream donors and most African
  and medical beneficiaries can't use.

Fund&Trace's escrow + milestone + public tracker model sits in the gap
between those three. It's the only model that controls money *during* the
campaign. The strategy is to make that control **visible, verifiable and
safe**, then match the table-stakes features where Fund&Trace trails.

## 2. Who we compete with

| Platform | Segment | Fee model | Trust mechanism | Payout model |
| --- | --- | --- | --- | --- |
| **GoFundMe** | Personal & charity, global | 0% platform fee; ~2.9% + $0.30 processing (US); optional tip | Giving Guarantee: refund if misused; trust & safety team | Organiser withdraws freely to bank |
| **JustGiving** | UK charities & sponsorship | 0% platform fee; ~1.9% + 20–30p processing; 5% of Gift Aid if used; tips | Registered charities; Gift Aid agent | To charity |
| **GlobalGiving** | Vetted nonprofits, 175+ countries | 5–12% support fee + 3% processing | Due diligence + renewal every 2 years, field visits | Periodic disbursement to vetted orgs |
| **Chuffed** | Social causes | "Keep 100%" (donor pays card fee, tips) or 4.9% flat | Light review | Stripe payouts |
| **M-Changa** | Kenya, mobile money | 4.25% platform fee; 0% on M-Pesa, 2.5% on cards | Fundraiser verification, treasurer roles | M-Pesa / bank withdrawal |
| **Ketto / Milaap / ImpactGuru** | Indian medical | 0%-fee options; tips | KYC + hospital document checks + calls/visits | **Direct to hospital** |
| **Givebutter / Donorbox** | Nonprofit CRM & forms | Tip-funded (Givebutter) or 1.75–2% + plans (Donorbox) | Registered nonprofits | To nonprofit |
| **Giveth** | Crypto public goods | 0% fee | On-chain transparency, project verification | On-chain, direct |

## 3. Capability comparison

Legend: ● strong · ◐ partial · ○ absent. Fund&Trace column reflects this branch.

| Capability | GoFundMe | JustGiving | GlobalGiving | M-Changa | Ketto/Milaap | Giveth | **Fund&Trace** |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| 0% platform fee | ● | ● | ○ | ○ | ● | ● | ● |
| Funds held until spending is verified | ○ | ○ | ◐ | ○ | ◐ | ○ | **●** |
| Pay suppliers/hospitals directly | ○ | ○ | ○ | ○ | ● | ○ | **●** |
| Public, line-by-line spend tracker | ○ | ○ | ◐ reports | ◐ | ○ | ● | **●** |
| **Independently verifiable (tamper-evident) ledger** | ○ | ○ | ○ | ○ | ○ | ● on-chain | **● hash-chained ledger** |
| Donor-triggered automatic freeze | ○ | ○ | ○ | ○ | ○ | ○ | **●** |
| Donor refund guarantee | ● | ◐ | ◐ | ○ | ◐ | ○ | **● escrow-backed (pro-rata)** |
| Organiser ID verification (KYC) | ● | ● | ● | ● | ● | ◐ | **● before payout** |
| Public per-campaign trust score | ○ | ○ | ◐ GG Rewards tiers | ○ | ◐ badges | ◐ GIVpower | **● Transparency Score** |
| Mobile money / African rails | ○ | ○ | ◐ via M-Changa | ● | ○ | ○ | **● Flutterwave/Paystack payouts** |
| Recurring donations + self-service management | ◐ | ● | ● | ○ | ◐ | ◐ | **●** |
| Self-service refunds for donors | ○ | ○ | ○ | ○ | ○ | ○ | **● 30-day window** |
| Gift Aid (UK) | ◐ | ● | ● | ○ | ○ | ○ | ○ *(roadmap)* |
| Peer-to-peer team fundraising | ● | ● | ◐ | ● | ● | ○ | ○ *(roadmap)* |
| CRM / integrations | ◐ | ● | ◐ | ○ | ○ | ○ | ○ *(roadmap)* |

## 4. Where Fund&Trace must win (and how this release does it)

### 4.1 Make transparency verifiable, not just visible
Everyone can show a progress bar. Only Giveth makes records tamper-evident,
and it requires crypto. **Built:** an append-only, SHA-256 **hash-chained
ledger** of every credit, payout and refund per campaign, with a public
`verify` endpoint. Anyone (donor, journalist, auditor) can recompute the chain
and detect any edited or deleted entry, without a wallet.

### 4.2 Turn a guarantee into a mechanism
GoFundMe promises refunds after misuse. Fund&Trace can **prevent** misuse,
because unspent money is still in escrow. **Built:**
- automatic freeze when ≥ 3 donors or ≥ 15 % of funds are disputed,
  now enforced on donations, approvals and payouts;
- an admin **dispute resolution** flow: unlock, or **pro-rata refund** of the
  remaining escrow to every donor;
- **self-service refunds** within 30 days (spec'd in `SELF_SERVICE_REFUNDS.md`).

### 4.3 Verify the person before money moves
Ketto/Milaap release funds only after verification. **Built:** identity
verification (KYC) is **required before any organiser payout** (vendor
payouts to a verified institution are exempt), with admin manual verification
as a fallback.

### 4.4 Show trust at a glance
GlobalGiving ranks partners; Indian platforms use badges. **Built:** a
0–100 **Transparency Score** per campaign, computed from verifiable facts
(KYC, receipts uploaded for payouts, proof timeliness, update cadence, dispute
state), with its breakdown shown publicly so it can't be a black box.

### 4.5 Serve African beneficiaries natively
M-Changa wins Kenya on mobile money; global platforms pay out poorly to
African banks. **Built:** Flutterwave and Paystack **bank payouts** (NGN, GHS,
KES, ZAR, UGX…) with bank lists and account resolution, alongside Stripe
Connect for GBP/USD/EUR.

### 4.6 Close the proof loop
**Built:** organisers upload receipts after each payout; the tracker flags
payouts with overdue proof, and the Transparency Score reflects it.

## 5. Table stakes we now match

- Recurring giving with a donor management page (cancel any time).
- Session revocation on password reset/change ("sign out everywhere").
- Admin audit trail with the acting admin on every sensitive action.
- Charity registry checks beyond the UK (US IRS via ProPublica Nonprofit
  Explorer), plus admin-verified manual registration for other countries.
- WCAG-oriented accessibility pass with automated axe checks.

## 6. Roadmap (not built in this release)

| Priority | Feature | Why |
| --- | --- | --- |
| High | **Gift Aid** declarations + HMRC claim export | Adds 25 % to eligible UK gifts. JustGiving charges 5 % of Gift Aid, so a free implementation is a real edge |
| High | **Vendor network**: pre-verified hospitals/schools/suppliers with invoice matching | Ketto/Milaap's strongest trust lever, generalised beyond medical |
| High | **Mobile money collection** (M-Pesa STK push via Flutterwave) | M-Changa's core advantage in Kenya |
| Medium | Peer-to-peer team fundraising pages | GoFundMe/JustGiving growth loop |
| Medium | Matching gifts / corporate match | GlobalGiving & Givebutter revenue driver |
| Medium | External anchoring of ledger head hashes (e.g. daily to a public timestamping service) | Makes the ledger tamper-evident even against the platform operator |
| Medium | CRM exports & webhooks (Salesforce, Mailchimp) | Chuffed/Givebutter parity for charities |
| Low | Native mobile apps | PWA covers most needs today |

## 7. Honest limits

- A guarantee is a legal and financial commitment, not a code feature.
  Publishing a "Fund&Trace Guarantee" needs counsel, reserves and
  regulator-compliant terms (escrow/safeguarding rules differ in the UK, the
  EU, Nigeria and Kenya; holding client money may require a licence or a
  regulated partner).
- KYC, payouts and refunds call real provider APIs that were integration-tested
  here only with mocks; run them in each provider's sandbox before going live.
- "Best in the world" is earned with users. The features above give
  Fund&Trace a **defensible, verifiable trust advantage**, which is the axis
  that matters most in this market.

## Sources

- GoFundMe fees & Giving Guarantee — gofundme.com/c/blog/gofundme-fees, gofundme.com/guarantee
- JustGiving fees & Gift Aid — justgiving.com/about/fees, justgiving.com/for-charities/pricing
- GlobalGiving vetting & fees — globalgiving.org/nonprofits, globalgiving.org/aboutus/how-it-works/vetting
- M-Changa fees — mchanga.africa/mchanga-fees
- Chuffed fees — docs.chuffed.org (fees article), chuffed.org/features
- Ketto / Milaap / ImpactGuru verification & hospital disbursement — ketto.org blog, impactguru.com/info
- Givebutter / Donorbox — givebutter.com/alternatives/donorbox, g2.com Donorbox pricing
- Giveth — gitcoin.co/apps/giveth
