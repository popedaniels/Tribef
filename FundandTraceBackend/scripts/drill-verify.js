#!/usr/bin/env node
// Verifies a restored database for the backup-restore drill
// (scripts/backup-restore-drill.sh). With --counts it only prints collection
// counts as JSON (used on the source before the dump).
//
// Checks: every collection present with the expected count (when --expect is
// given), ledger hash chains, sealed-evidence chain, campaign balances vs the
// ledger (services/integrity.js), and that indexes were restored.
process.env.NODE_ENV = process.env.NODE_ENV || "production";
const fs = require("fs");
const mongoose = require("mongoose");

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
};

async function counts(db) {
  const out = {};
  for (const c of await db.listCollections({}, { nameOnly: true }).toArray()) {
    if (c.name.startsWith("system.")) continue;
    out[c.name] = await db.collection(c.name).estimatedDocumentCount();
  }
  return out;
}

(async () => {
  await mongoose.connect(process.env.MONGOURL, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  const now = await counts(db);
  if (process.argv.includes("--counts")) {
    process.stdout.write(JSON.stringify(now));
    await mongoose.disconnect();
    return;
  }

  const checks = [];
  const add = (ok, name, detail = "") => checks.push({ ok, name, detail });

  const expectFile = arg("--expect");
  if (expectFile) {
    const expected = JSON.parse(fs.readFileSync(expectFile, "utf8"));
    const missing = Object.keys(expected).filter((k) => !(k in now));
    const differ = Object.keys(expected).filter((k) => k in now && now[k] < expected[k]);
    add(!missing.length && !differ.length, "Every collection restored with at least the source's document count", missing.length || differ.length ? `missing: ${missing.join(", ") || "none"}; short: ${differ.map((k) => `${k} ${now[k]}/${expected[k]}`).join(", ") || "none"}` : `${Object.keys(expected).length} collections`);
  } else {
    add(Object.keys(now).length > 0, "Collections restored", `${Object.keys(now).length} collections`);
  }

  // Indexes: the unique ones protect against double-crediting.
  const ledgerIdx = await db.collection("ledgerentries").indexes().catch(() => []);
  add(ledgerIdx.some((i) => i.unique && i.key.campaignId === 1 && i.key.refId === 1), "Ledger unique index restored");

  // Integrity (ledger chains, evidence chain, balances) — reuse the nightly job.
  require("../models/campaignModel");
  const { runIntegrityCheck } = require("../services/integrity");
  const report = await runIntegrityCheck({ alert: false });
  const critical = (report.findings || []).filter((f) => f.severity === "critical");
  // An empty restore "passes" an integrity check trivially, so require that
  // the ledgers were actually there to check.
  const expectedLedger = expectFile ? JSON.parse(fs.readFileSync(expectFile, "utf8")).ledgerentries || 0 : now.ledgerentries || 0;
  add(!expectedLedger || report.summary?.ledgersChecked > 0, "Ledgers were present and checked", `${report.summary?.ledgersChecked ?? 0} campaign ledgers`);
  add(critical.length === 0, "Ledger and evidence hash chains intact; balances match the ledger", critical.length ? critical.map((f) => `${f.code}${f.campaignId ? ` (${f.campaignId})` : ""}`).join(", ") : `${report.findings?.length || 0} non-critical findings`);

  const taken = arg("--backup-taken");
  const takenAt = taken ? new Date(taken.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, "$1-$2-$3T$4:$5:$6Z")) : null;
  const rpoHours = takenAt && !Number.isNaN(+takenAt) ? Math.round(((Date.now() - takenAt) / 36e5) * 10) / 10 : null;
  if (rpoHours !== null) add(rpoHours <= Number(process.env.DRILL_MAX_BACKUP_AGE_HOURS || 26), "Backup is recent enough (RPO)", `${rpoHours} h old`);

  const ok = checks.every((c) => c.ok);
  const lines = [
    `# Backup-restore drill — ${ok ? "PASSED" : "FAILED"}`,
    "",
    `- Date: ${new Date().toISOString()}`,
    `- Restore time: ${arg("--restore-seconds") || "?"} s (whole drill ${arg("--total-seconds") || "?"} s)`,
    `- Backup taken: ${takenAt ? takenAt.toISOString() : "unknown"}`,
    "",
    "| Check | Result | Detail |",
    "|---|---|---|",
    ...checks.map((c) => `| ${c.name} | ${c.ok ? "✅ pass" : "❌ FAIL"} | ${c.detail} |`),
    "",
    "## Collections",
    "",
    ...Object.entries(now).map(([k, v]) => `- ${k}: ${v}`),
  ];
  const out = arg("--report");
  if (out) fs.writeFileSync(out, lines.join("\n") + "\n");
  console.log(lines.slice(0, 7 + checks.length + 2).join("\n"));
  await mongoose.disconnect();
  process.exit(ok ? 0 : 1);
})().catch(async (err) => {
  console.error("drill-verify failed:", err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
