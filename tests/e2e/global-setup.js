import { assertTestDatabase } from "./env.js";
import { testPrisma } from "./db.js";

/**
 * Second guard (the first is in run.js): Playwright must only ever run against the
 * local PGlite database, even if someone runs `npx playwright test` directly.
 * @returns {Promise<void>}
 */
export default async function globalSetup() {
  if (process.env.__NEXT_PROCESSED_ENV !== "true") {
    throw new Error("Run end-to-end tests with `npm run test:e2e`, not `npx playwright test`.");
  }
  assertTestDatabase(process.env.DATABASE_URL);
  assertTestDatabase(process.env.DIRECT_URL);
  const prisma = testPrisma();
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    throw new Error(`Test database on 127.0.0.1:5433 is not answering: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}
