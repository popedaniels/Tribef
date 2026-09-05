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
