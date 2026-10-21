// Task 06 "Done when": one error catalog, safe messages only, Zod-validated env.
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ERRORS, errorMessage, resultMessage } from "../../src/shared/errors.js";
import { parseEnv } from "../../src/server/config/env.js";

const { AppError, attempt, toErrorResult } = await import("../../src/server/errors/app-error.js");
const ROOT = new URL("../..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

test("catalog holds every code from 2-ARCHITECTURE §9 with its status and message", () => {
  const doc = readFileSync(join(ROOT, "docs/2-ARCHITECTURE.md"), "utf8");
  const section = doc.slice(doc.indexOf("## 9."), doc.indexOf("## 10."));
  const rows = [...section.matchAll(/^\| `([A-Z_]+)` \| (\d+) \| (.+?) \|$/gm)];
  assert.ok(rows.length >= 10);
  for (const [, code, status, message] of rows) {
    assert.ok(ERRORS[code], code);
    assert.equal(ERRORS[code].status, Number(status), code);
    assert.equal(ERRORS[code].message, message.trim(), code);
  }
});

test("every code thrown or returned in src is in the catalog", () => {
  const used = new Set();
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.jsx?$/.test(e.name)) {
        const src = readFileSync(p, "utf8");
        for (const m of src.matchAll(/new AppError\("([A-Z_]+)"|code: "([A-Z_]+)"/g))
          used.add(m[1] ?? m[2]);
      }
    }
  };
  walk(join(ROOT, "src"));
  assert.ok(used.size > 15);
  for (const code of used) assert.ok(ERRORS[code], `${code} is in src/shared/errors.js`);
});

test("unknown codes get the generic safe message; field texts win when given", () => {
  assert.equal(errorMessage("NOPE"), ERRORS.INTERNAL_ERROR.message);
  assert.equal(resultMessage({ code: "AUTH_LOCKED" }), ERRORS.AUTH_LOCKED.message);
  assert.equal(resultMessage({ code: "VALIDATION_FAILED", message: "Alt text…" }), "Alt text…");
});

test("AppError becomes { ok: false, code } (or a field error) for the user", () => {
  assert.deepEqual(toErrorResult(new AppError("FAQ_NOT_FOUND")), {
    ok: false,
    code: "FAQ_NOT_FOUND",
  });
  assert.deepEqual(toErrorResult(new AppError("USER_EMAIL_TAKEN", { field: "email" })), {
    ok: false,
    code: "USER_EMAIL_TAKEN",
    fieldErrors: { email: ["A user with this email already exists."] },
  });
  assert.throws(() => new AppError("MADE_UP_CODE"), /Unknown error code/);
});

test("an unexpected error is logged in full but the user only gets INTERNAL_ERROR", async () => {
  const logged = mock.method(console, "error", () => {});
  try {
    const secret = new Error("connect ECONNREFUSED db.internal:5432 password=hunter2");
    const result = await attempt(async () => {
      throw secret;
    });
    assert.deepEqual(result, { ok: false, code: "INTERNAL_ERROR" });
    assert.ok(!JSON.stringify(result).includes("hunter2"));
    assert.equal(logged.mock.callCount(), 1);
    assert.equal(logged.mock.calls[0].arguments[1], secret);
  } finally {
    logged.mock.restore();
  }
});

test("Next.js redirects pass through attempt() untouched", async () => {
  const { redirect } = await import("next/navigation");
  await assert.rejects(
    attempt(async () => redirect("/admin")),
    (err) => String(err.digest ?? err.message).includes("NEXT_REDIRECT"),
  );
});

// ── Env ───────────────────────────────────────────────────────────────

const SECRET = "x".repeat(32);
const PROD = {
  VERCEL_ENV: "production",
  NODE_ENV: "production",
  NEXT_PUBLIC_SITE_URL: "https://www.example.in",
  DATABASE_URL: "postgresql://u:p@db.example/neondb?sslmode=require",
  DIRECT_URL: "postgresql://u:p@db.example/neondb?sslmode=require",
  AUTH_SECRET: SECRET,
  CRON_SECRET: "cron-secret-value",
  IP_HASH_SALT: "salt",
};

test("env: nothing is required without a database (dev, previews on /content)", () => {
  const { errors, env } = parseEnv({ NODE_ENV: "production", VERCEL_ENV: "preview" });
  assert.deepEqual(errors, []);
  assert.equal(env.DATABASE_URL, undefined);
});

test("env: blank values count as not set", () => {
  const { errors, env } = parseEnv({ DATABASE_URL: "", AUTH_SECRET: "", RESEND_API_KEY: " " });
  assert.deepEqual(errors, []);
  assert.equal(env.RESEND_API_KEY, undefined);
});

test("env: with a database, AUTH_SECRET and IP_HASH_SALT are required", () => {
  const { errors } = parseEnv({ DATABASE_URL: PROD.DATABASE_URL });
  assert.deepEqual(errors, [
    "AUTH_SECRET is required when DATABASE_URL is set",
    "IP_HASH_SALT is required when DATABASE_URL is set",
  ]);
});

test("env: production needs the 3-INFRA §6 list; errors never show values", () => {
  assert.deepEqual(parseEnv(PROD).errors, []);
  const { errors } = parseEnv({ ...PROD, CRON_SECRET: "", DIRECT_URL: undefined });
  assert.deepEqual(errors, [
    "DIRECT_URL is required in production",
    "CRON_SECRET is required in production",
  ]);
  const bad = parseEnv({ ...PROD, AUTH_SECRET: "short-secret-value" }).errors.join(" ");
  assert.match(bad, /AUTH_SECRET must be at least 32 characters/);
  assert.ok(!bad.includes("short-secret-value"));
  assert.match(parseEnv({ DATABASE_URL: "mysql://x" }).errors.join(), /DATABASE_URL must be a/);
});

test("env: optional integrations stay optional; half-configured ones only warn", () => {
  const { errors, warnings } = parseEnv({ ...PROD, CLOUDINARY_CLOUD_NAME: "demo" });
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, [
    "Images (Cloudinary) is switched off: missing CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET",
  ]);
});
