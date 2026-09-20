#!/usr/bin/env node
/**
 * Guard against two Node servers sharing the same port.
 *
 * Wired in as `predev` and `prestart` hooks for the backend. Fails fast
 * (exit 1) if the target port is already in use, so a second `npm run dev`
 * or `npm start` cannot quietly bind a duplicate server.
 *
 * Override with FT_IGNORE_PORT_GUARD=1 if you know proceeding is safe.
 */

const net = require("net");
const { execFileSync } = require("child_process");

const PORT = Number(process.env.PORT || 5000);
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

  console.error(
    `\n${red}${bold}Port ${PORT} is already in use${who}.${reset}\n` +
      `Another backend server is already running. Stop it first:\n\n` +
      `  ${killHint}\n\n` +
      `(Set FT_IGNORE_PORT_GUARD=1 to override if you know this is safe.)\n`
  );
  process.exit(1);
})();
