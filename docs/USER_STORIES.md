# Fund&Trace — User Stories

> Product backlog written as user stories with testable acceptance criteria.
> Every story is mapped to the code that implements it (or marked as a gap), so
> this file doubles as a feature inventory and gap analysis.
>
> **Last reviewed:** November 2026 against branch `fix/audit-hardening-ui-polish`.
> Competitive context and the reasoning behind the trust features: [`COMPETITIVE_ANALYSIS.md`](COMPETITIVE_ANALYSIS.md).

**Status key**

| Mark | Meaning |
| --- | --- |
| ✅ | Implemented and covered by the acceptance criteria below |
| 🟡 | Partially implemented: the gap is called out in **Gap** |
| ⬜ | Backlog: not implemented yet |

**Priority** uses MoSCoW: **M**ust, **S**hould, **C**ould, **W**on't (this release).

---

## Contents

1. [Personas](#1-personas)
2. [Epic A: Accounts, sign-in & identity](#epic-a--accounts-sign-in--identity)
3. [Epic B: Discovering campaigns](#epic-b--discovering-campaigns)
4. [Epic C: Donating](#epic-c--donating)
5. [Epic D: Creating a campaign](#epic-d--creating-a-campaign)
6. [Epic E: Running a campaign](#epic-e--running-a-campaign)
7. [Epic F: Milestone escrow, funding requests & payouts](#epic-f--milestone-escrow-funding-requests--payouts)
8. [Epic G: Public traceability](#epic-g--public-traceability)
9. [Epic H: Trust, safety & disputes](#epic-h--trust-safety--disputes)
10. [Epic I: Refunds](#epic-i--refunds)
11. [Epic J: Admin console](#epic-j--admin-console)
12. [Epic K: Notifications](#epic-k--notifications)
13. [Epic L: Platform quality (non-functional)](#epic-l--platform-quality-non-functional)
14. [Definition of Done](#definition-of-done)
15. [Gap summary](#gap-summary)

---

## 1. Personas

| Persona | Who they are | What they need from Fund&Trace |
| --- | --- | --- |
| **Dami, the donor** | Gives £10–£200 a few times a year, often from a phone after seeing a shared link. Has been burned by a crowdfunding scam before. | Proof that money reaches the cause; a fast checkout in her currency; a receipt. |
| **Kofi, the organiser** | Raising money for a family member's surgery or a community project. Not technical. | A quick setup, clear rules on how to get funds out, and tools to reassure donors. |
| **Grace, the charity admin** | Runs a registered charity's fundraising. | Verified charity status, payouts direct to the charity's account, statements for trustees. |
| **Vendor (hospital, school, supplier)** | Receives funds directly for an invoice. | Correct payment against the invoice, without handling donor data. |
| **Ada, the platform reviewer (admin)** | Trust & safety / finance operations. | A queue of funding requests to review, fraud signals, the ability to freeze, suspend and refund. |
| **Visitor** | Browsing before signing up. | Understand how escrow works and why it's safer. |

---

## Epic A — Accounts, sign-in & identity

### A-1 Sign up as an individual ✅ (M)
**As a** visitor **I want to** create an account with my name, email and password **so that** I can donate with a history and start campaigns.

- **Given** a valid name, unique email and a password meeting the policy, **when** I submit, **then** an account is created, a verification email is sent, and I am told to check my inbox.
- **Given** an email that already has an account, **when** I submit, **then** I get **409** "email already used" and no second account is created.
- **Given** an invalid email or weak password, **then** the field shows an inline error and the form is not submitted.
- I must accept the Terms of Service; the Terms modal shows a real summary that links to `/terms` and `/privacy`.

*Code:* `POST /api/auth/signup` · `src/pages/SignUp/individual.tsx` · `TermsModal.jsx`

### A-2 Sign up as a registered charity ✅ (S)
**As** Grace **I want to** register my charity with its registration number **so that** campaigns show as charity-verified.

- **Given** a registration number, **when** I tab out of the field, **then** the number is checked against the charity register and the charity name is pre-filled.
- **Given** a number that is not found, **then** I see "We couldn't find this charity" and can't submit as a verified charity.

*Code:* `POST /api/auth/signup/charity` · `GET /api/charities/charity/checkCharity/:regNo` · `src/pages/SignUp/charities.tsx`
- I choose where the charity is registered: **England & Wales** (Charity Commission), **United States** (EIN via IRS/ProPublica), or **elsewhere** (Nigeria, Kenya, Ghana, other), which is marked for manual review by our team because those registries have no public API.

*Code:* `services/charityRegistry.js`

### A-3 Verify my email ✅ (M)
**As a** new user **I want to** confirm my email **so that** the platform knows I own it.

- **Given** the link from my verification email, **when** I open it, **then** my account is marked verified and I am signed in or sent to sign-in.
- **Given** an expired or tampered link, **then** I see a clear error and can request a new email.

*Code:* `GET /api/auth/signup/verifyUser/:email` · `POST /api/auth/signup/verifyEmail/:email` · `src/pages/SignUp/VerifyEmail.tsx`

### A-4 Sign in and return to where I was ✅ (M)
**As a** returning user **I want to** sign in and land back on the page that asked me to **so that** I don't lose my place.

- **Given** valid credentials, **then** a session cookie is set (HTTP-only) and I am redirected to the `?next=` path, or `/dashboard` if none.
- **Given** a `next` value that is not a same-origin path (`https://…`, `//…`), **then** it is ignored and I go to `/dashboard` (no open redirect).
- **Given** an unknown email *or* a wrong password, **then** I get the same **401** "Email or password is incorrect", with equalised timing (no account enumeration; previously the two cases returned different messages).
- **Given** 2FA is enabled on my account, **then** sign-in completes only after the TOTP challenge (A-7).
- Repeated failures are rate-limited (50 requests / 15 min per IP on `/api/auth`).

*Code:* `POST /api/auth/login` · `src/pages/SignUp/SignIn.tsx` · `safeNextPath()` in `src/hooks/useRequireAuth.ts`

### A-5 Stay signed in across refreshes ✅ (M)
**As a** signed-in user **I want** a page refresh to keep me signed in **so that** I'm not bounced out of my dashboard.

- **Given** I'm signed in, **when** I hard-refresh any `/dashboard/*` page, **then** I see a loading state until my session is restored, and then the page, never a redirect to the homepage.
- **Given** I'm signed out, **when** I open a `/dashboard/*` URL, **then** I'm redirected to sign-in with `?next=<that URL>`, and no API calls are made with an empty user id.

*Code:* `useRequireAuth()` · `AuthGate` · `src/layouts/DashboardLayout.tsx`, `CampaignDashboardLayout.tsx`

### A-6 Reset a forgotten password ✅ (M)
**As a** user who forgot my password **I want to** reset it by email **so that** I can regain access.

- **Given** any email, **when** I request a reset, **then** I always get the same "if an account exists, we've sent a link" response; only real accounts receive mail (no enumeration).
- **Given** a valid reset link, **when** I set a new password (min. 8 characters), **then** I can sign in with it.
- Reset links expire after **15 minutes** and are **single-use**: each token is bound to the current password hash, so it stops working once used, and older outstanding links die too.

- Resetting or changing my password **signs out every other session** (each token carries a session version that is checked on every request); changing it keeps this device signed in.
- I can **sign out of all devices** from Settings → Security. Suspended accounts lose access immediately.

*Code:* `authenticate()` in `utility/auth.js` · `POST /api/auth/logout-all`

*Code:* `/api/resetPassword/*` · `src/pages/ForgotPassword/*`

### A-7 Protect my account with two-factor authentication ✅ (S)
**As a** user handling money **I want** TOTP 2FA **so that** a stolen password isn't enough.

- **Given** I enable 2FA, **then** I scan a QR code and confirm a 6-digit code before it is enabled.
- **Given** 2FA is on, **when** I sign in, **then** I must pass `/api/auth/2fa/challenge` before a session is issued.
- The TOTP secret is encrypted at rest (AES-256-GCM).

*Code:* `routes/twoFactor.js` · `utility/twoFactor.js`

### A-8 Edit my profile and change my password ✅ (S)
- I can update my name, photo and contact details; I can only edit **my own** profile (403 otherwise).
- Changing my password requires being signed in as that user.

*Code:* `POST /api/auth/updateProfile/:id` · `POST /api/auth/changePassword/:email` · `src/pages/dashboard/edit-profile.tsx`

### A-9 Verify my identity (KYC) ✅ (M)
**As** Kofi **I want to** verify my identity once **so that** donors trust me and I can receive funds.

- **Given** I start verification, **then** a Stripe Identity session opens (ID document and selfie).
- **When** Stripe confirms the result by signed webhook, **then** my status becomes `verified`; I can see the status in my dashboard.
- **Given** `REQUIRE_KYC_TO_LAUNCH=true`, **when** an unverified organiser tries to launch, **then** launch is refused with "Verify your identity before launching a campaign".

*Code:* `routes/identity.js` · `controller/startCampaign.js#launch`
- KYC is **required before any payout to the organiser** (see F-5).

### A-10 Sign out ✅ (M)
- Signing out clears the session cookie server-side and the persisted client state.

---

## Epic B — Discovering campaigns

### B-1 Understand the escrow model from the homepage ✅ (M)
**As a** visitor **I want to** quickly understand how Fund&Trace differs **so that** I trust it over other platforms.

- The homepage explains the four-step milestone flow, shows a live activity ticker, a comparison matrix and an escrow simulator.
- All primary CTAs ("Start a Campaign", "Explore Verified Causes") are reachable by keyboard with a visible focus ring.

*Code:* `src/pages/index.tsx` · `src/components/homepageComponents/*`

### B-2 Browse by category ✅ (M)
- `/Categories` lists categories; `/category/:name` shows a hero, success stories and launched, non-suspended campaigns for that category.

*Code:* `GET /api/campaigns/searchByCategory/:category` · `src/pages/category/[name].tsx`

### B-3 Search campaigns by title or location ✅ (M)
**As** Dami **I want to** search by name or country **so that** I can find a campaign someone told me about.

- **Given** a search term, **when** I choose "Campaigns", **then** results match the campaign title (case-insensitive); **when** I choose "Location", **then** they match the country.
- I can filter by category and sort by **Newest** or **Highest raised**; results are paginated (12 per page) with a total count.
- Special characters in my search are treated literally (escaped server-side).
- The API accepts only `{query:{title|location|category}, sort:{_id|createdAt|funding.amountRaised: 1|-1|"asc"|"desc"}}`. Mongo operators or unknown sort keys get a **400**.

*Code:* `GET /api/campaigns/searchByName/:page` · `src/pages/search.tsx` · tests in `tests/controllers/campaign.test.js`

### B-4 See trending and similar campaigns ✅ (C)
- Trending ranks recent momentum; a campaign page shows similar campaigns from the same category.

*Code:* `GET /api/discovery/trending` · `GET /api/discovery/similar/:id`

### B-5 View a campaign ✅ (M)
**As** Dami **I want** a campaign page with the story, goal, progress, organiser and updates **so that** I can decide whether to give.

- Shows title, media, story, amount raised vs goal (progress bar), number of donors, organiser profile, updates, comments, and a link to the public tracker.
- Shows the campaign's **Transparency Score** (G-5).
- **Given** the campaign is frozen under dispute review, **then** the campaign page shows a "Paused for review" notice and the Donate button is disabled; the donate page explains the pause instead of showing the form, and the API refuses new donations and subscriptions with **423**.
- Invalid campaign ids return **400**; unknown ids show a friendly not-found state.

*Code:* `GET /api/campaigns/campaign/:id` · `src/pages/campaign/[id]/index.tsx`

### B-6 Browse charities, stories, news and events ✅ (C)
*Code:* `src/pages/charities/*`, `fundraising-stories.tsx`, `stories/[id]`, `news/[id]`, `events/[id]`

---

## Epic C — Donating

### C-1 Donate by card in my currency ✅ (M)
**As** Dami **I want to** donate in GBP, USD, EUR or a local currency **so that** I don't pay conversion surprises.

- **Given** an amount and currency, **when** I continue, **then** I'm sent to the right processor (Stripe for card/GBP/USD/EUR; Flutterwave or Paystack for NGN/GHS/KES and mobile money).
- The amount field accepts numbers only, shows the currency symbol, and fits on a 360px-wide phone without horizontal scrolling.
- Stripe.js, Flutterwave and Paystack scripts are allowed by the Content-Security-Policy (previously Stripe.js was blocked).

*Code:* `src/pages/donate/[id].tsx` · `POST /api/donations/createStripeSession/:id` · `initializePaystack/:id` · `/flutterwave/:id` · `next.config.js` CSP

### C-2 My donation is recorded exactly once ✅ (M)
**As** Dami **I want** my donation counted once, even if the payment provider retries **so that** totals are accurate.

- Donations are recorded only from **signature-verified** webhooks (Stripe, Flutterwave `verif-hash`, Paystack HMAC).
- Replayed webhooks are idempotent: no duplicate donation, no double credit.
- The campaign total is credited atomically (`$inc`), so concurrent donations can't lose updates.
- An amount or currency that doesn't match the checkout session is rejected.

*Code:* `controller/donations/{stripe,flutterwave,paystack}.js` · webhook tests in `tests/controllers/*Webhook.test.js`

### C-3 Get a confirmation and receipt ✅ (M)
- After paying I land on `/donated/:id` with a thank-you, share buttons and what happens next.
- I receive an email receipt; signed-in donors can download a PDF receipt for their own donation only.

*Code:* `GET /api/donations/:donationId/receipt` · `services/donation.js`

### C-4 Give monthly ✅ (S)
**As** Dami **I want to** set up a monthly gift **so that** I support a long-running cause without remembering.

- **Given** I choose monthly, **then** a Stripe subscription is created; I can see and cancel my subscriptions.

*Code:* `routes/recurring.js`
- `/dashboard/subscriptions` lists my monthly gifts (campaign, amount, status, total given) and lets me cancel; cancellation stops future payments at the end of the paid period.

*UI:* `src/pages/dashboard/subscriptions.tsx`

### C-5 See my contribution history ✅ (S)
- `/dashboard/my-contributions` lists my donations; I can only fetch my own (403 for other emails).

*Code:* `GET /api/donations/allDonations/:email` · `GET /api/auth/contributions/:email`

### C-6 Get statements about how my money was used ✅ (M)
**As** Dami **I want** emails when funds from a campaign I supported are released **so that** I can follow the money.

- When a funding request is disbursed, whitelisted donors get an "approved funding request" email and a funding summary.
- An email failure never affects the payout.

*Code:* `controller/donations/payout.js` · `services/approvedFundingRequest.js`, `fundingSummaryMail.js`

---

## Epic D — Creating a campaign

### D-1 Start a campaign in guided steps ✅ (M)
**As** Kofi **I want** a step-by-step wizard **so that** I don't get overwhelmed.

- Steps: **Type → Category → Basic information → Content → Team → Funding → Settings → Pre-launch review**.
- Progress is saved as a draft after each step; returning to the wizard restores my draft.
- Opening the wizard with no draft makes **no** API call for a draft (previously it requested `/campaign/undefined`).

*Code:* `src/pages/StartACampaign/*` · `src/layouts/StartLayout.tsx` · `routes/startCampaign.js`

### D-2 Only I can edit my draft ✅ (M)
- Every wizard endpoint requires that I own the campaign.
- **Given** a request names more than one campaign id (URL, body, funding request, query), **when** they differ, **then** it is rejected with **403** (fixes an IDOR where body `id` overrode the URL id).

*Code:* `requireCampaignOwner` in `utility/auth.js` · tests in `tests/unit/auth.guards.test.js`

### D-3 Add payout details securely ✅ (M)
- Bank name, account name/number and sort code are encrypted at rest (AES-256-GCM, random IV) and never returned to the public.

*Code:* `controller/startCampaign.js#funding` · `utility/encryption.js`

### D-4 Launch only when ready ✅ (M)
**As** the platform **I want** launched campaigns to be complete **so that** donors never see half-finished pages.

- **Given** a campaign without a title or a funding goal > 0, **when** I launch, **then** I get **422** listing what's missing.
- Suspended campaigns can't be launched (**403**).
- `launch` must be a boolean; the launch date is stamped only on first launch.
- Optional KYC gate (see A-9).

*Code:* `controller/startCampaign.js#launch`

### D-5 Delete a draft ✅ (S)
- I can delete my own unlaunched draft; I can't delete anyone else's (see D-2).

*Code:* `DELETE /api/campaigns/draft/delete/:id`

---

## Epic E — Running a campaign

### E-1 Campaign dashboard ✅ (M)
- `/dashboard/:id` shows raised, available balance, donors, chart, funding requests and their status.

### E-2 Post updates ✅ (M)
- I can post text and media updates; followers get a web-push notification where enabled; only the owner can post.

*Code:* `POST /api/campaigns/campaign/addUpdate/:id` (owner + Joi validated)

### E-3 Reply to comments ✅ (S)
- Signed-in users can comment; comments are length-validated.

### E-4 Share my campaign ✅ (S)
- One-tap sharing to WhatsApp, X/Twitter, Facebook, LinkedIn and email; copy-link.

### E-5 Choose who receives statements ✅ (S)
- I can manage the email whitelist for funding statements on my campaign.

*Code:* `routes/campaignEmailWhitelist.js`

### E-6 Get paid into my bank account ✅ (M)
**As** Kofi **I want to** connect a Stripe Express account **so that** approved funds reach me.

- Onboarding returns me to the dashboard; payouts are refused until `payoutsEnabled` is true (unless the request pays a third party).

*Code:* `routes/stripeConnect.js` · `controller/donations/payout.js`
- **Given** a campaign in an African currency (NGN, GHS, KES, ZAR, …), **when** I add payout details, **then** I pick my bank from a list and the account holder's name is confirmed before saving.
- Approved payouts are sent by **Flutterwave or Paystack** bank transfer with a unique reference per attempt; a failed or reversed transfer returns the money to escrow, is recorded on the public ledger, and reopens the request with a clear reason.

*Code:* `services/payoutRails.js` · `routes/payouts.js` · `BankAccountFields.tsx`

### E-7 Track referrals ✅ (C)
- I (or an admin) can see how many donations came from my shared links.

*Code:* `GET /api/discovery/referrals/:id`

---

## Epic F — Milestone escrow, funding requests & payouts

> Core promise: **donations are held in escrow and released only against
> reviewed funding requests.**

### F-1 Request funds for a milestone ✅ (M)
**As** Kofi **I want to** request a specific amount with evidence **so that** I can pay for the next stage.

- **Given** an amount > 0, a purpose and supporting documents, **when** I submit, **then** a **Pending** funding request is created.
- Server-owned fields (`status`, `disbursement`, `adminId`, `approvedAt`…) in my submission are ignored. A request can't be created already "Approved".
- **Given** the campaign is dispute-locked, **then** submission is refused (**403**).

*Code:* `POST /api/fundingRequests/addFundingRequest` · `src/pages/dashboard/[id]/fundingRequest.tsx`

### F-2 Pay a third party or vendor directly ✅ (M)
**As** Kofi **I want** the hospital paid directly **so that** donors know the money went to the bill.

- **Given** I choose "third-party", **then** the vendor's bank details are encrypted at rest and used for the payout instead of mine.
- `fundingType` is normalised (`third-party`, `thirdParty`, `third_party` all mean the same). The previous mismatch stored vendor details in **plaintext** and paid the campaign's account instead. Run `scripts/migrate-encryption.js --encrypt-plaintext` once to fix existing records.

*Code:* `utility/fundingType.js` · `controller/fundingRequest.js` · `controller/adminFundingRequests.js`

### F-3 Review a funding request ✅ (M)
**As** Ada **I want to** approve or decline requests **so that** only legitimate spending is released.

- I see the request, evidence, decrypted payout details and campaign balance.
- **Approve:** only a **Pending** request can be approved, atomically, so a double-click or two reviewers can't approve twice (**409** for the second). Refused with **423** if the campaign is dispute-locked.
- **Decline:** only **Pending** requests; the decline reason is emailed to the request's *stored* organiser.
- If disbursement fails before money moves, the request returns to Pending so it can be retried. If money already moved, it is never reset.

*Code:* `controller/adminFundingRequests.js`

### F-4 Disburse exactly once ✅ (M)
**As** the platform **I want** each approved request paid exactly once **so that** escrow balances are always correct.

- A per-request lock (`payoutLockedAt`) ensures only one payout runs at a time; repeats get **409**.
- The amount paid is the **reviewed** amount, not a value supplied by the caller.
- The campaign balance is reserved **before** the Stripe transfer and released if the transfer fails.
- Stripe transfers use an idempotency key per funding request.
- Donor-notification failures never fail a completed payout.

*Code:* `controller/donations/payout.js` · tests in `tests/unit/payout.test.js`

### F-5 Require KYC before payout ✅ (M)
- **Given** the organiser's identity status is not `verified`, **when** an admin approves a payout to the organiser, **then** it is refused with **403** `kyc_required`. Payouts straight to a third party/vendor are exempt. Admins can verify manually. (`REQUIRE_KYC_FOR_PAYOUT`)

### F-6 Organisers can't edit server-owned campaign data ✅ (M)
- The campaign wizard can change only the story, media, team, settings, goal, currency (until money arrives) and payout details. Escrow balances, suspension, dispute state, ownership and the Stripe payout account are server-owned; the API ignores them. (Previously an organiser could set their own balance or clear a dispute freeze.)

*Code:* `utility/campaignEdits.js`

---

## Epic G — Public traceability

### G-1 Follow the money on a public tracker ✅ (M)
**As** Dami **I want** a public timeline of every payout **so that** I can verify the organiser's claims.

- `/campaign/:id/tracker` lists approved funding requests with amount, date, purpose and receipt. Bank details are never shown.

*Code:* `GET /api/fundingRequests/campaignTracker/:id` · `src/pages/campaign/[id]/tracker.tsx`

### G-2 See dispute status publicly ✅ (S)
- The tracker and campaign page show whether the campaign is under dispute review, how many reports there are, and the lock reason.

*Code:* `GET /api/campaigns/:id/dispute-status`

### G-3 Upload proof of spend ✅ (S)
**As** Kofi **I want to** upload receipts after a payout **so that** donors see proof.

- After a payout I upload a receipt or invoice (image/PDF, ≤ 10 MB) from my payout history. Donors see it on the tracker.
- Proof is due within **14 days** (`PROOF_DUE_DAYS`); after that the payout shows "Proof overdue" and the Transparency Score drops.

### G-4 Verify the money trail myself ✅ (M)
**As** a sceptical donor, journalist or auditor **I want** a tamper-evident record of every money movement **so that** I don't have to take the platform's word for it.

- Every credit, payout, payout reversal and refund is appended to a per-campaign **SHA-256 hash chain** (each entry includes the previous entry's hash).
- The tracker lists the entries and a **Verify ledger** button recomputes the chain **in my browser**; any edited, removed or reordered entry is reported with its position.
- The raw ledger and a server-side check are public at `/api/ledger/:id` and `/verify`.

### G-5 Judge trust at a glance ✅ (M)
- Each campaign shows a 0–100 **Transparency Score** with a grade, computed only from verifiable facts: identity verified (25), proof uploaded (25), proof on time (15), disputes (15), share paid directly to suppliers (10), recent updates (10). "How it's calculated" shows every factor and its reason.

---

## Epic H — Trust, safety & disputes

### H-1 Report a campaign ✅ (M)
- Anyone can report a campaign from its page with a reason; reports reach the admin queue.

*Code:* `POST /api/reports` · `ReportCampaignComponent.jsx`

### H-2 Dispute a campaign I donated to ✅ (M)
**As** Dami **I want to** raise a dispute if I think funds are misused **so that** payouts stop while it's investigated.

- Only a verified donor to that campaign can dispute; one dispute per donor.
- **Circuit breaker:** **≥ 3** donor disputes **or** disputed volume **≥ 15 %** of funds raised locks the escrow automatically.
- While locked: no new funding requests (F-1), no approvals (F-3) and no payouts (F-4). Previously the lock was recorded but nothing enforced it.

*Code:* `POST /api/campaigns/:id/dispute` · `controller/campaign.js#fileDispute`

### H-3 Resolve a dispute ✅ (M)
**As** Ada **I want to** unlock a campaign or trigger pro-rata refunds **so that** a dispute ends cleanly.

- `/admin/disputes` lists frozen campaigns with the donor reports and escrow balance. With a written note I either **unlock** (donations and payouts resume) or **refund**: the campaign is suspended and everything left in escrow is refunded to every donor **pro-rata** to what they gave. Failed gateway refunds are listed and retryable.
- Both outcomes are recorded on the campaign and in the audit trail; refunds appear on the public ledger.

### H-4 Flag suspicious donations ✅ (M)
- Each donation is scored on email velocity, campaign hopping, IP velocity and geo mismatch; above the threshold it is **flagged, not blocked**, and appears in the admin fraud queue.

*Code:* `utility/fraud.js` · `GET /api/admin/fraud/flagged`

### H-5 Suspend campaigns and users ✅ (M)
- Admins can suspend/unsuspend campaigns and users with a message; the affected user is emailed. Suspended campaigns disappear from discovery and can't launch.

---

## Epic I — Refunds

### I-1 Refund a donation (admin) ✅ (M)
- Admins can refund a single Stripe donation or a batch; refunds are recorded on the donation's `refund` sub-document and are idempotent.

*Code:* `controller/adminRefunds.js` · `src/pages/admin/refunds.tsx`

### I-2 Refund my own donation (self-service) ✅ (S)
**As** Dami **I want to** refund a donation I made by mistake within 30 days **so that** I don't have to email support or charge back.

- From My Contributions I can refund a donation within **30 days** with a two-step confirmation, as long as the money is still in escrow and the campaign isn't frozen. Ineligible requests explain why (`window_closed`, `insufficient_escrow`, …). Max 5 requests a day.
- All refunds (mine, admin, dispute) go through one pipeline: atomic claim → escrow reserved with a balance guard (never below zero) → gateway refund (Stripe, Flutterwave or Paystack) with an idempotency key → ledger entry; any failure releases the reservation.

*Spec:* `docs/SELF_SERVICE_REFUNDS.md` · *Flag:* `ENABLE_SELF_REFUNDS`

---

## Epic J — Admin console

| ID | Story | Status |
| --- | --- | --- |
| J-1 | As Ada I sign in to a separate admin console with admin-only sessions. | ✅ |
| J-2 | I see an overview (campaigns, users, organisers, raised) and charts filtered by date range. | ✅ |
| J-3 | I can search and page through campaigns and users and open a detail view. | ✅ |
| J-4 | I can email a user from the console. | ✅ |
| J-5 | I can work the helpdesk: read, reply to and delete support messages. | ✅ |
| J-6 | I can review reports and the fraud queue. | ✅ |
| J-7 | Every successful admin change is recorded with who did it, what and to which record (`GET /api/admin/audit`). | ✅ |
| J-9 | I can resolve frozen campaigns (H-3). | ✅ |
| J-8 | Admin-only endpoints return **401/403** for anyone else, including the category seeding endpoint (previously open). | ✅ |

*Code:* `routes/admin.js` (all behind `requireAdmin`) · `src/pages/admin/*`

---

## Epic K — Notifications

| ID | Story | Status |
| --- | --- | --- |
| K-1 | Welcome email on sign-up | ✅ |
| K-2 | Donation receipt email | ✅ |
| K-3 | Funding request approved / declined email | ✅ |
| K-4 | "Target reached" email to the organiser | ✅ |
| K-5 | Funding summary statements to whitelisted donors | ✅ |
| K-6 | Web push for campaign updates (VAPID) | ✅ (no-op without keys) |
| K-7 | Unsubscribe link in every marketing/statement email | 🟡 verify each template |

Emails are sent asynchronously and failures never fail the user's action.

---

## Epic L — Platform quality (non-functional)

### L-1 Security ✅ (M)
- HTTPS-only (HSTS), strict CSP, CORS allow-list (foreign origins get **403**), origin-checked cookie mutations (CSRF), NoSQL payload sanitisation, tiered rate limits (auth 50 / API 300 / admin 100 per 15 min, Redis-backed when configured).
- Malformed MongoDB ids are rejected with **400** before any handler runs.
- **Public responses never contain private data.** Every unauthenticated campaign, tracker, search, discovery and organiser endpoint goes through `utility/publicViews.js`: no payout bank details, team contact email/phone/date of birth/address/ID images, Stripe account ids, dispute reporters, commenter emails, donor emails/IPs, or anonymous donors' names. The campaign owner gets full detail from `GET /api/campaigns/campaign/:id` only when signed in. (Previously this endpoint decrypted and returned the organiser's bank account to any visitor.)
- Secrets are validated at boot; production refuses to start with missing or placeholder secrets.

### L-2 Accessibility ✅ (M)
- Visible keyboard focus on all interactive elements; reduced-motion respected; 44px touch targets on touch devices; primary colour meets WCAG AA (4.8:1) for button labels.
- Automated **axe-core WCAG 2.1 A/AA** audit of 28 public, dashboard and admin pages: **0 violations** (from ~160 elements across 9 rule types). Fixes include labelled inputs, a keyboard-operable tablist on campaign pages, named progress bars, keyboard show-password toggles and contrast-safe colour tokens.
- Not covered by automation: screen-reader walkthroughs and form error announcements on every flow. Do a manual pass with NVDA/VoiceOver before launch.

### L-3 Responsive & mobile ✅ (M)
- No page scrolls horizontally at 360–390px width (checked on all public pages, wizard, dashboard and admin).
- Mobile bottom dock for primary navigation.

### L-4 Correct rendering ✅ (M)
- No React hydration errors in production builds (fixed nested `<a>` from legacy `next/link`, invalid `<ul>` in `<p>`, environment-dependent markup).
- Layout components live in `src/layouts/`, not `src/pages/`, so they aren't exposed as routes.

### L-5 Resilience ✅ (M)
- `/live` (process) and `/ready` (database) probes; a DB outage returns **503**, not 500.
- Service worker caches only immutable assets and shows an offline page; it never caches API or payment responses.

### L-6 CI that fails when it should ✅ (M)
- Backend unit tests (with coverage floor), Mocha integration tests against a real MongoDB service, syntax check; frontend lint, typecheck, Jest, production build. No step swallows exit codes.

### L-7 Observability ✅ (S)
- Structured logs (pino), Sentry error tracking (optional), activity log, daily gateway-vs-ledger reconciliation (`RECONCILE_DAILY=true`).

---

## Definition of Done

A story is done when:

1. Acceptance criteria pass, with an automated test for any money-movement, auth or permission rule.
2. `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass in `FundandTrace`; `npm run lint`, `npm run test:unit:cov` and `npm test` pass in `FundandTraceBackend`.
3. No new console errors or hydration warnings on the affected pages, desktop and 390px mobile.
4. Sensitive data (bank details, 2FA secrets) is encrypted at rest and never logged or returned publicly.
5. API errors use the right status: 400 invalid input · 401 not signed in · 403 not allowed · 404 not found · 409 conflict/already processed · 422 business-rule failure · 423 locked · 503 dependency down.
6. User-facing copy is real (no placeholder or lorem ipsum).

---

## Gap summary

Every gap from the November audit is now closed except K-7 (confirm every email template carries an unsubscribe link). What remains is roadmap work identified in [`COMPETITIVE_ANALYSIS.md`](COMPETITIVE_ANALYSIS.md):

| Priority | Feature | Why |
| --- | --- | --- |
| High | Gift Aid declarations + HMRC claim export | +25 % on eligible UK gifts; competitors charge 5 % of it |
| High | Pre-verified vendor network with invoice matching | Generalises the hospital-direct model that wins medical crowdfunding |
| High | M-Pesa / mobile-money **collection** (STK push) | Payouts are covered; Kenyan donors still need native giving |
| Medium | Anchor ledger head hashes externally (daily) | Extends tamper-evidence to the operator itself |
| Medium | Peer-to-peer team fundraising, matching gifts | Growth loops used by GoFundMe/JustGiving/GlobalGiving |
| Medium | CRM exports & webhooks | Charity tooling parity |
| — | Run provider sandboxes (Stripe, Flutterwave, Paystack, Stripe Identity) end-to-end | Integrations are unit-tested with mocks only |
| — | Manual screen-reader pass | Complements the automated a11y audit |
