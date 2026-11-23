#!/usr/bin/env node
// Independent check of a sealed live capture, using only public data.
//
//   node scripts/verify-evidence.js --api https://api.fundandtrace.com --id <recordId> [--file photo.jpg]
//
// Checks, without trusting our server's own "checks" field:
//   1. the file's SHA-256 equals the sealed fingerprint (downloads it, or uses --file)
//   2. recordHash recomputes from the sealed fields
//   3. the chain link hash recomputes, and the record sits in the public chain
//   4. the Ed25519 signature verifies against the published public key
// Exit 0 = all good, 1 = mismatch, 2 = could not check.
const crypto = require("crypto");
const fs = require("fs");
const ev = require("../services/evidence");

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, all) => (v.startsWith("--") ? [...acc, [v.slice(2), all[i + 1]]] : acc), []));
const API = (args.api || process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");

async function get(path, raw = false) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return raw ? Buffer.from(await res.arrayBuffer()) : (await res.json()).data;
}

(async () => {
  if (!args.id) throw new Error("--id is required");
  const { record: r, mediaUrl } = await get(`/api/evidence/records/${args.id}`);
  const problems = [];
  const sealed = { ...r, recordId: r.id };

  const file = args.file ? fs.readFileSync(args.file) : mediaUrl ? await get(mediaUrl, true) : null;
  if (!file) console.log("· file not available (deleted under retention) — checking the seal only");
  else if (ev.sha256(file) !== r.sha256) problems.push("file does not match its sealed fingerprint");

  if (ev.recordHashOf(sealed) !== r.recordHash) problems.push("sealed details do not match recordHash");
  if (ev.chainHashOf(r) !== r.hash) problems.push("chain link does not match its hash");

  const { links } = await get(`/api/evidence/chain?after=${r.seq - 1}&limit=1`);
  if (!links[0] || links[0].hash !== r.hash) problems.push(`record #${r.seq} is not in the public chain as shown`);

  const key = await get("/api/evidence/public-key");
  if (key.keyId !== r.keyId) problems.push(`signed with key ${r.keyId}, current key is ${key.keyId} (check the key archive)`);
  else if (!ev.verifySignature(r.recordHash, r.signature, crypto.createPublicKey(key.publicKeyPem))) problems.push("signature is invalid");

  if (problems.length) {
    console.error(`✗ ${problems.length} problem(s):\n  - ${problems.join("\n  - ")}`);
    process.exit(1);
  }
  console.log(`✓ Record #${r.seq} verified: ${r.slot} received ${r.receivedAt}, fingerprint ${r.sha256}`);
  console.log("  To confirm it hasn't been rewritten since, run scripts/verify-anchor.js — the evidence chain head is in each daily anchor.");
})().catch((err) => {
  console.error(`Could not verify: ${err.message}`);
  process.exit(2);
});
