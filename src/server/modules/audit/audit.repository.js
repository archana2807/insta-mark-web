// audit_logs queries.
import "server-only";
import { getPrisma } from "@/server/db";

/**
 * @param {{ actorId: string | null, action: string, entity: string, entityId: string | null, changes?: object }} data
 */
export async function create(data) {
  const prisma = await getPrisma();
  return prisma.auditLog.create({ data });
}

/**
 * One page of the log, newest first, with the total count.
 * @param {{ skip: number, take: number }} page
 */
export async function findPage({ skip, take }) {
  const prisma = await getPrisma();
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { actor: { select: { name: true } } },
    }),
    prisma.auditLog.count(),
  ]);
  return { rows, total };
}

/**
 * @param {Date} before
 * @returns {Promise<number>} rows deleted
 */
export async function removeOlderThan(before) {
  const prisma = await getPrisma();
  const { count } = await prisma.auditLog.deleteMany({ where: { createdAt: { lt: before } } });
  return count;
}
