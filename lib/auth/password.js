// Password hashing with Node's built-in scrypt (OWASP-recommended KDF).
// Format: scrypt$<N>$<r>$<p>$<saltB64>$<hashB64>
// No external dependency; imported by server code and scripts/create-admin.js.

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

export const PASSWORD_MIN_LENGTH = 10;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password, stored) {
  const parts = String(stored ?? "").split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Used when the email does not exist, so failed logins take the same time
// whether or not the account exists (no user enumeration via timing).
let dummyHash;
export async function verifyAgainstDummy(password) {
  dummyHash ??= await hashPassword("dummy-password-for-timing");
  await verifyPassword(password, dummyHash);
  return false;
}
