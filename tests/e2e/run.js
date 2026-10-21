// One entry point for end-to-end tests:  npm run test:e2e  [-- --no-build] [-- --setup-only]
//
//   1. refuse to start if DATABASE_URL / DIRECT_URL point anywhere but 127.0.0.1:5433
//   2. seal the environment (see env.js) — no .env* file can add live values
//   3. start a fresh PGlite database, migrate, seed, add test users + fixture
//   4. build the app against it (skipped with --no-build)
//   5. run Playwright (it starts `next start` with the same sealed env)

import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";
import { ROOT, TEST_DB_PORT, assertTestDatabase, sealTestEnv } from "./env.js";
import { setupDatabase } from "./db.js";
import { runSync } from "./proc.js";

const args = new Set(process.argv.slice(2));

// 1. Guard: a database chosen by the caller must be the test one. Checked before anything runs.
for (const name of ["DATABASE_URL", "DIRECT_URL"]) {
  if (process.env[name]) {
    try {
      assertTestDatabase(process.env[name]);
    } catch (err) {
      console.error(`${name}: ${err.message}`);
      process.exit(2);
    }
  }
}

// 2. Sealed environment for every child process.
const env = sealTestEnv(process.env);

/**
 * Starts the PGlite server child process and waits until it is ready.
 * @returns {Promise<import("node:child_process").ChildProcess>}
 */
function startDatabase() {
  return new Promise((resolve, reject) => {
    const child = fork(fileURLToPath(new URL("./pglite-server.js", import.meta.url)), {
      cwd: ROOT,
      env,
      stdio: ["ignore", "pipe", "inherit", "ipc"],
    });
    const timer = setTimeout(() => reject(new Error("PGlite did not start within 30 s")), 30_000);
    child.stdout.on("data", (chunk) => {
      if (String(chunk).includes("pglite ready")) {
        clearTimeout(timer);
        resolve(child);
      }
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(
        new Error(`PGlite exited early (code ${code}). Is port ${TEST_DB_PORT} already in use?`),
      );
    });
  });
}

/**
 * Runs a command with the sealed env, streaming its output.
 * @param {string} cmd
 * @param {string[]} cmdArgs
 * @returns {number} exit status
 */
function runStep(cmd, cmdArgs) {
  return (
    runSync(cmd, cmdArgs, { env: { ...env, NODE_ENV: "production" }, inherit: true }).status ?? 1
  );
}

let db;
let status = 1;
try {
  console.log(`▶ Test database: fresh PGlite on 127.0.0.1:${TEST_DB_PORT}`);
  db = await startDatabase();
  const counts = await setupDatabase(env);
  console.log("▶ Seeded:", JSON.stringify(counts));

  if (args.has("--setup-only")) {
    status = 0;
  } else {
    if (!args.has("--no-build")) {
      console.log("▶ Building against the test database");
      status = runStep("npx", ["next", "build"]);
      if (status !== 0) throw new Error("next build failed");
    }
    console.log("▶ Running Playwright");
    status = runStep("npx", [
      "playwright",
      "test",
      ...[...args].filter((a) => !a.startsWith("--no-build")),
    ]);
  }
} catch (err) {
  console.error(`✖ ${err.message}`);
  status = status || 1;
} finally {
  if (db?.connected) db.send("stop");
  else db?.kill();
}
process.exit(status);
