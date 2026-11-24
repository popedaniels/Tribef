# Brief for counsel: holding donor money

**From:** Fund&Trace founders · **Date:** 24 November 2026 · **For:** fintech / payments counsel in the UK and Nigeria (Ghana and Kenya later)

This brief comes from the engineering team. It describes how money actually moves today so counsel can say what structure is lawful. It contains questions, not conclusions.

## 1. What the product promises

Donors give to a campaign. The money does **not** go straight to the organiser. Fund&Trace holds it, and releases it in stages against funding requests that an admin reviews:

- Large payouts need two admins to approve them.
- Payouts go directly to verified suppliers (hospitals, schools, contractors) where possible.
- Every payout must be followed by a receipt.

The product calls this "escrow" in the UI. Other parts of the promise:

- Donors can refund themselves within 30 days (`REFUND_WINDOW_DAYS`).
- If a campaign is found fraudulent, donors get a pro-rata refund of what's left.
- A public, tamper-evident ledger shows every credit and payout, and is anchored daily to a public repository.
- There is no platform fee. The card processing fee is shown and passed on at cost on African rails; it is opt-in for UK/EU cards. Donors may add an optional tip.

## 2. How money moves today

| Step | Stripe (GBP/USD/EUR) | Paystack (NGN/GHS/KES/ZAR/USD) | Flutterwave (NGN and others) |
|---|---|---|---|
| Donor pays | Stripe Checkout, Fund&Trace's own Stripe account | Paystack checkout, Fund&Trace's merchant account | Flutterwave checkout, Fund&Trace's merchant account |
| Funds settle to | **Fund&Trace's business bank account** | **Fund&Trace's business bank account** | **Fund&Trace's business bank account** |
| "Escrow" is | a balance in our database per campaign; not a separate bank account | same | same |
| Payout | Stripe Connect transfer to the organiser's Express account, **or** a bank transfer | Paystack Transfers to a bank account | Flutterwave Transfers to a bank account |

So in practice:

- Donor money for every campaign is pooled in one ordinary business account, together with tips (our revenue) and card fees (which we then pay to the processor).
- Nothing separates it in law from the company's own money.
- We hold it for days to months before paying it out.

## 3. Questions

**A. Is this regulated, and under what?**

1. **UK.** Is holding donations and paying them out later a payment service ("money remittance") or e-money under the Payment Services Regulations 2017 / Electronic Money Regulations 2011? Does any exclusion apply, such as the commercial agent exclusion, given we act for the organiser and the donor at the same time?
2. **Nigeria.** Does this need a CBN licence (a payment service provider category, or a switching/processing licence)? Or can it run under our processors' licences? What about the CBN's position on holding customer funds?
3. **Ghana and Kenya** (later). Same question under the Payment Systems and Services Act 2019 (Ghana) and the National Payment System Act (Kenya).
4. **Charities.** Does anything change when the beneficiary is a registered charity? The UK Charities Act and Fundraising Regulator rules apply to "commercial participators" and platforms.

**B. Which structure should we move to?** We can build any of these. Please tell us which are lawful and what each needs.

| Option | How it works | What we lose |
|---|---|---|
| 1. Processor holds the funds | Stripe Connect "separate charges and transfers", or destination charges with manual payouts, so funds sit in Stripe's (regulated) balance until released. Paystack and Flutterwave split payments / subaccounts with settlement holds. | Paystack and Flutterwave holds are short and not designed for months. They may not support staged release. |
| 2. Regulated partner holds the funds | Safeguarded accounts with an EMI or bank partner (UK: e.g. a banking-as-a-service provider; Nigeria: a licensed PSP or trustee bank). We instruct releases by API. | Cost, onboarding time, partner due diligence. |
| 3. Trust account | Funds held on trust for donors and beneficiaries in a segregated client account, with a declaration of trust. | Is this enough on its own, or still regulated activity? |
| 4. Get licensed ourselves | Small payment institution / small EMI in the UK; a CBN licence in Nigeria. | Time, capital, compliance staff. |
| 5. Charity-only model | Only registered charities receive funds; we act as the charity's agent. | Individual fundraisers (medical, school fees) are most of the demand. |

**C. Wording and promises**

5. Can we call it "escrow" without a licensed escrow agent? If not, what wording can we use? For example, "held until reviewed" or "released in stages".
6. Are the 30-day self-refund and the pro-rata fraud refund enforceable as written? Do they create liabilities we must safeguard against?
7. If Fund&Trace became insolvent, whose would the pooled money be? (This question decides between options 1–4.)

**D. Related**

8. **AML/KYC.** Our current checks are:
   - organisers do a live ID and selfie-video check before launch, plus a government database check (Smile ID) in Nigeria;
   - each payout account's holder name is checked with the bank before payment;
   - a 48-hour hold applies after a bank change;
   - payout thresholds require two admins.

   Is this enough? Who files suspicious activity reports, and to whom (NCA in the UK, NFIU in Nigeria)?
9. **Card fees.**
   - Confirm that passing processing fees to donors is lawful in Nigeria, Ghana and Kenya.
   - Confirm that keeping it opt-in in the UK satisfies the Payment Surcharges Regulations 2012.
   - Is the `/fees` page wording enough?
10. **Tips.** Are optional tips our taxable revenue? Do they need to be shown differently?
11. **Data protection.** See `docs/DATA_PROTECTION.md`. Do we need a DPIA, NDPC registration, and retention periods for KYC media and money records? We have assumed 6 years for money records and 5 years after the relationship ends for KYC.

## 4. What we need back

- A recommended structure (section B), and what it takes to implement: licences, partner, contracts.
- Required changes to the Terms, Privacy Policy and the product wording.
- Whether we can keep taking real money during a small pilot (3–5 organisations, capped amounts) while the structure is put in place, and on what conditions.

## Attachments we can provide

- Money-flow diagram per gateway.
- Ledger design: `docs/LEDGER_ANCHORING.md`.
- Refund rules: `docs/SELF_SERVICE_REFUNDS.md`.
- Identity checks: `docs/LIVE_EVIDENCE.md`.
- Data map: `docs/DATA_PROTECTION.md`.
- Admin payout controls: two-person rule, bank-name check, cooldown.
