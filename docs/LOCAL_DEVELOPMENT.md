# Fund&Trace — Local Development & Testing Guide

This guide walks through configuring a complete local development environment with MongoDB, Next.js frontend, Express backend, and Stripe CLI webhook listeners.

---

## 📋 Prerequisites

* **Node.js**: v18, v20, or v22 (Node 22 is tested and fully compatible)
* **npm**: v8 or higher
* **Docker & Docker Compose**: For local MongoDB and Mongo Express
* **Stripe CLI** (Optional, for live webhook forwarding): [Install Stripe CLI](https://stripe.com/docs/stripe-cli)

---

## 🚀 Setup Steps

### 1. Start Local MongoDB Container
In the backend directory, run:

```bash
cd FundandTraceBackend
docker-compose up -d
```

Verify containers are running:
* **MongoDB**: `localhost:27017`
* **Mongo Express Dashboard**: Visit `http://localhost:8081` (Username: `root`, Password: `fundandtrace`)

### 2. Configure Environment Files

```bash
# Backend (.env)
cp FundandTraceBackend/.env.example FundandTraceBackend/.env

# Frontend (.env)
cp FundandTrace/.env.example FundandTrace/.env
```

Ensure `MONGOURL=mongodb://localhost:27017/fundandtrace` in `FundandTraceBackend/.env`.

### 3. Run Validation Checks
Before booting the servers, verify the backend configuration:

```bash
cd FundandTraceBackend
npm run validate-env
```

### 4. Start the Application Servers

Open two terminal sessions:

#### Terminal 1 (Backend API):
```bash
cd FundandTraceBackend
npm run dev
```
*(Server listens on `http://localhost:5000`)*

#### Terminal 2 (Frontend Web App):
```bash
cd FundandTrace
npm run dev
```
*(Server listens on `http://localhost:3000` with automated port collision guard)*

---

## 💳 Testing Stripe Webhooks Locally

To test Stripe Checkout, Identity KYC, or Payouts with local webhook events:

1. Log into your Stripe account using the Stripe CLI:
   ```bash
   stripe login
   ```

2. Forward Stripe webhooks to your local backend:
   ```bash
   stripe listen --forward-to localhost:5000/api/donations/stripe-webhook
   ```

3. Copy the signing secret printed in your terminal (`whsec_...`) and update `STRIPE_WEBHOOK_SECRET` in `FundandTraceBackend/.env`.

4. Trigger test events:
   ```bash
   stripe trigger checkout.session.completed
   ```

---

## 🧪 Running Test Suites

```bash
# Backend Mocha & Chai unit and integration tests
cd FundandTraceBackend
npm test

# Frontend TypeScript strict check
cd FundandTrace
npm run typecheck

# Frontend 15-point protocol, mobile & cybersecurity validator
cd FundandTrace
npm run validate
```
