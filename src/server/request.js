// Facts about the incoming request (client IP hash, user agent).
import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getEnv } from "@/server/config/env";

/**
 * @param {string | null | undefined} ip
 * @returns {string | undefined} salted SHA-256 of the IP
 */
export function hashIp(ip) {
  if (!ip) return undefined;
  return createHash("sha256")
    .update(`${ip}:${getEnv().IP_HASH_SALT ?? ""}`)
    .digest("hex");
}

/**
 * Client IP + user agent from the incoming request headers.
 * @returns {Promise<{ ip: string | null, ipHash: string | undefined, userAgent: string | undefined }>}
 */
export async function requestMeta() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || null;
  return { ip, ipHash: hashIp(ip), userAgent: h.get("user-agent")?.slice(0, 255) };
}
