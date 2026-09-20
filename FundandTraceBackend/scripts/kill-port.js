#!/usr/bin/env node
/**
 * Kill whatever process is listening on a port.
 *
 * Usage:
 *   node scripts/kill-port.js 5000
 *   npm run kill:5000
 *
 * Finds the listening PID (via ss, falling back to lsof), sends SIGTERM, and
 * verifies the port is actually freed. Exits 0 if nothing was listening.
 */

const { execFileSync } = require("child_process");

const PORT = Number(process.argv[2] || 5000);
if (!Number.isInteger(PORT) || PORT <= 0 || PORT > 65535) {
  console.error(`kill-port: invalid port "${process.argv[2]}"`);
  process.exit(2);
}

function findPid() {
  try {
    const out = execFileSync("ss", ["-ltnp"], { encoding: "utf8", timeout: 2000 });
    for (const line of out.split("\n")) {
      if (line.includes(`:${PORT} `) || line.includes(`:${PORT}\t`)) {
        const match = line.match(/pid=(\d+)/);
        if (match) return Number(match[1]);
      }
    }
  } catch (_) {
    /* ignore */
  }
  try {
    const out = execFileSync(
      "lsof",
      ["-i", `:${PORT}`, "-sTCP:LISTEN", "-t"],
      { encoding: "utf8", timeout: 2000 }
    );
    const pid = Number(out.trim().split("\n")[0]);
    if (Number.isInteger(pid) && pid > 0) return pid;
  } catch (_) {
    /* ignore */
  }
  return null;
}

const pid = findPid();
if (!pid) {
  console.log(`kill-port: nothing listening on :${PORT}`);
  process.exit(0);
}

console.log(`kill-port: sending SIGTERM to PID ${pid} (listening on :${PORT})`);
try {
  process.kill(pid, "SIGTERM");
} catch (err) {
  console.error(`kill-port: failed to signal PID ${pid}: ${err.message}`);
  process.exit(1);
}

setTimeout(() => {
  const still = findPid();
  if (still) {
    console.error(`kill-port: PID ${still} is still listening on :${PORT} — try 'kill -9 ${still}'`);
    process.exit(1);
  }
  console.log(`kill-port: :${PORT} is free`);
  process.exit(0);
}, 500);
