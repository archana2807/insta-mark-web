// media_assets queries.
import "server-only";
import { getPrisma } from "@/server/db";

/**
 * Creates the asset row for a Cloudinary upload, or returns the existing one.
 * @param {{ publicId: string, url: string, width: number, height: number, format: string, bytes: number, alt: string }} data
 */
export async function upsertByPublicId(data) {
  const prisma = await getPrisma();
  return prisma.mediaAsset.upsert({ where: { publicId: data.publicId }, create: data, update: {} });
}

/**
 * @param {string} id
 * @param {string} alt
 */
export async function updateAlt(id, alt) {
  const prisma = await getPrisma();
  return prisma.mediaAsset.update({ where: { id }, data: { alt } });
}

/** @param {string} id public id + how many galleries, covers and logos use it */
export async function findUsage(id) {
  const prisma = await getPrisma();
  return prisma.mediaAsset.findUnique({
    where: { id },
    select: {
      publicId: true,
      _count: {
        select: {
          categoryImages: true,
          // The Projects feature is removed but its tables are kept (24 Oct 2026); an asset
          // still used by an old project row must not be deleted.
          projectImages: true,
          categoryHeroes: true,
          projectCovers: true,
          clientLogos: true,
        },
      },
    },
  });
}

/** @param {string[]} ids */
export async function findByIds(ids) {
  const prisma = await getPrisma();
  return prisma.mediaAsset.findMany({
    where: { id: { in: ids } },
    select: { id: true, url: true, width: true, height: true, alt: true },
  });
}

/** @param {string} id */
export async function remove(id) {
  const prisma = await getPrisma();
  return prisma.mediaAsset.delete({ where: { id } });
}
