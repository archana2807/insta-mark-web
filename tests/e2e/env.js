// Test environment: the ONLY place that decides which database and keys tests use.
//
// Why this exists: on 13 Oct 2026 test enquiries reached the live database.
// `next build` / `next start` load `.env.production.local` (live Neon URL + keys) for
// every variable that is not already set. Two layers stop that here:
//   1. sealTestEnv() sets every variable from .env.example itself (test value or "").
//      @next/env never overrides a variable that is already defined, even as "".
//   2. __NEXT_PROCESSED_ENV makes Next.js skip loading .env* files completely.
// assertTestDatabase() then refuses any database other than the local PGlite one.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("../..", import.meta.url));
export const TEST_DB_HOST = "127.0.0.1";
export const TEST_DB_PORT = 5433;
export const TEST_APP_PORT = 3100;
/** Local mock of the Resend API (tests/e2e/mail-mock.js); emails never leave the machine. */
export const TEST_MAIL_PORT = 3110;
export const TEST_RESEND_BASE_URL = `http://127.0.0.1:${TEST_MAIL_PORT}`;
export const TEST_DATABASE_URL = `postgresql://postgres:postgres@${TEST_DB_HOST}:${TEST_DB_PORT}/postgres?sslmode=disable&connection_limit=1&pgbouncer=true`;

/** Test-only values; everything else from .env.example is blank (integration off). */
const TEST_VALUES = {
  NEXT_PUBLIC_SITE_URL: `http://localhost:${TEST_APP_PORT}`,
  DATABASE_URL: TEST_DATABASE_URL,
  DIRECT_URL: TEST_DATABASE_URL,
  AUTH_SECRET: "e2e-test-secret-e2e-test-secret-e2e-test-secret",
  IP_HASH_SALT: "e2e-test-salt",
  CRON_SECRET: "e2e-test-cron-secret",
  // Email is "on", but the Resend SDK talks to the local mock, which only runs during
  // the client-changes spec. Elsewhere sending fails fast, as with no key at all.
  RESEND_API_KEY: "re_e2e_fake_key",
  ENQUIRY_FROM_EMAIL: "Insta Mark Website <website@test.local>",
  ENQUIRY_NOTIFY_EMAILS: "sales@test.local",
  RESEND_BASE_URL: TEST_RESEND_BASE_URL,
};

/**
 * Names of all variables listed in .env.example (commented-out ones too).
 * @param {string} [root] project root
 * @returns {string[]}
 */
export function readEnvExampleKeys(root = ROOT) {
  const text = readFileSync(`${root}/.env.example`, "utf8");
  const keys = text
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*#?\s*([A-Z][A-Z0-9_]*)=/)?.[1])
    .filter(Boolean);
  return [...new Set(keys)];
}

/**
 * Throws unless `url` is the local PGlite test database (127.0.0.1:5433).
 * @param {string | undefined} url
 * @returns {void}
 */
export function assertTestDatabase(url) {
  let parsed;
  try {
    parsed = new URL(url ?? "");
  } catch {
    throw new Error(`Refusing to run tests: DATABASE_URL is not a valid URL ("${url ?? ""}").`);
  }
  const isPostgres = parsed.protocol === "postgresql:" || parsed.protocol === "postgres:";
  if (!isPostgres || parsed.hostname !== TEST_DB_HOST || Number(parsed.port) !== TEST_DB_PORT) {
    throw new Error(
      `Refusing to run tests: DATABASE_URL must point to ${TEST_DB_HOST}:${TEST_DB_PORT} ` +
        `(local PGlite), not ${parsed.hostname}:${parsed.port || "default"}.`,
    );
  }
}

/**
 * Environment for every test child process (build, server, Prisma, seed).
 * @param {Record<string, string | undefined>} [base] usually process.env
 * @param {string[]} [keys] variables to seal, default: all keys in .env.example
 * @returns {Record<string, string | undefined>}
 */
export function sealTestEnv(base = process.env, keys = readEnvExampleKeys()) {
  const env = { ...base };
  for (const key of keys) env[key] = "";
  Object.assign(env, TEST_VALUES);
  env.__NEXT_PROCESSED_ENV = "true";
  env.NEXT_TELEMETRY_DISABLED = "1";
  assertTestDatabase(env.DATABASE_URL);
  assertTestDatabase(env.DIRECT_URL);
  if (env.RESEND_BASE_URL !== TEST_RESEND_BASE_URL) {
    throw new Error("Refusing to run tests: email must go to the local mock only.");
  }
  return env;
}
