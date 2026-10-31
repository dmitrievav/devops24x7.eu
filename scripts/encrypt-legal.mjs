// Encrypts private/legal.json (gitignored) into assets/legal.json for the public repo.
// The key is published next to the ciphertext on purpose: the Impressum must be
// readable by every visitor (§ 5 DDG). The goal is only to keep the address and
// e-mail out of plain text in the repository (GitHub search, scrapers of raw files).
// Format must match assets/legal.js: AES-256-GCM, ct = ciphertext || 16-byte tag.
//
// Usage: node scripts/encrypt-legal.mjs
import { createCipheriv, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const plain = readFileSync("private/legal.json");
JSON.parse(plain); // fail early on invalid JSON

const key = randomBytes(32);
const iv = randomBytes(12);
const cipher = createCipheriv("aes-256-gcm", key, iv);
const ct = Buffer.concat([cipher.update(plain), cipher.final(), cipher.getAuthTag()]);

const out = {
  key: key.toString("base64"),
  iv: iv.toString("base64"),
  ct: ct.toString("base64"),
};
writeFileSync("assets/legal.json", JSON.stringify(out, null, 1) + "\n");
console.log("wrote assets/legal.json");
