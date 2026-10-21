// client_logos queries.
import "server-only";
import { getPrisma } from "@/server/db";

/** Active logos for the public "Trusted by" strip. */
export async function findActive() {
  const prisma = await getPrisma();
  return prisma.clientLogo.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      name: true,
      websiteUrl: true,
      logo: { select: { url: true, width: true, height: true, alt: true } },
    },
  });
}

/** Every logo with its asset, for the admin page. */
export async function findAllWithLogo() {
  const prisma = await getPrisma();
  return prisma.clientLogo.findMany({ orderBy: { sortOrder: "asc" }, include: { logo: true } });
}

/** @param {string} id */
export async function findById(id) {
  const prisma = await getPrisma();
  return prisma.clientLogo.findUnique({ where: { id } });
}

/** @param {object} data */
export async function create(data) {
  const prisma = await getPrisma();
  return prisma.clientLogo.create({ data });
}

/**
 * @param {string} id
 * @param {object} data
 */
export async function update(id, data) {
  const prisma = await getPrisma();
  return prisma.clientLogo.update({ where: { id }, data });
}

/** @param {string} id */
export async function remove(id) {
  const prisma = await getPrisma();
  return prisma.clientLogo.delete({ where: { id } });
}
