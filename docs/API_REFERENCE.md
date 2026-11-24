# Fund&Trace — REST API Reference

Base URL (Development): `http://localhost:5000`  
Base URL (Production): `https://api.fundandtrace.com`

---

## 🔐 Authentication & Headers

Fund&Trace uses **JWT Bearer Tokens** and **HTTP-only Cookies** for user and admin session management.

* **User Auth Header**: `Authorization: Bearer <jwt_token>` (or `token` cookie)
* **Internal Webhook Header**: `x-internal-webhook-secret: <INTERNAL_WEBHOOK_SECRET>`
* **Stripe Webhook Signature**: `stripe-signature: <signature_hash>`

---

## 📋 API Route Index

### 1. Identity & KYC (`/api/identity`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/identity/create-session` | User | Initiates a Stripe Identity Verification Session for biometric KYC. |
| `GET` | `/api/identity/status/:userId` | User | Returns the KYC status of the user (`unverified`, `pending`, `verified`). |
| `POST` | `/api/identity/webhook` | Stripe | Webhook handler for `identity.verification_session.verified`. |
| `POST` | `/api/identity/admin-verify/:userId` | Admin | Manual administrative KYC verification override. |

#### `POST /api/identity/create-session`
* **Request Body**:
  ```json
  {
    "userId": "6228221c5690b201dc93ec3e",
    "campaignId": "60f7117f2ee78d31b4de0f7d"
  }
  ```
* **Response `(200 OK)`**:
  ```json
  {
    "status": 200,
    "data": {
      "sessionId": "vs_123456789",
      "url": "https://verify.stripe.com/start/...",
      "clientSecret": "seti_secret_...",
      "status": "pending"
    }
  }
  ```

---

### 2. Campaigns (`/api/campaigns`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/campaigns` | Public | Returns all active, launched campaigns. |
| `GET` | `/api/campaigns/:id` | Public | Retrieves a single campaign with details and donation metrics. |
| `POST` | `/api/campaigns/:id/dispute` | Public / Donor | Files a verified donor dispute and triggers the escrow circuit-breaker if thresholds are met. |
| `GET` | `/api/campaigns/:id/dispute-status` | Public | Returns dispute count, volume, and lock status for a campaign. |
| `POST` | `/api/campaigns/add-comment` | User | Adds a public encouragement comment to a campaign. |

#### `POST /api/campaigns/:id/dispute`
* **Request Body**:
  ```json
  {
    "donorEmail": "donor@example.com",
    "donorName": "Jane Doe",
    "donorId": "6228221c5690b201dc93ec3e",
    "disputeCategory": "Fake Evidence / Altered Receipt",
    "description": "Milestone receipt does not match the vendor invoice number.",
    "evidenceAttachmentUrl": "https://cloudinary.com/..."
  }
  ```
* **Response `(200 OK)`**:
  ```json
  {
    "status": 200,
    "message": "Dispute report filed successfully.",
    "data": {
      "isLocked": true,
      "disputeCount": 3,
      "lockReason": "Automated circuit-breaker triggered: 3 verified donor reports filed."
    }
  }
  ```

---

### 3. Milestone Funding Requests & Escrow (`/api/fundingRequests`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/fundingRequests` | User | Submits a milestone funding request (supports Direct-to-Vendor). |
| `GET` | `/api/fundingRequests/campaign/:id` | Public | Retrieves all funding requests submitted for a specific campaign. |
| `GET` | `/api/fundingRequests/user/:id` | User | Retrieves all funding requests created by the authenticated organizer. |
| `GET` | `/api/fundingRequests/campaignTracker/:id` | Public | Data aggregation endpoint for the public campaign audit tracker page. |

#### `POST /api/fundingRequests`
* **Request Body**:
  ```json
  {
    "fundingRequest": {
      "campaignId": "60f7117f2ee78d31b4de0f7d",
      "organizerId": "6228221c5690b201dc93ec3e",
      "fundingType": "thirdParty",
      "amount": 2500,
      "currency": "USD",
      "purposeOfFunding": "Purchase of Phase 2 laboratory medical supplies",
      "proofOfFunding": "https://res.cloudinary.com/.../receipt.pdf",
      "vendorDisbursement": {
        "isDirectToVendor": true,
        "vendorCategory": "Hospital / Healthcare Provider",
        "vendorLegalName": "St. Jude Medical Equipment Co.",
        "invoiceNumber": "INV-2026-884",
        "bankDetails": {
          "bankName": "JPMorgan Chase",
          "accountName": "St. Jude Medical Equipment",
          "accountNumber": "9876543210",
          "routingOrSortCode": "021000021"
        }
      }
    }
  }
  ```
* **Security Behavior**: Banking parameters are automatically encrypted using AES-256 before writing to MongoDB. If the campaign is frozen under dispute, returns `403 Forbidden`.

---

### 4. Donations & Payments (`/api/donations`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/donations/stripe/payment` | Public | Creates a Stripe Checkout Session for campaign donation. |
| `POST` | `/api/donations/stripe-webhook` | Stripe | Handles signed Stripe webhook (`checkout.session.completed`). |
| `POST` | `/api/donations/flutterwave` | Public | Initiates a Flutterwave standard payment link. |
| `GET` | `/api/donations/flutterwave/verify/:id`| Public | Verifies Flutterwave transaction ID and credits donation idempotently. |
| `POST` | `/api/donations/stripeWebhook/:id` | Internal | Internal disbursement handler triggered upon admin funding request approval. |

---

### 5. Administration (`/api/admin`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/fundingRequests/:page` | Admin | Lists all pending and approved funding requests with pagination. |
| `POST` | `/api/admin/approveFundingRequest/:id`| Admin | Approves milestone request, decrypts bank info, and executes disbursement. |
| `POST` | `/api/admin/declineFundingRequest/:id`| Admin | Rejects milestone request and sends notification email with reason. |
| `POST` | `/api/admin/refunds/create` | Admin | Issues full or partial donor refunds via Stripe API. |
| `POST` | `/api/admin/suspendUser/:id` | Admin | Suspends user account and freezes active campaigns. |

---

## 🧾 Trust, ledger & payouts (added November 2026)

### Public ledger (`/api/ledger`)

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/ledger/:campaignId?page=&limit=` | Public | Hash-chained entries (credit, payout, payout_reversal, refund), oldest first |
| GET | `/api/ledger/:campaignId/verify` | Public | Server-side chain check: `{ valid, length, headHash, balance }` or `{ valid:false, brokenAt, reason }` |

Each entry's `hash = SHA-256(JSON.stringify([campaignId, seq, type, amount.toFixed(2), CURRENCY, refId, memo, atISO, prevHash]))`; the first `prevHash` is 64 zeros. The tracker page re-verifies the chain in the visitor's browser.

### Transparency Score

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/campaigns/:id/transparency` | Public | `{ score 0–100, grade, factors[{key,label,points,max,detail}], proofOverdue[] }` |

### Proof of spend

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/fundingRequests/:id/receipt` | Campaign owner | `{ receiptUrl }` (https, host in `RECEIPT_HOSTS`); only after the payout was made |

### Payout rails (`/api/payouts`)

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/payouts/options?currency=NGN` | Public | Which rail pays this currency: `{ rail: "flutterwave"\|"paystack"\|null, country }` |
| GET | `/api/payouts/banks?country=NG` | Public | `[{ code, name }]`, cached 12h |
| POST | `/api/payouts/resolve-account` | Signed in | `{ bankCode, accountNumber }` → `{ accountName }` |

Bank transfers settle asynchronously; Flutterwave `transfer.completed` and Paystack `transfer.success|failed|reversed` webhooks (same signed endpoints as charges) finalise them. A failed transfer returns funds to escrow, writes a `payout_reversal` ledger entry and reopens the request.

### Refunds

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/donations/refund-policy` | Public | `{ enabled, windowDays }` |
| POST | `/api/donations/:donationId/refund` | Donor (owner) | Self-service refund within the window; 409 with a `code` when ineligible (`window_closed`, `insufficient_escrow`, `campaign_frozen`, …). Rate limit 5/day |
| POST | `/api/admin/refunds/stripeRefund/:campaignId/:donationId` | Admin | Any gateway (name kept for compatibility) |
| POST | `/api/admin/refunds/stripeRefundBatch/:campaignId` | Admin | Pro-rata refund of everything left in escrow (207 if some failed) |

### Disputes & audit (admin)

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/admin/disputes/frozen` | Campaigns frozen by the circuit-breaker, with reports |
| POST | `/api/admin/disputes/:id/resolve` | `{ action: "unlock"\|"refund", note (≥10 chars) }`; refund suspends the campaign and returns the remaining escrow pro-rata |
| GET | `/api/admin/audit?page=&targetId=` | Admin audit trail (actor, action, target) |

### Sessions

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/logout-all` | Signed in | Revokes every session (sessionVersion bump) |

Password reset and change also revoke existing sessions; change keeps the current device signed in.

### Status codes used

`400` invalid input · `401` not signed in / session revoked · `403` not allowed (incl. `code: "kyc_required"`) · `404` not found · `409` conflict or already processed · `422` business rule · `423` campaign frozen (`code: "campaign_frozen"`) · `502` payment provider rejected · `503` dependency unavailable.

## 🔐 Ledger anchors, operations and review (added November 2026)

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `GET /api/ledger/anchors?limit=30` | public | Recent daily anchors: date, Merkle root, digest, previous digest, where published |
| `GET /api/ledger/anchors/:date` (`latest` allowed) | public | One anchor with every leaf `{campaignId, seq, head}` |
| `GET /api/ledger/anchors/:date?format=txt` | public | The exact statement that was published (its SHA-256 is the digest) |
| `GET /api/ledger/anchors/:date?format=ots` | public | OpenTimestamps proof for that statement |
| `GET /api/ledger/:campaignId/proof?date=` | public | Inclusion proof: `{included, anchor, leaf, leafHash, path:[{hash, side}]}` |
| `GET /api/admin/ops/status` | admin | Last 14 integrity checks and anchors, last 30 scheduled job runs |
| `POST /api/admin/ops/integrity/run` | admin | Run the integrity check now and return the full report (no alert sent) |
| `GET /api/admin/fundingRequest/:id/review` | admin | Review checklist: `{verdict: ready|review|blocked, checks[], campaign, history[]}` |
| `GET /api/fundingRequests/me/todos` | organiser | What the signed-in organiser should do next, most urgent first |

Every response now carries an `X-Request-Id` header (an upstream id is kept if
it's 8–64 word characters). 500 responses include `requestId` in the body.

Payment-provider webhooks are exempt from rate limiting. Paystack and
Flutterwave signatures are checked against the raw request body.

Checkout endpoints (`createStripeSession`, `initializePaystack`, `initialize`,
`recurring`) return **400 `currency_mismatch`** when the requested currency
isn't the campaign's. `amount` is always the **total charged** (donation + tip);
the campaign is credited `amount − meta.tip`.
