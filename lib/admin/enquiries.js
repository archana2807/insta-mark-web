// Enquiry queries shared by the admin list page and the CSV export.

import { getPrisma } from "@/lib/db";

export const ENQUIRY_STATUSES = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST", "SPAM"];
export const PAGE_SIZE = 25;

/** Builds a Prisma `where` from URL search params. */
export function enquiryWhere({ status, category, q } = {}) {
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

export async function listEnquiries(params = {}) {
  const prisma = await getPrisma();
  const page = Math.max(1, Number.parseInt(params.page, 10) || 1);
  const where = enquiryWhere(params);
  const [total, rows] = await Promise.all([
    prisma.enquiry.count({ where }),
    prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        category: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
    }),
  ]);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** CSV cell: quoted, and neutralised against spreadsheet formula injection. */
export function csvCell(value) {
  let s = value == null ? "" : value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
