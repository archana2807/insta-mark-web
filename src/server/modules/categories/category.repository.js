// categories + category_images queries.
import "server-only";
import { getPrisma } from "@/server/db";

const assetSelect = { url: true, width: true, height: true, alt: true };

const publicSelect = {
  slug: true,
  name: true,
  group: true,
  icon: true,
  shortDescription: true,
  overview: true,
  features: true,
  applications: true,
  seoTitle: true,
  seoDescription: true,
};

/** Active categories for the public site, in display order. */
export async function findActive() {
  const prisma = await getPrisma();
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: publicSelect,
  });
}

/**
 * Every category gallery image in ONE query (instead of one per category): static
 * generation renders many pages in parallel, and per-category queries exhausted the pool.
 */
export async function findAllImages() {
  const prisma = await getPrisma();
  return prisma.categoryImage.findMany({
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    select: { type: true, category: { select: { slug: true } }, asset: { select: assetSelect } },
  });
}

/** Admin list with photo and enquiry counts. */
export async function findAllWithCounts() {
  const prisma = await getPrisma();
  return prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { images: true, enquiries: true } } },
  });
}

/** @param {string} id category with its gallery, for the admin edit page */
export async function findByIdWithImages(id) {
  const prisma = await getPrisma();
  return prisma.category.findUnique({
    where: { id },
    include: {
      images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: { asset: true } },
    },
  });
}

/** @param {string} id */
export async function findById(id) {
  const prisma = await getPrisma();
  return prisma.category.findUnique({ where: { id } });
}

/** @param {string} slug */
export async function findIdBySlug(slug) {
  const prisma = await getPrisma();
  return prisma.category.findUnique({ where: { slug }, select: { id: true } });
}

/** @param {string} id */
export async function findSlugById(id) {
  const prisma = await getPrisma();
  return prisma.category.findUnique({ where: { id }, select: { slug: true } });
}

/** @param {{ id?: boolean, slug?: boolean }} pick which key to return with the name */
export async function findOptions(pick) {
  const prisma = await getPrisma();
  return prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { ...pick, name: true },
  });
}

/** Every category as { id, name } (dashboard labels, unordered). */
export async function findNames() {
  const prisma = await getPrisma();
  return prisma.category.findMany({ select: { id: true, name: true } });
}

/**
 * @param {string} id
 * @param {object} data
 */
export async function update(id, data) {
  const prisma = await getPrisma();
  return prisma.category.update({ where: { id }, data });
}

// ── Gallery (category_images), driven by media.service ───────────────

/** @param {string} id */
export async function findGalleryOwner(id) {
  const prisma = await getPrisma();
  const c = await prisma.category.findUnique({
    where: { id },
    select: { id: true, slug: true, heroImageId: true },
  });
  return c && { id: c.id, slug: c.slug, coverId: c.heroImageId };
}

/** @param {string} imageId */
export async function findGalleryImage(imageId) {
  const prisma = await getPrisma();
  const img = await prisma.categoryImage.findUnique({
    where: { id: imageId },
    include: { asset: true, category: { select: { id: true, slug: true, heroImageId: true } } },
  });
  return (
    img && {
      id: img.id,
      assetId: img.assetId,
      asset: img.asset,
      ownerId: img.categoryId,
      owner: { id: img.category.id, slug: img.category.slug, coverId: img.category.heroImageId },
    }
  );
}

/** @param {string} ownerId */
export async function findLastGallerySortOrder(ownerId) {
  const prisma = await getPrisma();
  const last = await prisma.categoryImage.findFirst({
    where: { categoryId: ownerId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return last?.sortOrder ?? -1;
}

/** @param {{ ownerId: string, assetId: string, sortOrder: number, type: "CATALOGUE" | "EXECUTED" }} img */
export async function createGalleryImage({ ownerId, assetId, sortOrder, type }) {
  const prisma = await getPrisma();
  return prisma.categoryImage.create({
    data: { categoryId: ownerId, assetId, sortOrder, type },
  });
}

/**
 * @param {string} imageId
 * @param {"CATALOGUE" | "EXECUTED"} type
 */
export async function updateGalleryImageType(imageId, type) {
  const prisma = await getPrisma();
  return prisma.categoryImage.update({ where: { id: imageId }, data: { type } });
}

/**
 * @param {string} ownerId
 * @param {string | null} assetId
 */
export async function setCover(ownerId, assetId) {
  const prisma = await getPrisma();
  return prisma.category.update({ where: { id: ownerId }, data: { heroImageId: assetId } });
}

/** @param {string} ownerId image ids in display order */
export async function findGalleryImageIds(ownerId) {
  const prisma = await getPrisma();
  return prisma.categoryImage.findMany({
    where: { categoryId: ownerId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
}

/** @param {string[]} ids renumber sortOrder 0..n in this order */
export async function reorderGallery(ids) {
  const prisma = await getPrisma();
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.categoryImage.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );
}

/**
 * Removes an image; if it was the cover, the next image becomes the cover.
 * @param {{ id: string, assetId: string, ownerId: string, owner: { coverId: string | null } }} img
 */
export async function removeGalleryImage(img) {
  const prisma = await getPrisma();
  await prisma.$transaction(async (tx) => {
    await tx.categoryImage.delete({ where: { id: img.id } });
    if (img.owner.coverId === img.assetId) {
      const next = await tx.categoryImage.findFirst({
        where: { categoryId: img.ownerId },
        orderBy: { sortOrder: "asc" },
        select: { assetId: true },
      });
      await tx.category.update({
        where: { id: img.ownerId },
        data: { heroImageId: next?.assetId ?? null },
      });
    }
  });
}
