// Fixed-window rate limiting stored in `rate_limits` (no Redis needed).
// Shared by the enquiry form and the admin login.

import { createHash } from "node:crypto";
import { headers } from "next/headers";

export function hashIp(ip) {
  if (!ip) return undefined;
  return createHash("sha256")
    .update(`${ip}:${process.env.IP_HASH_SALT ?? ""}`)
    .digest("hex");
}

/** Client IP + user agent from the incoming request headers. */
export async function requestMeta() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || null;
  return { ip, ipHash: hashIp(ip), userAgent: h.get("user-agent")?.slice(0, 255) };
}

/**
 * Counts a hit for `key` in the current window.
 * @returns {Promise<boolean>} true when the limit is exceeded
 */
export async function isRateLimited(prisma, key, { max, windowMs }) {
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  const row = await prisma.rateLimit.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, count: 1 },
    update: { count: { increment: 1 } },
  });
  return row.count > max;
}
