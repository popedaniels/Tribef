# Fund&Trace — Frontend Application

Next.js 15 Progressive Web Application (PWA) with React 18, Redux Toolkit, Styled Components, Sass, and Tailwind CSS.

---

## 🚀 Key Technologies & Stack

* **Framework**: Next.js 15 (Pages router, custom Node server)
* **UI & Component Architecture**: React 18, Styled Components, Tailwind CSS, Sass
* **State Management**: Redux Toolkit & Redux Persist
* **Payment Integrations**: `@stripe/stripe-js`, `@stripe/react-stripe-js`, `flutterwave-react-v3`
* **Visual Effects**: Three.js (interactive WebGL canvas), Framer Motion, Recharts
* **Progressive Web App**: `next-pwa` with service worker fallback

---

## 🛠️ Scripts & Tooling

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the custom development server on `http://localhost:3000` with Node 22 OpenSSL legacy provider compatibility. |
| `npm run build` | Compiles optimized production bundles across all 70+ static, server-rendered, and dynamic routes. |
| `npm run start` | Boots the verified production server (`NODE_ENV=production node server.js`). |
| `npm run typecheck` | Runs strict TypeScript type evaluation (`tsc --noEmit`) with zero emit. |
| `npm run validate` | Runs the automated 15-point protocol, mobile ergonomics, and cybersecurity static analyzer. |

---

## 🌐 Route Structure Overview

### 1. Public Discovery & Campaigns
* `/` — Modern hero showcase, live verified disbursal stream, 4-step traceability engine, comparison matrix, and escrow workflow simulator.
* `/Categories` & `/category/[name]` — Cause-filtered search and category indexes (Medical, Emergency, Education, NGO, Memorial).
* `/search` — Real-time keyword, category, and geolocation campaign search.
* `/campaign/[id]` — Main public campaign page with story, video, updates, donor list, and real-time raised metrics.
* `/campaign/[id]/tracker` — **Public Audit Tracker**: Displays milestone funding requests, approved disbursements, attached receipts, and verified donor dispute submission modals.
* `/donate/[id]` & `/donated/[id]` — Stripe Elements & Flutterwave payment flows and post-donation success receipts.

### 2. Campaign Creation & Onboarding
* `/StartACampaign/type` — Select between Individual, Charity, or Medical project.
* `/StartACampaign/BasicInformation` — Title, category, goal, location, and cover image.
* `/StartACampaign/Content` — Rich-text story, milestone budget breakdown, and video URL.
* `/StartACampaign/Team` — Primary and secondary contact profiles with government ID uploads.
* `/StartACampaign/Funding` — Bank routing, sort code, account number, and currency.
* `/StartACampaign/Prelaunch` — Stripe Identity KYC verification gate before publication.

### 3. User & Organizer Dashboard
* `/dashboard` — Organizer overview of active campaigns, total funds raised, and live status.
* `/dashboard/[id]` — Campaign manager: edit details, view donor whitelist, post milestone updates.
* `/dashboard/[id]/fundingRequest` — Submit milestone funding requests with expense justification, direct-to-vendor options, and invoice attachments.
* `/dashboard/my-contributions` — Donor history and downloadable tax/contribution receipts.
* `/dashboard/account` & `/dashboard/edit-profile` — User preferences and notification settings.

### 4. Administrative Control Center
* `/admin` — High-level platform statistics (total campaigns, total raised, pending approvals).
* `/admin/campaigns` & `/admin/campaign/[id]` — Review and approve/decline new campaigns.
* `/admin/fundingRequests` & `/admin/fundingRequest/[id]` — Audit milestone requests, inspect AES-256 decrypted bank credentials, and trigger disbursements.
* `/admin/refunds` — Issue full or partial refunds directly to donors via Stripe.
* `/admin/users` & `/admin/users/[id]` — Manage users, review KYC status, and perform admin verification overrides.
* `/admin/helpdesk` — Support tickets and platform inquiries.

---

## ⚙️ Environment Variables

Create `.env` based on `.env.example`:

```ini
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
PORT=3000
```

> **Note on Node 22+**: Next.js 15 uses Webpack 5 cryptographic hashers that require OpenSSL 3 legacy provider flags. All `package.json` scripts automatically include `NODE_OPTIONS=--openssl-legacy-provider`.
