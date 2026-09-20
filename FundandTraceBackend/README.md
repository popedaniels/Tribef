# Fund&Trace — Backend API Server

High-performance Express.js REST API providing milestone escrow management, Stripe/Flutterwave payment processing, Stripe Identity KYC, AES-256 at-rest banking encryption, and donor governance.

---

## 🏛️ Architecture & Security Features

* **Express.js API**: Modular routing, controller architecture, and Joi payload validation.
* **Database & ODM**: MongoDB with Mongoose 5. Fail-fast query resilience configured via `mongoose.set("bufferCommands", false)`.
* **Security & Hardening**:
  * **AES-256-CBC Encryption**: Banking data, payout account numbers, and sort codes are encrypted at rest using `utility/encryption.js`.
  * **Multi-Tier Rate Limiting**: Dedicated rate limits for authentication (`50 req / 15 min`) and public APIs (`300 req / 15 min`).
  * **NoSQL Injection Sanitization**: Strips `$` and `.` operator keys from all `POST`, `PUT`, and `PATCH` payloads.
  * **HTTP Security Headers**: Enforces HSTS (`max-age=31536000`), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, and custom CSP.
  * **Strict CORS Whitelisting**: Restricts API calls strictly to approved web origins with credentials support.
* **Environment Fail-Fast**: Calls `assertValidConfig()` at startup in production to immediately halt execution if any core secret is missing, weak, or using placeholder tokens.

---

## 🛠️ Scripts & Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Boots the API server with `nodemon` auto-reloading on `http://localhost:5000`. |
| `npm start` | Starts production API server with configuration assertion. |
| `npm test` | Runs the Mocha & Chai test suite across campaigns, users, charities, and funding requests. |
| `npm run validate-env` | Standalone validator that checks `.env` variables against production security rules. |

---

## 🔑 Environment Configuration

Create a `.env` file in the backend root based on `.env.example`:

```ini
# Core Configuration
PORT=5000
NODE_ENV=development
MAINURL=http://localhost:3000
BACKENDURL=http://localhost:5000
MONGOURL=mongodb://localhost:27017/fundandtrace

# Auth & Crypto Keys (Generate with `openssl rand -hex 64` / `32`)
TOKEN_SECRET=your_jwt_secret_at_least_32_characters_long
RESET_TOKEN_SECRET=your_reset_secret_at_least_32_characters_long
SECURITY_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef # 32 bytes hex (64 chars)
INIT_VECTOR=0123456789abcdef0123456789abcdef # 16 bytes hex (32 chars)
INTERNAL_WEBHOOK_SECRET=your_internal_webhook_secret_32_chars

# Stripe Integration
STRIPEPUBLIC=pk_test_...
STRIPESECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_IDENTITY_WEBHOOK_SECRET=whsec_...

# Flutterwave Integration
FLUTTERWAVE=FLWSECK_TEST-...
FLUTTERWAVE_PUBLIC=FLWPUBK_TEST-...

# Email Sending (Gmail OAuth2)
EMAIL=your-email@gmail.com
OAUTH_CLIENTID=your_client_id.apps.googleusercontent.com
OAUTH_CLIENT_SECRET=your_oauth_secret
OAUTH_REFRESH_TOKEN=your_refresh_token
```

---

## 📡 Observability & Health Probes

The backend exposes dedicated endpoints for container orchestration (Kubernetes / Docker) and uptime monitoring:

* `GET /live` — Returns `200 OK` (checks process liveness).
* `GET /ready` — Returns `200 OK` if MongoDB is connected (`readyState === 1`), otherwise `503 Service Unavailable`.
* `GET /health` or `GET /api/health` — Returns comprehensive status payload:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-08-21T14:00:00.000Z",
    "uptime": 3600.5,
    "services": {
      "database": "connected"
    }
  }
  ```

---

## 🧪 Testing

Run all unit and integration tests:

```bash
npm test
```

Tests run with in-memory fallback handling so tests execute reliably without requiring an active external database connection.
