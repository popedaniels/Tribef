#!/usr/bin/env node
/**
 * Cryptographic Secret & Key Generator for Fund&Trace
 * Generates secure, high-entropy secrets for JWTs, AES-256 encryption, and internal webhooks.
 *
 * Usage:
 *   node scripts/generate-secrets.js
 *   node scripts/generate-secrets.js --env-backend > FundandTraceBackend/.env.local
 */

const crypto = require('crypto');

function generateSecrets() {
  const tokenSecret = crypto.randomBytes(64).toString('hex');
  const resetTokenSecret = crypto.randomBytes(64).toString('hex');
  const securityKey = crypto.randomBytes(32).toString('hex'); // 32 bytes = 64 hex chars for AES-256
  const initVector = crypto.randomBytes(16).toString('hex');  // 16 bytes = 32 hex chars for AES-CBC
  const internalWebhookSecret = crypto.randomBytes(32).toString('hex');

  return {
    TOKEN_SECRET: tokenSecret,
    RESET_TOKEN_SECRET: resetTokenSecret,
    SECURITY_KEY: securityKey,
    INIT_VECTOR: initVector,
    INTERNAL_WEBHOOK_SECRET: internalWebhookSecret,
  };
}

if (require.main === module) {
  const secrets = generateSecrets();
  const flag = process.argv[2];

  if (flag === '--json') {
    console.log(JSON.stringify(secrets, null, 2));
  } else if (flag === '--env-backend') {
    console.log(`# Generated Fund&Trace Production / Staging Secrets`);
    console.log(`TOKEN_SECRET=${secrets.TOKEN_SECRET}`);
    console.log(`RESET_TOKEN_SECRET=${secrets.RESET_TOKEN_SECRET}`);
    console.log(`SECURITY_KEY=${secrets.SECURITY_KEY}`);
    console.log(`INIT_VECTOR=${secrets.INIT_VECTOR}`);
    console.log(`INTERNAL_WEBHOOK_SECRET=${secrets.INTERNAL_WEBHOOK_SECRET}`);
  } else {
    console.log('\n======================================================');
    console.log('   FUND&TRACE CRYPTOGRAPHIC SECRET GENERATOR          ');
    console.log('======================================================\n');
    console.log('Use these high-entropy values for .env or your secret manager:\n');
    console.log(`TOKEN_SECRET (64 bytes hex, 128 chars):`);
    console.log(`  ${secrets.TOKEN_SECRET}\n`);
    console.log(`RESET_TOKEN_SECRET (64 bytes hex, 128 chars):`);
    console.log(`  ${secrets.RESET_TOKEN_SECRET}\n`);
    console.log(`SECURITY_KEY (AES-256 32 bytes hex, 64 chars):`);
    console.log(`  ${secrets.SECURITY_KEY}\n`);
    console.log(`INIT_VECTOR (AES IV 16 bytes hex, 32 chars):`);
    console.log(`  ${secrets.INIT_VECTOR}\n`);
    console.log(`INTERNAL_WEBHOOK_SECRET (32 bytes hex, 64 chars):`);
    console.log(`  ${secrets.INTERNAL_WEBHOOK_SECRET}\n`);
    console.log('------------------------------------------------------');
    console.log('To output in dotenv format: node scripts/generate-secrets.js --env-backend\n');
  }
}

module.exports = { generateSecrets };
