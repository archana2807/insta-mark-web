// Cloudinary helpers (no external SDK). Pure module — no Next.js or "@/"
// imports and no `server-only` marker, so scripts can import it with a relative
// path. node:crypto keeps it out of browser bundles.

import { createHash } from "node:crypto";
import { getEnv } from "../../config/env.js";

export function isCloudinaryConfigured() {
  const e = getEnv();
  return Boolean(e.CLOUDINARY_CLOUD_NAME && e.CLOUDINARY_API_KEY && e.CLOUDINARY_API_SECRET);
}

/** Cloudinary signature: sha1 of sorted "k=v&k=v" params + API secret. */
export function signParams(params, apiSecret = getEnv().CLOUDINARY_API_SECRET) {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== "")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex");
}

export const ALLOWED_FORMATS = "jpg,jpeg,png,webp,avif";

/**
 * Parameters the browser needs for a signed direct upload into `folder`.
 * `allowed_formats` is part of the signature, so Cloudinary itself rejects
 * non-image files even if the browser check is bypassed.
 */
export function createUploadParams(folder) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { allowed_formats: ALLOWED_FORMATS, folder, timestamp };
  return {
    cloudName: getEnv().CLOUDINARY_CLOUD_NAME,
    apiKey: getEnv().CLOUDINARY_API_KEY,
    ...params,
    signature: signParams(params),
  };
}

/**
 * Verifies an upload response really came from Cloudinary for our account:
 * response.signature = sha1("public_id=…&version=…" + API secret).
 */
export function verifyUploadResponse({ public_id, version, signature }) {
  if (!public_id || !version || !signature) return false;
  return signParams({ public_id, version }) === signature;
}

/** Best-effort delete of an asset from Cloudinary. */
export async function destroyAsset(publicId) {
  if (!isCloudinaryConfigured()) return false;
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { public_id: publicId, timestamp };
  const body = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    api_key: getEnv().CLOUDINARY_API_KEY,
    signature: signParams(params),
  });
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${getEnv().CLOUDINARY_CLOUD_NAME}/image/destroy`,
    { method: "POST", body },
  );
  return res.ok;
}
