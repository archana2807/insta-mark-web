// rate_limits queries (fixed windows, no Redis needed).
import "server-only";
import { getPrisma } from "@/server/db";

/**
 * Adds one hit to (key, windowStart).
 * @param {string} key
 * @param {Date} windowStart
 * @returns {Promise<number>} hits in this window
 */
export async function addHit(key, windowStart) {
  const prisma = await getPrisma();
  const row = await prisma.rateLimit.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, count: 1 },
    update: { count: { increment: 1 } },
  });
  return row.count;
}

/**
 * @param {Date} before
 * @returns {Promise<number>} rows deleted
 */
export async function removeOlderThan(before) {
  const prisma = await getPrisma();
  const { count } = await prisma.rateLimit.deleteMany({ where: { windowStart: { lt: before } } });
  return count;
}
