// faqs queries.
import "server-only";
import { getPrisma } from "@/server/db";

/**
 * Active FAQs for one scope: a category slug, "home", or null (general).
 * @param {string | null | undefined} scope
 */
export async function findPublic(scope) {
  const prisma = await getPrisma();
  const where =
    scope === "home"
      ? { categoryId: null, showOnHome: true }
      : scope
        ? { category: { slug: scope } }
        : { categoryId: null };
  return prisma.faq.findMany({
    where: { isActive: true, ...where },
    orderBy: { sortOrder: "asc" },
    select: { question: true, answer: true },
  });
}

/** Every FAQ for the admin list. */
export async function findAllWithCategory() {
  const prisma = await getPrisma();
  return prisma.faq.findMany({
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    include: { category: { select: { name: true } } },
  });
}

/** @param {string} id */
export async function findById(id) {
  const prisma = await getPrisma();
  return prisma.faq.findUnique({ where: { id } });
}

/** @param {object} data */
export async function create(data) {
  const prisma = await getPrisma();
  return prisma.faq.create({ data });
}

/**
 * @param {string} id
 * @param {object} data
 */
export async function update(id, data) {
  const prisma = await getPrisma();
  return prisma.faq.update({ where: { id }, data });
}

/** @param {string} id */
export async function remove(id) {
  const prisma = await getPrisma();
  return prisma.faq.delete({ where: { id } });
}
