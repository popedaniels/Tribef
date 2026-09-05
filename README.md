# Fund&Trace — Trackable & Transparent Milestone Crowdfunding

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Typecheck](https://img.shields.io/badge/typescript-strict-blue)]()
[![Protocol Audit](https://img.shields.io/badge/compliance-100%25-success)]()
[![License](https://img.shields.io/badge/license-MIT-purple)]()

Fund&Trace is a crowdfunding platform that eliminates platform commissions and provides radical financial transparency through **software-governed milestone escrow**, **AES-256 encrypted payout routing**, and **real-time public audit tracking**.

---

## 📁 Repository Structure

```
tribef/
├── FundandTrace/              # Frontend Application (Next.js 11, React 17, Redux Toolkit, Tailwind CSS)
│   ├── src/pages/             # 70+ Page routes (Public, Dashboard, Admin, StartACampaign, Tracker)
│   ├── src/components/        # Atomic UI components, Escrow simulators, Modals, Canvas animations
│   ├── scripts/               # Static analysis and 15-point protocol validation tools
│   └── package.json           # Frontend dependency manifest & build scripts
│
├── FundandTraceBackend/       # Backend API Server (Node.js, Express, MongoDB/Mongoose, Stripe, Flutterwave)
│   ├── controller/            # Business logic (Campaigns, Funding Requests, KYC, Donations, Admin)
│   ├── routes/                # API Route definitions & middleware bindings
│   ├── models/                # Mongoose database schemas & indexes
│   ├── utility/               # AES-256 encryption, security headers, rate limiters, env validators
│   ├── services/              # Email dispatchers (OAuth2/Nodemailer) and activity loggers
│   ├── tests/                 # Mocha test suite
│   └── package.json           # Backend dependencies & test scripts
│
├── docs/                      # Technical Documentation & Operational Guides
│   ├── API_REFERENCE.md       # Comprehensive REST API contracts & Webhook specifications
│   ├── ARCHITECTURE.md        # System architecture, Escrow state machine & data flows
│   ├── LOCAL_DEVELOPMENT.md   # Step-by-step local development & Stripe CLI setup
│   ├── LAUNCH_RUNBOOK.md      # Production launch runbook, secret rotation & checklist
│   ├── anti-fraud/            # Advanced KYC & hardware telemetry specification
│   └── infrastructure/        # Kubernetes, Helm & CI/CD deployment guide
│
└── scripts/                   # Operational & Disaster Recovery Utilities
    ├── backup-mongo.sh        # Automated logical MongoDB backup with retention management
    ├── restore-mongo.sh       # Point-in-time disaster recovery restore script
    ├── purge-secrets.sh       # Git history rewriting & secret purging utility
    └── smoke-test.sh          # Staging & production health probe smoke test
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
* **Node.js** >= 18 (Node 22 fully supported with OpenSSL legacy flags)
* **npm** >= 8
* **Docker & Docker Compose** (for local MongoDB cluster)

### 1. Clone & Install Dependencies
```bash
# Install backend dependencies
cd FundandTraceBackend && npm install

# Install frontend dependencies
cd ../FundandTrace && npm install
```

### 2. Configure Environment Variables
```bash
# Backend
cp FundandTraceBackend/.env.example FundandTraceBackend/.env

# Frontend
cp FundandTrace/.env.example FundandTrace/.env
```

### 3. Start Local MongoDB & Services
```bash
cd FundandTraceBackend
docker-compose up -d
```
* **MongoDB**: `localhost:27017`
* **Mongo Express Web UI**: `http://localhost:8081` (Credentials: `root` / `fundandtrace`)

### 4. Launch Development Servers
In separate terminal tabs:

```bash
# Terminal 1: Backend API (Port 5000)
cd FundandTraceBackend
npm run dev

# Terminal 2: Frontend App (Port 3000)
cd FundandTrace
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 🛡️ Key Features & Architectural Highlights

* **Milestone Escrow Custody**: Contributed funds are held in platform custody and only disbursed following itemized milestone review and donor audit tracking.
* **Direct-to-Vendor Payouts**: Payouts can be routed directly to accredited institutions (hospitals, schools, NGOs, contractors) with AES-256 encrypted banking details.
* **Automated Dispute Circuit-Breaker**: If $\ge 3$ verified donors or $\ge 15\%$ of funding volume submits dispute reports, the escrow engine freezes all payouts automatically.
* **Stripe Identity (KYC)**: Biometric identity verification with government ID checks and selfie facial liveness matching.
* **Zero Platform Fees**: 100% of donor funding goes directly to verified causes.

---

## 🧪 Testing & Validation

```bash
# Run backend test suite (Mocha)
cd FundandTraceBackend && npm test

# Run backend environment configuration validator
cd FundandTraceBackend && npm run validate-env

# Run frontend TypeScript typecheck
cd FundandTrace && npm run typecheck

# Run frontend 15-point protocol, mobile & security validator
cd FundandTrace && npm run validate

# Run production build check
cd FundandTrace && npm run build
```

---

## 📚 Detailed Documentation Index

* [API Reference Guide](docs/API_REFERENCE.md)
* [System Architecture & Escrow State Machine](docs/ARCHITECTURE.md)
* [Local Development Guide](docs/LOCAL_DEVELOPMENT.md)
* [Production Launch Runbook](docs/LAUNCH_RUNBOOK.md)
* [Kubernetes & Helm Infrastructure Guide](docs/infrastructure/KUBERNETES_HELM_CICD_GUIDE.md)
* [Anti-Fraud & Mobile Telemetry Plan](docs/anti-fraud/ANTI_FRAUD_MOBILE_ESCROW_EXECUTION_PLAN.md)

---

## 📄 License
This project is licensed under the MIT License.
# Tribef
