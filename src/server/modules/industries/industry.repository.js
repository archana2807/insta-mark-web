// industries queries.
import "server-only";
import { getPrisma } from "@/server/db";

/** Active industries for the public site. */
export async function findActive() {
  const prisma = await getPrisma();
  return prisma.industry.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { name: true, icon: true },
  });
}

/** All industries as { id, name } for admin dropdowns. */
export async function findOptions() {
  const prisma = await getPrisma();
  return prisma.industry.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
}
