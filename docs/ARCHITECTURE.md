# Fund&Trace — System Architecture & Escrow Engine

This document provides the high-level technical architecture, security perimeter, data flows, and state machine governing the Fund&Trace platform.

---

## 🏗️ High-Level System Architecture

```mermaid
graph TD
    Client["User / Donor / Organizer Browser"] --> Ingress["Ingress / Reverse Proxy (TLS Termination)"]
    
    subgraph "Frontend Tier (Port 3000)"
        Ingress --> NextServer["Next.js 11 Custom Node Server"]
        NextServer --> Redux["Redux Toolkit Store (Persisted Auth)"]
        NextServer --> Pages["SSR & Static Pages (70 Routes)"]
    end
    
    subgraph "Backend Tier (Port 5000)"
        NextServer -->|Proxy / REST API| Express["Express API Server"]
        Express --> Security["Security Middleware (Helmet, RateLimit, Sanitizer)"]
        Security --> Controllers["Domain Controllers (Campaigns, KYC, Funding, Admin)"]
        Controllers --> Crypto["AES-256-CBC Encryption Engine"]
    end
    
    subgraph "Database & Storage Tier"
        Crypto --> MongoDB[("MongoDB Cluster (Mongoose 5)")]
        Controllers --> Cloudinary["Cloudinary (Receipts, Campaign Media)"]
    end
    
    subgraph "Third-Party FinTech Integrations"
        Controllers --> Stripe["Stripe (Checkout, Refunds, Identity KYC)"]
        Controllers --> Flutterwave["Flutterwave (African Mobile Money & Cards)"]
        Controllers --> GoogleOAuth["Google Cloud (OAuth2 & Gmail Sending)"]
    end
```

---

## 🔒 The Milestone Escrow State Machine

Fund&Trace does not allow organizers to withdraw donated funds immediately. All funds follow a strict milestone lifecycle:

```mermaid
stateDiagram-v2
    [*] --> DonationReceived: Donor pays via Stripe / Flutterwave
    DonationReceived --> FundsInCustody: Signed Webhook confirms payment
    
    state FundsInCustody {
        [*] --> IdleInEscrow
        IdleInEscrow --> FundingRequestSubmitted: Organizer submits milestone proof
        FundingRequestSubmitted --> UnderAdminReview: Validated by Joi & AES Encrypted
        
        state DisputeCheck <<choice>>
        UnderAdminReview --> DisputeCheck
        DisputeCheck --> Disbursed: Admin Approves & No Disputes
        DisputeCheck --> Declined: Admin Declines
        DisputeCheck --> EscrowFrozen: >= 3 Disputes or >= 15% Volume
    }
    
    Disbursed --> MilestonePubliclyTracked: Balance deducted atomically & Donors emailed
    EscrowFrozen --> AdminInvestigation: Payouts completely locked
    AdminInvestigation --> ProRataRefund: Fraud confirmed -> Stripe Refund
    AdminInvestigation --> IdleInEscrow: Dispute resolved -> Unlocked
    Declined --> [*]
    ProRataRefund --> [*]
    MilestonePubliclyTracked --> [*]
```

---

## 🛡️ Security & Anti-Fraud Boundary

```
+-------------------------------------------------------------------------------+
|                             CLIENT PERIMETER                                  |
|  - React Controlled Inputs         - Viewport Safe Area (iOS/Android)         |
|  - Strict TypeScript Validation   - Localhost Port Guard (prevents collisions)|
+-------------------------------------------------------------------------------+
                                      │
                                      ▼
+-------------------------------------------------------------------------------+
|                            NETWORK & TRANSPORT                                |
|  - HSTS (max-age=31536000)         - Strict CORS Whitelist (credentials: true)|
|  - NoSQL Payload Sanitization      - Multi-Tier IP Rate Limiting (50/300 req) |
+-------------------------------------------------------------------------------+
                                      │
                                      ▼
+-------------------------------------------------------------------------------+
|                           DATA & CRYPTO LAYER                                 |
|  - Bank details encrypted at rest using AES-256-CBC + Initialization Vector   |
|  - Fail-fast database configuration (bufferCommands: false, 2000ms timeout)   |
|  - Environment assertion at startup (assertValidConfig fails on weak secrets) |
+-------------------------------------------------------------------------------+
```

---

## 📊 Core Data Entity Relationships

```mermaid
erDiagram
    USERS ||--o{ CAMPAIGN : organizes
    USERS ||--o{ DONATIONS : contributes
    USERS ||--o{ SUBSCRIPTIONS : subscribes
    USERS ||--o{ FUNDING_REQUESTS : requests
    USERS ||--o{ REPORTS : submits
    USERS ||--o{ CHARITIES : registers
    USERS ||--o{ ACTIVITY_LOGS : generates
    
    CAMPAIGN ||--o{ DONATIONS : receives
    CAMPAIGN ||--o{ FUNDING_REQUESTS : requests
    CAMPAIGN ||--o{ DISPUTE_REPORTS : audited_by
    CAMPAIGN ||--o{ SUBSCRIPTIONS : hosts
    CAMPAIGN ||--o{ REPORTS : reported_on
    CAMPAIGN ||--o{ SUPPORT_TICKETS : referenced_by
    CAMPAIGN ||--o{ WAITLIST : attracts
    CAMPAIGN ||--o{ ACTIVITY_LOGS : triggers
    CAMPAIGN ||--o| CHARITY : verified_by
    CAMPAIGN ||--o| CATEGORY : classified_as
    
    DONATIONS ||--o| FUNDING_REQUESTS : funds
    
    CHARITY ||--o{ CAMPAIGN : organizes
    
    USERS {
        ObjectId _id
        string email
        string firstName
        string lastName
        boolean verified
        object identityVerification
    }
    
    CAMPAIGN {
        ObjectId _id
        ObjectId organizerId
        ObjectId charityId
        ObjectId categoryId
        string campaignTitle
        number amountExpected
        number amountRaised
        number availableBalance
        boolean launched
        object disputeGovernance
    }
    
    FUNDING_REQUESTS {
        ObjectId _id
        ObjectId campaignId
        ObjectId organizerId
        number amount
        string purposeOfFunding
        string status
        object vendorDisbursement
        object disbursement
    }
    
    DONATIONS {
        ObjectId _id
        ObjectId campaignId
        ObjectId donorId
        ObjectId fundingRequestId
        string donorEmail
        number amount
        string paymentMethod
        string transactionId
        object refund
    }
    
    SUBSCRIPTIONS {
        ObjectId _id
        ObjectId campaignId
        ObjectId subscriberId
        string subscriberEmail
        number amount
        string stripeSubscriptionId
    }
    
    REPORTS {
        ObjectId _id
        ObjectId campaignId
        ObjectId userId
        string evidence
        string message
    }
    
    SUPPORT {
        ObjectId _id
        ObjectId campaignId
        string email
        string message
        array responses
    }
    
    CHARITIES {
        ObjectId _id
        ObjectId userId
        string charityName
        string registrationNumber
    }
    
    ACTIVITY_LOGS {
        ObjectId _id
        ObjectId userId
        ObjectId campaignId
        string type
    }
```
