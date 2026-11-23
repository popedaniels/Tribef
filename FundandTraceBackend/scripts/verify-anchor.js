#!/usr/bin/env node
// Independent check of a published ledger anchor, using only public data.
//
//   node scripts/verify-anchor.js --api https://api.fundandtrace.com [--date 2026-11-21] [--message anchors/2026-11-21.txt]
//
// Verifies that:
//   1. digest == SHA-256(message), and the message states this root
//      (pass --message with the copy from the public anchors repo to make sure
//      the API is serving the same text that was published)
//   2. the Merkle root recomputes from the listed campaign heads
//   3. every campaign's ledger today still has, at that position, the head
//      hash committed on that date, and its chain still verifies
// Exit code 0 = all good, 1 = mismatch found, 2 = could not check.
const crypto = require("crypto");
const fs = require("fs");

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, all) => (v.startsWith("--") ? [...acc, [v.slice(2), all[i + 1]]] : acc), []));
const API = (args.api || process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const leafHash = (l) => sha256(`ft-leaf:v1:${l.campaignId}:${l.seq}:${l.head}`);
const nodeHash = (a, b) => sha256(`ft-node:v1:${a}${b}`);
const root = (hs) => {
  if (!hs.length) return "0".repeat(64);
  let lvl = hs;
  while (lvl.length > 1) {
    const next = [];
    for (let i = 0; i < lvl.length; i += 2) next.push(i + 1 < lvl.length ? nodeHash(lvl[i], lvl[i + 1]) : lvl[i]);
    lvl = next;
  }
  return lvl[0];
};
const canonical = (e) =>
  JSON.stringify([String(e.campaignId), Number(e.seq), String(e.type), (Math.round(Number(e.amount) * 100) / 100).toFixed(2), String(e.currency || "").toUpperCase(), String(e.refId), String(e.memo || ""), new Date(e.at).toISOString(), String(e.prevHash)]);

async function get(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return (await res.json()).data;
}

(async () => {
  const problems = [];
  const anchor = await get(`/api/ledger/anchors/${args.date || "latest"}`);
  console.log(`Anchor ${anchor.date}: ${anchor.leafCount} campaigns, root ${anchor.root.slice(0, 16)}…`);

  if (sha256(anchor.message) !== anchor.digest) problems.push("digest is not SHA-256 of the message");
  if (!anchor.message.includes(`root: ${anchor.root}`)) problems.push("message does not state this root");
  if (args.message && fs.readFileSync(args.message, "utf8") !== anchor.message) problems.push("API message differs from the published copy");

  const sorted = [...anchor.leaves].sort((a, b) => (a.campaignId < b.campaignId ? -1 : 1));
  if (root(sorted.map(leafHash)) !== anchor.root) problems.push("root does not recompute from the listed heads");

  for (const leaf of sorted) {
    if (leaf.campaignId === "evidence") {
      // Sealed live captures: one chain of links (seq, prevHash, recordHash, hash).
      let prev = "0".repeat(64);
      let after = 0;
      let found = null;
      let broken = false;
      while (!broken) {
        const { links, next } = await get(`/api/evidence/chain?after=${after}&limit=5000`);
        for (const l of links) {
          const expect = sha256(`ft-evidence-chain:v1:${l.seq}:${l.prevHash}:${l.recordHash}`);
          if (l.seq !== after + 1 || l.prevHash !== prev || expect !== l.hash) {
            problems.push(`evidence chain broken at record #${l.seq}`);
            broken = true;
            break;
          }
          if (l.seq === leaf.seq) found = l;
          prev = l.hash;
          after = l.seq;
        }
        if (!next) break;
      }
      if (!found || found.hash !== leaf.head) problems.push(`evidence record #${leaf.seq} changed since ${anchor.date}`);
      continue;
    }
    const { entries } = await get(`/api/ledger/${leaf.campaignId}?limit=100000`);
    let prev = "0".repeat(64);
    for (const [i, e] of entries.entries()) {
      if (e.seq !== i + 1 || e.prevHash !== prev || sha256(canonical(e)) !== e.hash) {
        problems.push(`campaign ${leaf.campaignId}: chain broken at entry #${e.seq}`);
        break;
      }
      prev = e.hash;
    }
    const then = entries.find((e) => e.seq === leaf.seq);
    if (!then || then.hash !== leaf.head) problems.push(`campaign ${leaf.campaignId}: entry #${leaf.seq} changed since ${anchor.date}`);
  }

  if (problems.length) {
    console.error(`✗ ${problems.length} problem(s):\n  - ${problems.join("\n  - ")}`);
    process.exit(1);
  }
  console.log(`✓ Anchor ${anchor.date} verified against ${sorted.length} live ledgers.`);
  console.log(`  To check the external timestamp: ots verify ${anchor.date}.txt.ots (GET /api/ledger/anchors/${anchor.date}?format=ots)`);
})().catch((err) => {
  console.error(`Could not verify: ${err.message}`);
  process.exit(2);
});
