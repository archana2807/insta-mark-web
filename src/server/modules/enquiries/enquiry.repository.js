// enquiries + enquiry_notes queries.
import "server-only";
import { ENQUIRY_STATUSES } from "@/shared/constants";
import { getPrisma } from "@/server/db";

const listInclude = {
  category: { select: { name: true } },
  assignedTo: { select: { name: true } },
};

/**
 * Prisma `where` from the admin list filters (URL search params).
 * @param {{ status?: string, category?: string, q?: string }} [filters]
 */
export function buildWhere({ status, category, q } = {}) {
  const where = {};
  if (ENQUIRY_STATUSES.includes(status)) where.status = status;
  else where.status = { not: "SPAM" }; // spam hidden unless explicitly filtered
  if (category) where.category = { slug: category };
  const term = typeof q === "string" ? q.trim().slice(0, 100) : "";
  if (term) {
    where.OR = ["name", "email", "company", "phone", "projectLocation"].map((f) => ({
      [f]: { contains: term, mode: "insensitive" },
    }));
  }
  return where;
}

/** @param {object} data */
export async function create(data) {
  const prisma = await getPrisma();
  return prisma.enquiry.create({ data });
}

/** @param {string} id */
export async function markNotified(id) {
  const prisma = await getPrisma();
  return prisma.enquiry.update({ where: { id }, data: { notifiedAt: new Date() } });
}

/**
 * One page of the filtered list, newest first, with the total.
 * @param {object} filters
 * @param {{ skip: number, take: number }} page
 */
export async function findPage(filters, { skip, take }) {
  const prisma = await getPrisma();
  const where = buildWhere(filters);
  const [total, rows] = await Promise.all([
    prisma.enquiry.count({ where }),
    prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: listInclude,
    }),
  ]);
  return { total, rows };
}

/**
 * Filtered rows for the CSV export.
 * @param {object} filters
 * @param {number} take
 */
export async function findForExport(filters, take) {
  const prisma = await getPrisma();
  return prisma.enquiry.findMany({
    where: buildWhere(filters),
    orderBy: { createdAt: "desc" },
    take,
    include: listInclude,
  });
}

/** @param {string} id enquiry with category and notes, for the detail page */
export async function findDetail(id) {
  const prisma = await getPrisma();
  return prisma.enquiry.findUnique({
    where: { id },
    include: {
      category: { select: { name: true, slug: true } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
    },
  });
}

/** @param {string} id */
export async function findFollowUp(id) {
  const prisma = await getPrisma();
  return prisma.enquiry.findUnique({
    where: { id },
    select: { status: true, assignedToId: true },
  });
}

/**
 * @param {string} id
 * @param {object} data
 */
export async function update(id, data) {
  const prisma = await getPrisma();
  return prisma.enquiry.update({ where: { id }, data });
}

/** @param {{ enquiryId: string, body: string, authorId: string }} data */
export async function createNote(data) {
  const prisma = await getPrisma();
  return prisma.enquiryNote.create({ data });
}

/**
 * Dashboard numbers in parallel.
 * @param {{ weekAgo: Date, monthAgo: Date }} since
 */
export async function findDashboardStats({ weekAgo, monthAgo }) {
  const prisma = await getPrisma();
  const [byStatus, thisWeek, thisMonth, recent, byCategory, unnotified] = await Promise.all([
    prisma.enquiry.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.enquiry.count({ where: { createdAt: { gte: weekAgo }, status: { not: "SPAM" } } }),
    prisma.enquiry.count({ where: { createdAt: { gte: monthAgo }, status: { not: "SPAM" } } }),
    prisma.enquiry.findMany({
      where: { status: { not: "SPAM" } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { category: { select: { name: true } } },
    }),
    prisma.enquiry.groupBy({
      by: ["categoryId"],
      where: { createdAt: { gte: monthAgo }, status: { not: "SPAM" } },
      _count: { _all: true },
      orderBy: { _count: { categoryId: "desc" } },
    }),
    prisma.enquiry.count({ where: { notifiedAt: null, status: { not: "SPAM" } } }),
  ]);
  return { byStatus, thisWeek, thisMonth, recent, byCategory, unnotified };
}

/**
 * Leads whose notification email failed, created between the two dates.
 * @param {{ after: Date, before: Date, take: number }} range
 */
export async function findUnnotified({ after, before, take }) {
  const prisma = await getPrisma();
  return prisma.enquiry.findMany({
    where: {
      notifiedAt: null,
      status: { not: "SPAM" },
      createdAt: { lt: before, gt: after },
    },
    orderBy: { createdAt: "asc" },
    take,
  });
}

/**
 * @param {Date} before
 * @returns {Promise<number>} spam rows deleted
 */
export async function removeSpamOlderThan(before) {
  const prisma = await getPrisma();
  const { count } = await prisma.enquiry.deleteMany({
    where: { status: "SPAM", createdAt: { lt: before } },
  });
  return count;
}

/**
 * @param {Date} before
 * @param {number} take
 */
export async function findIdsToAnonymise(before, take) {
  const prisma = await getPrisma();
  return prisma.enquiry.findMany({
    where: { createdAt: { lt: before }, NOT: { name: "Anonymised" } },
    select: { id: true },
    take,
  });
}

/** @param {string} id keeps category, status, dates and UTM for reporting */
export async function anonymise(id) {
  const prisma = await getPrisma();
  return prisma.enquiry.update({
    where: { id },
    data: {
      name: "Anonymised",
      company: null,
      email: `anonymised+${id}@invalid.local`,
      phone: "",
      projectLocation: null,
      message: null,
      ipHash: null,
      userAgent: null,
    },
  });
}
