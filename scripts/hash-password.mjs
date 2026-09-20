// Usage: npm run hash-password -- "your long passphrase"
// Prints a value to paste into ADMIN_PASSWORD_HASH.
import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Usage: npm run hash-password -- "a passphrase of at least 12 characters"');
  process.exit(1);
}

// Must match lib/crypto.ts (pepper is empty for the admin password).
const salt = randomBytes(16);
const hash = scryptSync(`:${password}`, salt, 64);
console.log(`${salt.toString("hex")}:${hash.toString("hex")}`);
