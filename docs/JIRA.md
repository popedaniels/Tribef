# Fund&Trace — Chronological Jira Release & Sprint Traceability

**Project Key**: `FT`  
**Timeline**: October 2021 – August 2026 + Roadmap  
**Contributors**: `wisdomosara`, `popedaniels`, `dollegit`  
**Total Sprints / Releases**: 7 Chronological Sprints + 1 Future Backlog Sprint  
**Total Stories**: 18 Stories  
**Total Sub-Tasks**: 62 Granular Sub-Tasks  

---

## 📅 Chronological Sprint Release Timeline

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CHRONOLOGICAL SPRINT TIMELINE                                        │
├───────────────┬───────────────────────────────┬──────────────────────────────────┬─────────────────────┤
│ SPRINT        │ DATE / TIMEFRAME              │ FOCUS AREA                       │ COMMITS / PRS       │
├───────────────┼───────────────────────────────┼──────────────────────────────────┼─────────────────────┤
│ Sprint 1      │ Oct 2021                      │ Foundation, CI/CD & Email Engine │ PR #50–64 (Backend) │
│ Sprint 2      │ Nov 11–15, 2021               │ Auth, Campaigns & Discovery      │ PR #117–125 (FE)    │
│ Sprint 3      │ Nov 21–30, 2021               │ Payments, Requests & Refunds     │ PR #65–68 & #126–130│
│ Sprint 4      │ Dec 2021                      │ Charities & Registry Lookup      │ PR #131–133 (FE)    │
│ Sprint 5      │ Feb–May 2022                  │ Auth Hardening & Bugfixes        │ PR #69–78 (BE)      │
│ Sprint 6      │ Aug 18–20, 2026               │ Design System & TypeScript       │ `ee805ec` – `7bf8248│
│ Sprint 7      │ Aug 20, 2026                  │ Escrow, KYC, Idempotency & Ops   │ `f31a567`, `8bc4ed8`│
│ Backlog       │ Future Roadmap                │ Hardware Telemetry & Anti-Fraud  │ Execution Plan      │
└───────────────┴───────────────────────────────┴──────────────────────────────────┴─────────────────────┘
```

---

## 🏛️ SPRINT 1 (October 2021): Foundation, CI/CD & Email Engine

### 📖 Story `FT-101`: CI/CD Pipeline & GitHub Actions Automation
* **Date**: `2021-10-23`
* **Commits**: `2e5f99a`, `c76b106`, `2aa935a`, `3d8a761`, `48f150e`, `560b564`, `d6883b1`, `f4dc7b8`, `97ccfd2`, `fb27e9e` (PR #50–#60)
* **Component**: `DevOps / CI`
* **Sub-Tasks**:
  * [x] `FT-101.1`: Set up GitHub Actions CI workflow `.github/workflows/FandTBackend.yaml` for automated backend lint and test execution.
  * [x] `FT-101.2`: Configure pull-request triggers on `developer` and `master` branches.
* **Acceptance Criteria**: All backend PRs automatically run tests and block merging on failure.

---

### 📖 Story `FT-102`: Transactional Email Notification Pipeline
* **Date**: `2021-10-31`
* **Commits**: `0d0aaf3`, `294862a`, `a509282`, `6dd7b52`, `e103dae` (PR #61–#64)
* **Component**: `FundandTraceBackend (Services)`
* **Sub-Tasks**:
  * [x] `FT-102.1`: Build Nodemailer / Gmail OAuth2 mailing transport engine in `services/mailing.js`.
  * [x] `FT-102.2`: Create `welcomeMail.js` and `resetPassword.js` notification services.
  * [x] `FT-102.3`: Implement `donation.js` sending branded receipts to donors.
  * [x] `FT-102.4`: Implement `services/replySupportMessage.js` for automated helpdesk responses.
* **Acceptance Criteria**: Emails dispatch asynchronously without blocking Express request cycles.

---

## 🎨 SPRINT 2 (Nov 11–15, 2021): Auth, Campaigns & Discovery

### 📖 Story `FT-201`: User Sign-In, Sign-Up & Password Reset Layouts
* **Date**: `2021-11-13`
* **Commits**: `71b561d`, `0e32dc0`, `4c91d39`, `1b39818` (PR #119–#120)
* **Component**: `FundandTrace (Frontend)`
* **Sub-Tasks**:
  * [x] `FT-201.1`: Build registration and sign-in views (`src/pages/SignUp/` and `src/pages/SignUp/SignIn.jsx`).
  * [x] `FT-201.2`: Build email verification screen (`src/pages/SignUp/VerifyEmail.jsx`).
  * [x] `FT-201.3`: Build password reset request and password reset token screens (`src/pages/ForgotPassword/`).
* **Acceptance Criteria**: Users can register, verify email addresses, and reset passwords through validated email tokens.

---

### 📖 Story `FT-202`: Homepage Components & African Region Showcase
* **Date**: `2021-11-14`
* **Commits**: `0dd435c`, `fefd97e`, `9334ba0`, `0a66503`, `260e97f`, `658a964`, `7f68994`, `3b03023` (PR #121–#122)
* **Component**: `FundandTrace (Frontend)`
* **Sub-Tasks**:
  * [x] `FT-202.1`: Build homepage hero section, transparency pillars, and African regional impact banner (`African.jsx`).
  * [x] `FT-202.2`: Create `TopCampaignSection.jsx` and `ActiveCampaignCard.jsx` displaying live funding progress bars.
  * [x] `FT-202.3`: Build donation checkout modal component (`DonationsModal.jsx`).
* **Acceptance Criteria**: Homepage renders campaign cards with dynamic progress percentages.

---

### 📖 Story `FT-203`: Multi-Step Campaign Creation Wizard
* **Date**: `2021-11-15`
* **Commits**: `a860dbe`, `a71cde5`, `d5ba4d0`, `3271115`, `9b902af`, `79c61ad` (PR #123–#125)
* **Component**: `FundandTrace (Frontend)` & `FundandTraceBackend (API)`
* **Sub-Tasks**:
  * [x] `FT-203.1`: Build campaign type selector (`/StartACampaign/type`).
  * [x] `FT-203.2`: Build basic information form with cover photo upload (`/StartACampaign/BasicInformation`).
  * [x] `FT-203.3`: Build story editor and video embed inputs (`/StartACampaign/Content`).
  * [x] `FT-203.4`: Build primary and secondary contact collection with government ID image uploaders (`/StartACampaign/Team`).
  * [x] `FT-203.5`: Implement banking form for payout account number and sort code (`/StartACampaign/Funding`).
* **Acceptance Criteria**: Form state persists across steps in Redux; campaign is bound strictly to `organizerId`.

---

## 💳 SPRINT 3 (Nov 21–30, 2021): Payments, Requests & Refunds

### 📖 Story `FT-301`: Stripe Checkout, Flutterwave & Milestone Tracking
* **Date**: `2021-11-21`
* **Commits**: `916828f`, `9e6c773`, `17c1105` (PR #65–#66, Backend) & `ba7b78b`, `dfff90d`, `e9bf63f`, `f485b78` (PR #127–#128, Frontend)
* **Component**: `FundandTraceBackend (API)` & `FundandTrace (Frontend)`
* **Sub-Tasks**:
  * [x] `FT-301.1`: Implement Stripe Checkout Session generator in `controller/donations.js`.
  * [x] `FT-301.2`: Implement initial Flutterwave redirect integration.
  * [x] `FT-301.3`: Build milestone tracking aggregation endpoint `trackingFunction` in `controller/fundingRequest.js`.
  * [x] `FT-301.4`: Implement initial AES encryption utility (`utility/encryption.js`) for banking data.
  * [x] `FT-301.5`: Build user contribution history view (`/dashboard/my-contributions.jsx`).
* **Acceptance Criteria**: Donors can initiate Stripe and Flutterwave donations; campaign tracking data aggregates all approved milestones.

---

### 📖 Story `FT-302`: Admin Refund Dashboard & Stripe Refund Execution
* **Date**: `2021-11-24 – 2021-11-30`
* **Commits**: `0548338`, `431ecf3`, `7d66e81`, `00894cd`, `49e2481`, `a5acf5f`, `3420023` (PR #67–#68, Backend) & `27d0651`, `4751ce5`, `5059cac`, `166bd0a` (PR #129–#130, Frontend)
* **Component**: `FundandTrace (Frontend)` & `FundandTraceBackend (API)`
* **Sub-Tasks**:
  * [x] `FT-302.1`: Build Admin Refunds view (`/admin/refunds.jsx`) and `RefundsDetailsCard.jsx`.
  * [x] `FT-302.2`: Create backend refund handler in `controller/adminRefunds.js` calling Stripe `refunds.create`.
  * [x] `FT-302.3`: Atomically decrement campaign balances and update donation record refund statuses.
* **Acceptance Criteria**: Full and partial refunds execute through Stripe and reflect on campaign balances.

---

## 🏛️ SPRINT 4 (December 2021): Charities & Registry Lookup

### 📖 Story `FT-401`: UK/Global Charity Registry Verification
* **Date**: `2021-12-06`
* **Commits**: `31483c5`, `c98665a`, `3e202ba`, `d4f1a61`, `2cdb0ec`, `f91e816`, `3426b28` (PR #131–#133)
* **Component**: `FundandTrace (Frontend)` & `FundandTraceBackend (API)`
* **Sub-Tasks**:
  * [x] `FT-401.1`: Create charity onboarding registration view (`/SignUp/charities.jsx`).
  * [x] `FT-401.2`: Build charity lookup search bar querying official Charity Commission API.
  * [x] `FT-401.3`: Store verified charity registration number on user records.
  * [x] `FT-401.4`: Display verified charity shield badge on charity campaign cards.
* **Acceptance Criteria**: Official charity registration is verified before activating charity campaign mode.

---

## 🔐 SPRINT 5 (Feb–May 2022): Auth Hardening & Bugfixes

### 📖 Story `FT-501`: JWT Cookie Verification & 401/403 Authorization Hardening
* **Date**: `2022-02-06 – 2022-05-05`
* **Commits**: `2290a83`, `6fccd87`, `764c40f`, `cbf22b4`, `37d008d`, `00ebcd9`, `9d2af53`, `6ce83a3`, `d9748a5`, `b2ef8cf`, `d20fa6f`, `feec25e`, `81c57ea`, `12a6230`, `8e7527e`, `8e5a188`, `7c8cca2` (PR #69–#78, Backend) & `a8aefac`, `8cb4985`, `6e0af9c` (PR #134, Frontend)
* **Component**: `FundandTraceBackend (API)`
* **Sub-Tasks**:
  * [x] `FT-501.1`: Refactor JWT token extraction in `contoller/user.js` and `contoller/charity.js` to resolve unauthorized edge cases.
  * [x] `FT-501.2`: Ensure `TOKEN_SECRET` verification failure returns clean HTTP 403 response.
  * [x] `FT-501.3`: Fix fee calculation rounding in frontend pricing tables (`fees.jsx`).
* **Acceptance Criteria**: All authenticated routes verify JWT tokens reliably without unexpected 401/403 errors.

---

## 🎨 SPRINT 6 (Aug 18–20, 2026): Design System & TypeScript Migration

### 📖 Story `FT-601`: Design System Redesign & Protocol Validator
* **Date**: `2026-08-18`
* **Commit**: `ee805ec` (Frontend)
* **Component**: `FundandTrace (Frontend)`
* **Sub-Tasks**:
  * [x] `FT-601.1`: Redesign homepage with live activity ticker, traceability steps, and interactive escrow workflow simulator.
  * [x] `FT-601.2`: Build glassmorphic mobile dock (`Explore`, `Launch`, `Tracker`, `Dashboard`) in `Layout.tsx`.
  * [x] `FT-601.3`: Enforce safe-area viewport padding and global `overflow-x: hidden` bleed defense.
  * [x] `FT-601.4`: Build automated 15-point protocol validation tool (`scripts/validate-checklist.js`).
* **Acceptance Criteria**: `npm run validate` reports 15/15 passed (100% compliance).

---

### 📖 Story `FT-602`: 100% TypeScript Pages Migration & Dark Mode Overhaul
* **Date**: `2026-08-20`
* **Commits**: `931167d`, `8a6babf`, `7bf8248` (Frontend)
* **Component**: `FundandTrace (Frontend)`
* **Sub-Tasks**:
  * [x] `FT-602.1`: Convert all 70 pages from `.jsx` to `.tsx` in `src/pages/` (`_app.tsx`, `_document.tsx`, `_error.tsx`).
  * [x] `FT-602.2`: Implement Redux theme state slice and CSS variables for high-contrast dark theme.
  * [x] `FT-602.3`: Refactor modals, dropdowns, and navigation bars for WCAG AA dark mode text contrast.
  * [x] `FT-602.4`: Enforce strict TypeScript compilation (`tsc --noEmit`) in CI.
* **Acceptance Criteria**: `npm run typecheck` exits with 0 errors across all 70 routes.

---

## 🛡️ SPRINT 7 (Aug 20, 2026): Escrow, KYC, Idempotency & Ops

### 📖 Story `FT-701`: Backend Hardening, Health Probes & Mocha Test Suite
* **Date**: `2026-08-20`
* **Commit**: `f31a567` (Backend)
* **Component**: `FundandTraceBackend (API)`
* **Sub-Tasks**:
  * [x] `FT-701.1`: Fix controller naming conventions and configure Mongoose fail-fast `bufferCommands: false`.
  * [x] `FT-701.2`: Mount multi-tier IP rate limiters (50 req/15min on auth, 300 req/15min on public APIs).
  * [x] `FT-701.3`: Add `sanitizeInput` middleware to strip Mongo operator keys (`$`, `.`).
  * [x] `FT-701.4`: Implement `/live`, `/ready`, and `/health` probe endpoints for Kubernetes.
  * [x] `FT-701.5`: Write and pass 12/12 Mocha & Chai unit and integration tests.
  * [x] `FT-701.6`: Build disaster recovery scripts (`backup-mongo.sh`, `restore-mongo.sh`, `purge-secrets.sh`, `smoke-test.sh`).
* **Acceptance Criteria**: Mocha test suite passes 12/12; `/ready` returns 503 if database is disconnected.

---

### 📖 Story `FT-702`: Milestone Escrow, Stripe Identity KYC & Idempotency
* **Date**: `2026-08-20`
* **Commit**: `8bc4ed8` (Backend)
* **Component**: `FundandTraceBackend (API)`
* **Sub-Tasks**:
  * [x] `FT-702.1`: Implement Stripe Identity verification session generator (`POST /api/identity/create-session`) with selfie matching.
  * [x] `FT-702.2`: Implement Stripe Identity webhook handler (`POST /api/identity/webhook`).
  * [x] `FT-702.3`: Define `vendorDisbursement` schema in `fundingRequestModel.js` with AES-256 encrypted banking details.
  * [x] `FT-702.4`: Build automated donor dispute circuit-breaker (`POST /api/campaigns/:id/dispute`) auto-freezing payouts on $\ge 3$ disputes.
  * [x] `FT-702.5`: Add transaction idempotency guards in Stripe and Flutterwave webhook listeners to eliminate double crediting.
  * [x] `FT-702.6`: Implement startup assertion `assertValidConfig()` to fail fast on weak or missing secrets.
* **Acceptance Criteria**: Webhook retries are acknowledged idempotently; dispute circuit-breaker immediately halts disbursements.

---

## 🔮 SPRINT 8 (Future Roadmap / Backlog): Hardware Telemetry & Anti-Fraud

### 📖 Story `FT-801`: In-App Live Camera Capture Enforcement
* **Component**: `Mobile / React Native`
* **Sub-Tasks**:
  * [ ] `FT-801.1`: Build in-app hardware camera component disabling photo library/gallery selection.
  * [ ] `FT-801.2`: Embed client-side cryptographic timestamp watermark on captured frame.
  * [ ] `FT-801.3`: Verify EXIF metadata matches live hardware sensor characteristics.

---

### 📖 Story `FT-802`: Hardware GPS & Anti-Mocking Telemetry
* **Component**: `Mobile / React Native`
* **Sub-Tasks**:
  * [ ] `FT-802.1`: Extract GNSS latitude, longitude, and accuracy radius upon receipt capture.
  * [ ] `FT-802.2`: Detect and reject mocked locations using Android `Location.isFromMockProvider()` and iOS simulation flags.
  * [ ] `FT-802.3`: Compute geofencing distance between campaign declared project location and capture location.

---

### 📖 Story `FT-803`: Dynamic Video Liveness Challenge
* **Component**: `Mobile / Backend`
* **Sub-Tasks**:
  * [ ] `FT-803.1`: Generate short-lived random numeric challenge code (`crypto.randomInt`).
  * [ ] `FT-803.2`: Require organizer to record 5-second video speaking the challenge code on camera.
  * [ ] `FT-803.3`: Implement speech-to-text verification matching spoken audio with active challenge token.

---

### 📖 Story `FT-804`: Google Play Integrity & Apple App Attest
* **Component**: `Mobile / Security`
* **Sub-Tasks**:
  * [ ] `FT-804.1`: Integrate Play Integrity API on Android to verify device and app licensing integrity.
  * [ ] `FT-804.2`: Integrate DeviceCheck / App Attest on iOS to verify genuine Apple hardware.
  * [ ] `FT-804.3`: Reject milestone evidence submitted from rooted, jailbroken, or emulated environments.
