#!/usr/bin/env node
// Minimal, dependency-free lint gate for the backend: parses every first-party
// .js file with `node --check` so a syntax error fails CI instead of crashing
// the server at boot. (The backend has no ESLint config yet.)
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SKIP = new Set(["node_modules", "coverage", ".nyc_output", ".git"]);
const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".js")) files.push(full);
  }
})(ROOT);

let failed = 0;
for (const file of files) {
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  } catch (err) {
    failed += 1;
    process.stderr.write(`\n✖ ${path.relative(ROOT, file)}\n${err.stderr}`);
  }
}
console.log(`syntax-check: ${files.length - failed}/${files.length} files OK`);
process.exit(failed ? 1 : 0);
