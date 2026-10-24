// Test database setup and small resets between spec files.
// Every function re-checks that it talks to the local PGlite database only.

import { PrismaClient } from "@prisma/client";
import { TEST_DATABASE_URL, assertTestDatabase } from "./env.js";
import { USERS } from "./fixtures.js";
import { runSync } from "./proc.js";

/**
 * Prisma client bound to the test database (never reads DATABASE_URL from the environment).
 * @returns {PrismaClient}
 */
export function testPrisma() {
  assertTestDatabase(TEST_DATABASE_URL);
  return new PrismaClient({ datasourceUrl: TEST_DATABASE_URL });
}

/**
 * Runs a command in the project root with the sealed env; throws on failure.
 * @param {string} cmd
 * @param {string[]} args
 * @param {Record<string, string | undefined>} env sealed env from sealTestEnv()
 * @returns {string} stdout
 */
function run(cmd, args, env) {
  assertTestDatabase(env.DATABASE_URL);
  const out = runSync(cmd, args, { env });
  if (out.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed:\n${out.stdout}\n${out.stderr}`);
  }
  return out.stdout;
}

/**
 * Migrates and seeds a fresh test database: content and 3 users.
 * @param {Record<string, string | undefined>} env sealed env
 * @returns {Promise<Record<string, number>>} row counts, for proof
 */
export async function setupDatabase(env) {
  run("npx", ["prisma", "migrate", "deploy"], env);
  run("node", ["prisma/seed.js"], env);
  for (const u of Object.values(USERS)) {
    run(
      "node",
      ["scripts/create-admin.js", "--email", u.email, "--name", u.name, "--role", u.role],
      { ...env, SEED_ADMIN_PASSWORD: u.password },
    );
  }

  const prisma = testPrisma();
  try {
    return {
      categories: await prisma.category.count(),
      categoryImages: await prisma.categoryImage.count(),
      industries: await prisma.industry.count(),
      faqs: await prisma.faq.count(),
      users: await prisma.adminUser.count(),
      enquiries: await prisma.enquiry.count(),
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Clears rate limits and unlocks test users, so one spec file cannot block the next.
 * @returns {Promise<void>}
 */
export async function resetLimits() {
  const prisma = testPrisma();
  try {
    await prisma.rateLimit.deleteMany({});
    await prisma.adminUser.updateMany({ data: { failedLoginCount: 0, lockedUntil: null } });
  } finally {
    await prisma.$disconnect();
  }
}
