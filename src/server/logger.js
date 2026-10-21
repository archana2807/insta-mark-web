// THE server logger (D6): pino JSON lines on stdout, read by Vercel logs.
// Usage: logger.error({ err, enquiryId }, "enquiry notification email failed")
// Secrets and visitors' personal data are redacted before anything is written.
import "server-only";
import pino from "pino";
import { getEnv } from "@/server/config/env";

/** Keys never written to logs, at the top level and one level down. */
const SENSITIVE = [
  "password",
  "passwordHash",
  "token",
  "secret",
  "authorization",
  "cookie",
  "email",
  "phone",
  "ipHash",
];
// Not "name" / "message": they would also hide err.name / err.message. Enquiry text is
// never logged; log ids instead.

/** @type {string[]} */
export const REDACT_PATHS = [
  ...SENSITIVE,
  ...SENSITIVE.map((k) => `*.${k}`),
  "headers.cookie",
  "headers.authorization",
];

/**
 * Removes credentials from text: "postgres://user:pw@host" → "postgres://[redacted]@host",
 * "password=…" / "secret=…" / "token=…" → "…=[redacted]".
 * @param {string | undefined} text
 * @returns {string | undefined}
 */
export function scrubSecrets(text) {
  return text
    ?.replace(/([a-z][a-z0-9+.-]*:\/\/)[^\s/@:]+:[^\s/@]+@/gi, "$1[redacted]@")
    .replace(/(password|secret|token|api_key)=[^\s&;]+/gi, "$1=[redacted]");
}

/** Error serializer with credentials scrubbed from message and stack. */
function serializeError(err) {
  const out = pino.stdSerializers.err(err);
  if (out && typeof out === "object") {
    out.message = scrubSecrets(out.message);
    out.stack = scrubSecrets(out.stack);
  }
  return out;
}

/**
 * @param {import("pino").DestinationStream} [destination] tests pass their own stream
 * @returns {import("pino").Logger}
 */
export function createLogger(destination) {
  const env = getEnv();
  return pino(
    {
      level: env.LOG_LEVEL ?? "info",
      base: { service: "insta-mark-web", env: env.VERCEL_ENV ?? env.NODE_ENV },
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: { level: (label) => ({ level: label }) },
      redact: { paths: REDACT_PATHS, censor: "[redacted]" },
      serializers: { err: serializeError },
    },
    destination,
  );
}

export const logger = createLogger();
