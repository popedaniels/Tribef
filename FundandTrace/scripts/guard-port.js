#!/usr/bin/env node
/**
 * Guard against two Node servers sharing the same port / `.next` directory.
 *
 * Wired in as `predev`, `prestart`, and `prebuild` hooks. It fails fast
 * (exit 1) if the target port is already in use, which prevents the two
 * failure modes seen in development:
 *
 *   1. A second `npm run dev` corrupting the shared `.next/` directory and
 *      producing 404s/500s on `/_next/static/chunks/...`.
 *   2. `next build` replacing `.next/` underneath a running dev server, so the
 *      server serves production HTML (hashed chunk URLs) that 404.
 *
 * Override with FT_IGNORE_PORT_GUARD=1 if you know proceeding is safe.
 */

const net = require("net");
const { execFileSync } = require("child_process");

const MODE = process.env.FT_GUARD_MODE || "server"; // "server" | "build"
const PORT = Number(process.env.PORT || 3000);
const HOST = "127.0.0.1";

if (process.env.FT_IGNORE_PORT_GUARD === "1") {
  process.exit(0);
}

function portInUse() {
  return new Promise((resolve) => {
    const socket = net.connect({ port: PORT, host: HOST });
    socket.setTimeout(500);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(false));
  });
}

// Best effort: report the PID that owns the port so the message says what to kill.
function findPid() {
  try {
    const out = execFileSync("ss", ["-ltnp"], { encoding: "utf8", timeout: 2000 });
    for (const line of out.split("\n")) {
      if (line.includes(`:${PORT} `) || line.includes(`:${PORT}\t`)) {
        const match = line.match(/pid=(\d+)/);
        if (match) return match[1];
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
    const pid = out.trim().split("\n")[0];
    if (/^\d+$/.test(pid)) return pid;
  } catch (_) {
    /* ignore */
  }
  return null;
}

(async () => {
  const inUse = await portInUse();
  if (!inUse) process.exit(0);

  const pid = findPid();
  const who = pid ? ` (PID ${pid})` : "";
  const killHint = pid ? `kill ${pid}` : `lsof -i :${PORT}   # find the PID, then kill it`;
  const red = "\x1b[31m";
  const bold = "\x1b[1m";
  const reset = "\x1b[0m";

  if (MODE === "build") {
    console.error(
      `\n${red}${bold}A server is already running on http://localhost:${PORT}${who}.${reset}\n` +
        `Building while a server is running replaces the shared .next/ directory and\n` +
        `causes "404 on /_next/static/chunks/..." errors. Stop the server first:\n\n` +
        `  ${killHint}\n\n` +
        `(Set FT_IGNORE_PORT_GUARD=1 to override if you know this is safe.)\n`
    );
  } else {
    console.error(
      `\n${red}${bold}Port ${PORT} is already in use${who}.${reset}\n` +
        `Another server (likely a previous \`npm run dev\`) is still running. Running a\n` +
        `second one corrupts the shared .next/ directory and produces 404s/500s on\n` +
        `static chunks. Stop it first:\n\n` +
        `  ${killHint}\n\n` +
        `(Set FT_IGNORE_PORT_GUARD=1 to override if you know this is safe.)\n`
    );
  }
  process.exit(1);
})();
