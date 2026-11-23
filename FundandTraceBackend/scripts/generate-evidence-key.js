#!/usr/bin/env node
// Generates the Ed25519 key that signs sealed evidence (services/evidence.js).
// Put the printed value in EVIDENCE_SIGNING_KEY (a secret). Keep a backup:
// losing it doesn't invalidate past records (the public key is published with
// each record's keyId), but rotating needs the old public key kept on file.
const crypto = require("crypto");
const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519");
const pem = privateKey.export({ type: "pkcs8", format: "pem" });
const der = publicKey.export({ type: "spki", format: "der" });
console.log("EVIDENCE_SIGNING_KEY=" + Buffer.from(pem).toString("base64"));
console.log("# keyId: " + crypto.createHash("sha256").update(der).digest("hex").slice(0, 16));
console.log("# public key (safe to publish):\n" + publicKey.export({ type: "spki", format: "pem" }));
