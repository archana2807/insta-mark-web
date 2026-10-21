// THE place server code reads environment variables (R-11.8). Validated with Zod.
// next.config.mjs calls getEnv() on build, dev and start, so a bad environment stops
// the app before it serves anything. Errors name the variables, never their values.
//
// No `server-only` marker: next.config.mjs (plain Node) and the Edge middleware import
// this file. It holds no values itself; it only reads process.env on the server.
import { z } from "zod";

// "" (blank in .env files and the sealed test env) means "not set".
const blank = (v) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optional = (schema) => z.preprocess(blank, schema.optional());

const postgresUrl = z
  .string()
  .regex(/^postgres(ql)?:\/\//, "must be a postgres:// or postgresql:// URL");

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  /** Set by Vercel: production | preview | development. */
  VERCEL_ENV: optional(z.enum(["production", "preview", "development"])),

  NEXT_PUBLIC_SITE_URL: optional(z.string().url()),

  DATABASE_URL: optional(postgresUrl),
  DIRECT_URL: optional(postgresUrl),

  AUTH_SECRET: optional(z.string().min(32, "must be at least 32 characters")),
  IP_HASH_SALT: optional(z.string()),
  CRON_SECRET: optional(z.string()),

  RESEND_API_KEY: optional(z.string()),
  ENQUIRY_FROM_EMAIL: optional(z.string()),
  ENQUIRY_NOTIFY_EMAILS: optional(z.string()),
  /** Tests only: the Resend SDK sends to this URL (a local mock) instead of api.resend.com. */
  RESEND_BASE_URL: optional(z.string().url()),

  NEXT_PUBLIC_TURNSTILE_SITE_KEY: optional(z.string()),
  TURNSTILE_SECRET_KEY: optional(z.string()),

  NEXT_PUBLIC_GA_ID: optional(z.string()),

  CLOUDINARY_CLOUD_NAME: optional(z.string()),
  CLOUDINARY_API_KEY: optional(z.string()),
  CLOUDINARY_API_SECRET: optional(z.string()),
});

/** @typedef {z.infer<typeof schema>} Env */

// 3-INFRA §6: what a production deployment must have.
const REQUIRED_IN_PRODUCTION = [
  "NEXT_PUBLIC_SITE_URL",
  "DATABASE_URL",
  "DIRECT_URL",
  "AUTH_SECRET",
  "CRON_SECRET",
  "IP_HASH_SALT",
];
// With a database the admin panel and the enquiry store are live.
const REQUIRED_WITH_DATABASE = ["AUTH_SECRET", "IP_HASH_SALT"];

// Optional integrations: all of the group, or none.
const INTEGRATIONS = {
  "Enquiry email (Resend)": ["RESEND_API_KEY", "ENQUIRY_NOTIFY_EMAILS"],
  "Spam check (Turnstile)": ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"],
  "Images (Cloudinary)": ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"],
};

/**
 * Validates raw variables. Pure: no logging, no process access.
 * @param {Record<string, string | undefined>} raw
 * @returns {{ env: Env, errors: string[], warnings: string[] }}
 */
export function parseEnv(raw) {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join(".")} ${i.message}`);
    return { env: /** @type {Env} */ ({}), errors, warnings: [] };
  }
  const env = result.data;
  const errors = [];
  const missing = (names, why) => {
    for (const name of names) if (!env[name]) errors.push(`${name} is required ${why}`);
  };
  if (env.VERCEL_ENV === "production") {
    missing(REQUIRED_IN_PRODUCTION, "in production");
    if (env.RESEND_BASE_URL) errors.push("RESEND_BASE_URL must not be set in production");
  } else if (env.DATABASE_URL) missing(REQUIRED_WITH_DATABASE, "when DATABASE_URL is set");

  const warnings = [];
  for (const [label, names] of Object.entries(INTEGRATIONS)) {
    const set = names.filter((n) => env[n]);
    if (set.length > 0 && set.length < names.length) {
      const gaps = names.filter((n) => !env[n]).join(", ");
      warnings.push(`${label} is switched off: missing ${gaps}`);
    }
  }
  return { env, errors, warnings };
}

let cachedEnv;

/**
 * The validated environment. Throws (refusing to start) when something required is
 * missing or invalid.
 * @returns {Env}
 */
export function getEnv() {
  if (cachedEnv) return cachedEnv;
  const { env, errors, warnings } = parseEnv(process.env);
  if (errors.length) {
    throw new Error(`Invalid environment:\n  - ${errors.join("\n  - ")}\nSee .env.example.`);
  }
  for (const w of warnings) console.warn(`[env] ${w}`);
  cachedEnv = env;
  return env;
}

/**
 * The database is optional: without it the site reads /content (Vercel previews, D14).
 * @returns {boolean}
 */
export function isDatabaseConfigured() {
  return Boolean(getEnv().DATABASE_URL);
}

/** @returns {boolean} */
export function isProduction() {
  return getEnv().NODE_ENV === "production";
}
