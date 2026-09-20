#!/usr/bin/env node
// Standalone environment validator for the backend.
//
// Usage:
//   node scripts/validate-env.js        # uses .env in the backend directory
//   npm run validate-env
//
// Exits 0 when the configuration is valid (or only feature-scoped warnings),
// and 1 when a required variable is missing or weak.

const path = require("path");

// Load .env from the backend root (parent of the scripts/ directory).
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const { validate, NODE_ENV } = require("../utility/config");

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

const result = validate();

console.log(`\n[validate-env] NODE_ENV=${NODE_ENV}\n`);

if (result.missing.length) {
  console.log(`${RED}Missing required variables:${RESET}`);
  result.missing.forEach((key) => console.log(`  - ${key}`));
}

if (result.weak.length) {
  console.log(`${RED}Weak or invalid variables:${RESET}`);
  result.weak.forEach((key) => console.log(`  - ${key}`));
}

if (result.featureWarnings.length) {
  console.log(`${YELLOW}Feature-scoped secrets not set (needed only if that feature is enabled):${RESET}`);
  result.featureWarnings.forEach((key) => console.log(`  - ${key}`));
}

const hasHardProblems = result.missing.length > 0 || result.weak.length > 0;

if (hasHardProblems) {
  console.log(`\n${RED}Configuration is NOT production-ready.${RESET}\n`);
  process.exit(1);
}

console.log(`\n${GREEN}Configuration is valid.${RESET}\n`);
process.exit(0);
