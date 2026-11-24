# Live evidence & in-app identity checks

Organisers prove two things with their phone camera:

1. **Who they are.** A photo of their ID (front, plus back unless it's a passport) and a short selfie video in which they say a one-time code and follow two on-screen instructions. Our team reviews it.
2. **What happened to the money.** Progress photos and videos, and receipts for payouts, captured live in the app.

Every capture is **sealed** the moment it reaches us. After that, neither the file nor its details (time, place, code, campaign) can be changed without detection, by the organiser or by us.

## What it proves and what it doesn't

The UI, docs and support must describe it this way and no stronger.

| Claim | How | Limits |
|---|---|---|
| Captured in the app, now | Camera-only screens (no gallery or file picker). The server issues a one-time code that is valid for 20 minutes. Identity videos must include the spoken code and random instructions. | A rooted phone or a virtual camera can feed fake frames. That's why a person reviews identity videos and checks that the code is spoken and the instructions were followed. Stripe Identity is offered as an automated alternative where configured. |
| When | `receivedAt` is **our** clock. The phone's clock is recorded too, and a gap of more than 10 minutes is flagged. | — |
| Where | Optional, phone-reported GPS. Donors see it rounded to about 1 km, and the review team sees the precise value. The country the upload came from (CDN header) is recorded. | GPS can be spoofed on a rooted phone. It's supporting evidence, not proof. |
| Not altered since | SHA-256 of the file, sealed record hash, hash chain, Ed25519 signature, and the daily public anchor (GitHub + Bitcoin via OpenTimestamps). | Proves integrity **after** arrival, not that the scene itself was real. |

## How sealing works

For each upload, the server:

1. Checks the session (signed-in owner, or the one-time capture token from the QR code), that the session hasn't expired, and the slot. It checks the **file type from its bytes** (JPEG/PNG/WebP/WebM/MP4) and the size (8 MB photos, 30 MB videos). If the browser's `X-Content-SHA256` doesn't match the bytes received, the upload is rejected.
2. Stores the file in GridFS (`evidenceMedia`). Identity files are encrypted with AES-256-GCM, using a key derived from `SECURITY_KEY`.
3. Builds the sealed fields: session, user, campaign/payout, slot, MIME type, size, **file SHA-256**, challenge code and instructions, issued and received times, device time and size, coarse location plus a salted commitment to the precise one, upload country, and flags.
4. Computes three values:
   - `recordHash = SHA-256("ft-evidence-record:v1:" + canonical(sealed))`
   - `hash = SHA-256("ft-evidence-chain:v1:" + seq + ":" + prevHash + ":" + recordHash)`
   - `signature = Ed25519(recordHash)`
5. Appends the record to the single global evidence chain. The chain head is a leaf in the daily ledger anchor (`campaignId: "evidence"`).

Records are append-only. The model rejects every update and delete except one: marking a file deleted under the retention policy. The hashes stay, so what existed remains provable. Public records (campaign evidence and receipts) are listed and verifiable by anyone. Identity records are private: the chain links are public, but the content is visible only to the owner and admins.

## Verifying

Three ways to check:
- **In the browser.** On a campaign's tracker, the "Verify it hasn't been changed" button downloads the file and recomputes the hashes. It verifies the signature with WebCrypto Ed25519 (current Chrome, Safari and Firefox).
- **From the command line:** `node FundandTraceBackend/scripts/verify-evidence.js --api https://api.fundandtrace.com --id <recordId>`.
- **History not rewritten:** `scripts/verify-anchor.js` re-walks the evidence chain against the published anchor.

## The identity flow

1. `/dashboard/verify-identity`. The organiser picks the issuing country and ID type, then captures the ID photo(s) and the selfie video. On a computer without a camera they scan a QR code and finish on their phone (`/capture/<id>#t=<token>`). The token sits in the URL fragment, so it never reaches a server log, and it only works for that session for 20 minutes.
2. Submitting sets `identityVerification.status = "pending"`, `method = "in_app"` and `submittedAt`.
3. `/admin/identity` shows the review queue. Each item has the files (fetched with the admin token, never cached), the code to listen for, the instructions shown, location and flags, and whether the seals are intact. **Approval needs all five checks plus the name exactly as on the ID**, and admins can't review their own submission. "Send back" requires a reason, which the organiser sees. Every admin view of an ID file is written to the admin activity log.
4. **Launch gate** (`REQUIRE_KYC_TO_LAUNCH`, default `submitted`). A campaign can launch once a live check has been submitted. Payouts to the organiser still need `verified`; payouts straight to a supplier don't. Use `verified` to require approval before launch, or `off` to disable the gate.

Stripe Identity remains available as an automated route when `STRIPESECRET` is set. Its "processing" webhook marks the check as submitted.

## Configuration

| Variable | Notes |
|---|---|
| `EVIDENCE_SIGNING_KEY` | **Required in production.** Capture is refused without it. Generate with `node scripts/generate-evidence-key.js`. Keep a backup, and keep old public keys if you rotate (each record names its `keyId`). |
| `ID_MEDIA_RETENTION_DAYS` | Deletes ID **files** this many days after the review decision. Sealed fingerprints remain. Unset means keep. **Set the period with counsel.** |
| `REQUIRE_KYC_TO_LAUNCH` | `submitted` (default) \| `verified` \| `off` |
| Ingress / proxy | Allow request bodies up to **31 MB** on `POST /api/evidence/sessions/*/media/*` (nginx `client_max_body_size`). |
| Database | Recommended: give the app's MongoDB user a custom role with **insert + find only** on `evidencerecords` (no update/remove). The model already refuses edits; this makes the database refuse them too. |
| CDN | Pass the visitor country header (`CF-IPCountry` on Cloudflare, `x-vercel-ip-country` on Vercel) through to the API. |

## Questions for counsel (add to LAUNCH_RUNBOOK §7)

- Selfie videos and ID photos used to confirm identity are **biometric/special-category data** under UK GDPR and Nigeria's NDPA 2023, and similar laws apply in Kenya and Ghana. We need:
  - a lawful basis and condition;
  - a DPIA;
  - consent wording on the verification screen;
  - a privacy notice update.
- How long must ID evidence be kept (AML record-keeping) versus deleted (data minimisation)? This sets `ID_MEDIA_RETENTION_DAYS`.
- Is storing identity data in our chosen MongoDB region acceptable for each country (data residency and cross-border transfer)?
- Wording of the public claims: "captured live", "sealed" and "verified identity".
