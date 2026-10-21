// site_settings queries (key → JSON value).
import "server-only";
import { Prisma } from "@prisma/client";
import { getPrisma } from "@/server/db";

/** @returns {Promise<Record<string, unknown>>} every setting as { key: value } */
export async function findAllAsMap() {
  const prisma = await getPrisma();
  const rows = await prisma.siteSetting.findMany({ select: { key: true, value: true } });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/**
 * Upserts every key in one transaction (null → JSON null).
 * @param {Record<string, unknown>} values
 */
export async function upsertMany(values) {
  const prisma = await getPrisma();
  await prisma.$transaction(
    Object.entries(values).map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: value ?? Prisma.JsonNull },
        update: { value: value ?? Prisma.JsonNull },
      }),
    ),
  );
}
