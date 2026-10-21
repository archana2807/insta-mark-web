// Admin access token: ONE jose JWT (HS256, AUTH_SECRET), valid 8 hours (D3).
// Claims: sub (user id), role, tv (token version), iat, exp.
// Edge-safe (the middleware imports it), so no `server-only` marker.
import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import { getEnv } from "../config/env.js";
import { ACCESS_TOKEN_TTL } from "./cookies.js";

const ALG = "HS256";

/** @returns {boolean} whether AUTH_SECRET is long enough to sign tokens */
export function isAuthSecretConfigured() {
  return Boolean(getEnv().AUTH_SECRET); // env.js enforces 32+ characters
}

function secretKey() {
  if (!isAuthSecretConfigured()) {
    throw new Error("AUTH_SECRET must be set to at least 32 characters");
  }
  return new TextEncoder().encode(getEnv().AUTH_SECRET);
}

/**
 * @param {{ sub: string, role: string, tv: number }} claims
 * @returns {Promise<string>} signed JWT
 */
export async function signAccessToken({ sub, role, tv }) {
  return new SignJWT({ role, tv })
    .setProtectedHeader({ alg: ALG, typ: "JWT" })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL}s`)
    .sign(secretKey());
}

/**
 * Verifies signature, algorithm and expiry.
 * @param {string | undefined | null} token
 * @returns {Promise<{ sub: string, role: string, tv: number, iat: number, exp: number } | null>}
 */
export async function verifyAccessToken(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: [ALG] });
    if (typeof payload.sub !== "string" || typeof payload.tv !== "number") return null;
    return /** @type {never} */ (payload);
  } catch {
    return null; // bad signature, expired, malformed, or AUTH_SECRET missing
  }
}
