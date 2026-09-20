import { randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as unknown as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

const KEYLEN = 64;

/** Returns "saltHex:hashHex". The optional pepper is a server-side secret mixed into the hash. */
export async function hashSecret(secret: string, pepper = ""): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(`${pepper}:${secret}`, salt, KEYLEN);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifySecret(secret: string, stored: string, pepper = ""): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length === 0) return false;
  const actual = await scrypt(`${pepper}:${secret}`, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function randomPin(digits = 6): string {
  return String(randomInt(0, 10 ** digits)).padStart(digits, "0");
}

export function pinPepper(): string {
  const p = process.env.PIN_PEPPER;
  if (!p || p.length < 32) throw new Error("PIN_PEPPER must be set to a random string of 32+ characters");
  return p;
}
