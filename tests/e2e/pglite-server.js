// Fresh in-memory PostgreSQL (PGlite) for one test run, on 127.0.0.1:5433 only.
// Started as a child process by tests/e2e/run.js so a crash cannot hang the runner.

import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { TEST_DB_HOST, TEST_DB_PORT } from "./env.js";

const db = await PGlite.create();
const server = new PGLiteSocketServer({
  db,
  host: TEST_DB_HOST,
  port: TEST_DB_PORT,
  maxConnections: 4,
});
await server.start();
process.stdout.write(`pglite ready on ${TEST_DB_HOST}:${TEST_DB_PORT}\n`);

const shutdown = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("message", (msg) => {
  if (msg === "stop") shutdown();
});
