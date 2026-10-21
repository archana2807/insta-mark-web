// Stateless signed session token (HMAC-SHA256 via Web Crypto), usable in both
// the Edge middleware and Node server code. No Next.js imports here, and no
// `server-only` marker, because the Edge middleware imports this file.
//
// token = base64url(JSON payload) + "." + base64url(HMAC(payload, AUTH_SECRET))
// payload = { uid, role, pwv, iat, exp }
//   pwv = fingerprint of the password hash → changing the password
//         invalidates every existing session for that user.

export const SESSION_COOKIE = "im_admin_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60; // one working day

const enc = new TextEncoder();

function b64url(bytes) {
  let bin = "";
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to at least 32 characters");
  }
  return secret;
}

async function hmacKey() {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function passwordFingerprint(passwordHash) {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(passwordHash));
  return b64url(digest).slice(0, 16);
}

export async function signSession({ uid, role, pwv }) {
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(
    enc.encode(JSON.stringify({ uid, role, pwv, iat: now, exp: now + SESSION_TTL_SECONDS })),
  );
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(), enc.encode(payload));
  return `${payload}.${b64url(sig)}`;
}

/** @returns {Promise<null | {uid:string, role:string, pwv:string, iat:number, exp:number}>} */
export async function verifySession(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      fromB64url(sig),
      enc.encode(payload),
    );
    if (!ok) return null;
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}
