// admin_users queries.
import "server-only";
import { getPrisma } from "@/server/db";

/** @param {string} email */
export async function findByEmail(email) {
  const prisma = await getPrisma();
  return prisma.adminUser.findUnique({ where: { email } });
}

/** @param {string} id */
export async function findById(id) {
  const prisma = await getPrisma();
  return prisma.adminUser.findUnique({ where: { id } });
}

/** @param {string} id the fields a session check needs */
export async function findForSession(id) {
  const prisma = await getPrisma();
  return prisma.adminUser.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lockedUntil: true,
      tokenVersion: true,
    },
  });
}

/** Users page list: active first, then by name. */
export async function findAllForAdmin() {
  const prisma = await getPrisma();
  return prisma.adminUser.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      lockedUntil: true,
    },
  });
}

/** Active users as { id, name } (enquiry owner dropdown). */
export async function findActiveOptions() {
  const prisma = await getPrisma();
  return prisma.adminUser.findMany({ where: { isActive: true }, select: { id: true, name: true } });
}

/** @returns {Promise<number>} */
export async function countActiveAdmins() {
  const prisma = await getPrisma();
  return prisma.adminUser.count({ where: { role: "ADMIN", isActive: true } });
}

/** @param {object} data */
export async function create(data) {
  const prisma = await getPrisma();
  return prisma.adminUser.create({ data });
}

/**
 * @param {string} id
 * @param {object} data
 */
export async function update(id, data) {
  const prisma = await getPrisma();
  return prisma.adminUser.update({ where: { id }, data });
}
