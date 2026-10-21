import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import {
  assertTestDatabase,
  readEnvExampleKeys,
  sealTestEnv,
  TEST_DATABASE_URL,
} from "../e2e/env.js";

const require = createRequire(import.meta.url);

test("guard accepts only the local PGlite database on 127.0.0.1:5433", () => {
  assert.doesNotThrow(() => assertTestDatabase(TEST_DATABASE_URL));
  for (const url of [
    "postgresql://user:pw@ep-live-pooler.ap-southeast-1.aws.neon.tech:5432/neondb",
    "postgresql://postgres:postgres@127.0.0.1:5432/postgres",
    "postgresql://postgres:postgres@localhost:5433/postgres",
    "mysql://root@127.0.0.1:5433/db",
    "",
    undefined,
    "not a url",
  ]) {
    assert.throws(() => assertTestDatabase(url), /Refusing to run tests/, `should refuse ${url}`);
  }
});

test("sealed env blanks every .env.example key and points the database at PGlite", () => {
  const live = { DATABASE_URL: "postgresql://x@live.neon.tech/db", RESEND_API_KEY: "re_live" };
  const env = sealTestEnv(live);
  assert.equal(env.DATABASE_URL, TEST_DATABASE_URL);
  assert.equal(env.DIRECT_URL, TEST_DATABASE_URL);
  assert.equal(env.RESEND_API_KEY, "");
  assert.equal(env.__NEXT_PROCESSED_ENV, "true");
  for (const key of readEnvExampleKeys()) {
    assert.ok(key in env, `${key} must be set (even as "") so env files cannot fill it`);
  }
});

test("a live .env.production.local cannot leak into a sealed test process", () => {
  const dir = mkdtempSync(join(tmpdir(), "im-envtest-"));
  try {
    writeFileSync(
      join(dir, ".env.production.local"),
      [
        "DATABASE_URL=postgresql://user:pw@live.neon.tech:5432/neondb",
        "RESEND_API_KEY=re_live_key",
        "VERCEL_TOKEN=live_token",
      ].join("\n"),
    );
    const nextEnv = require.resolve("@next/env");
    const probe = `
      const { loadEnvConfig } = require(${JSON.stringify(nextEnv)});
      loadEnvConfig(${JSON.stringify(dir)}, false);
      process.stdout.write(JSON.stringify({
        DATABASE_URL: process.env.DATABASE_URL,
        RESEND_API_KEY: process.env.RESEND_API_KEY,
        VERCEL_TOKEN: process.env.VERCEL_TOKEN ?? null,
      }));`;
    // Layer 1 + 2 together (what the runner does) and layer 1 alone (flag removed).
    for (const withFlag of [true, false]) {
      const env = { ...sealTestEnv(), NODE_ENV: "production" };
      if (!withFlag) delete env.__NEXT_PROCESSED_ENV;
      const out = spawnSync(process.execPath, ["-e", probe], { env, encoding: "utf8" });
      assert.equal(out.status, 0, out.stderr);
      const seen = JSON.parse(out.stdout);
      assert.equal(seen.DATABASE_URL, TEST_DATABASE_URL, `withFlag=${withFlag}`);
      assert.equal(seen.RESEND_API_KEY, "", `withFlag=${withFlag}`);
      if (withFlag) assert.equal(seen.VERCEL_TOKEN, null, "flag must stop all file loading");
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
