// The home banner: site_settings key "home.banner" = { desktopAssetId, mobileAssetId, alt }.
import "server-only";
import { Prisma } from "@prisma/client";
import { getPrisma } from "@/server/db";

const KEY = "home.banner";

/** @returns {Promise<{ desktopAssetId?: string | null, mobileAssetId?: string | null, alt?: string | null } | null>} */
export async function find() {
  const prisma = await getPrisma();
  const row = await prisma.siteSetting.findUnique({ where: { key: KEY } });
  return row?.value && typeof row.value === "object" ? row.value : null;
}

/** @param {{ desktopAssetId: string | null, mobileAssetId: string | null, alt: string | null } | null} value */
export async function save(value) {
  const prisma = await getPrisma();
  const json = value ?? Prisma.JsonNull;
  await prisma.siteSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: json },
    update: { value: json },
  });
}
