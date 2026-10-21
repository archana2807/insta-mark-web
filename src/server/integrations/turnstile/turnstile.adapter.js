// Cloudflare Turnstile server-side verification.
// Enabled only when TURNSTILE_SECRET_KEY is set.
//
// Policy: a token Cloudflare REJECTS blocks the submission. If Cloudflare is
// UNREACHABLE (network/outage), we retry once and then let the enquiry through
// with a warning — losing a real B2B lead costs more than one spam message,
// and honeypot + rate limiting still apply.
import "server-only";
import { logger } from "@/server/logger";
import { getEnv } from "@/server/config/env";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 5000;

export function isTurnstileEnabled() {
  return Boolean(getEnv().TURNSTILE_SECRET_KEY);
}

async function callSiteverify(body) {
  const res = await fetch(VERIFY_URL, {
    method: "POST",
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`siteverify HTTP ${res.status}`);
  return res.json();
}

/** @returns {Promise<"valid" | "invalid" | "unavailable">} */
export async function verifyTurnstile(token, remoteIp) {
  if (!token) return "invalid";
  const body = new URLSearchParams({ secret: getEnv().TURNSTILE_SECRET_KEY, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const data = await callSiteverify(body);
      if (data.success === true) return "valid";
      logger.warn({ codes: data["error-codes"] }, "turnstile token rejected");
      return "invalid";
    } catch (err) {
      logger.error(
        { attempt, reason: err?.cause?.code ?? err.message },
        "turnstile siteverify unreachable",
      );
    }
  }
  return "unavailable";
}
