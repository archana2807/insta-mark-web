// projects, project_images and project_categories queries.
import "server-only";
import { getPrisma } from "@/server/db";

const assetSelect = { url: true, width: true, height: true, alt: true };

const listSelect = {
  slug: true,
  title: true,
  clientName: true,
  city: true,
  year: true,
  isFeatured: true,
  coverImage: { select: assetSelect },
  images: { orderBy: { sortOrder: "asc" }, take: 1, select: { asset: { select: assetSelect } } },
  categories: { select: { category: { select: { slug: true, name: true } } } },
};

/** Active projects for the public site. */
export async function findActive() {
  const prisma = await getPrisma();
  return prisma.project.findMany({
    where: { isActive: true },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    select: listSelect,
  });
}

/** @param {string} slug one active project with its full gallery */
export async function findActiveBySlug(slug) {
  const prisma = await getPrisma();
  return prisma.project.findFirst({
    where: { slug, isActive: true },
    select: {
      ...listSelect,
      description: true,
      industry: { select: { name: true } },
      images: { orderBy: { sortOrder: "asc" }, select: { asset: { select: assetSelect } } },
    },
  });
}

/** Admin list with cover, photo count and categories. */
export async function findAllForAdmin() {
  const prisma = await getPrisma();
  return prisma.project.findMany({
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      coverImage: { select: { url: true } },
      _count: { select: { images: true } },
      categories: { select: { category: { select: { name: true } } } },
    },
  });
}

/** @param {string} id project with category ids and gallery, for the admin edit page */
export async function findByIdForEdit(id) {
  const prisma = await getPrisma();
  return prisma.project.findUnique({
    where: { id },
    include: {
      categories: { select: { categoryId: true } },
      images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: { asset: true } },
    },
  });
}

/** @param {string} id */
export async function findById(id) {
  const prisma = await getPrisma();
  return prisma.project.findUnique({ where: { id } });
}

/** @param {string} id slug, title and every asset the project uses */
export async function findForDelete(id) {
  const prisma = await getPrisma();
  return prisma.project.findUnique({
    where: { id },
    select: { slug: true, title: true, coverImageId: true, images: { select: { assetId: true } } },
  });
}

/**
 * @param {string} slug
 * @returns {Promise<boolean>}
 */
export async function existsBySlug(slug) {
  const prisma = await getPrisma();
  return Boolean(await prisma.project.findUnique({ where: { slug }, select: { id: true } }));
}

/**
 * @param {object} data project fields incl. slug
 * @param {string[]} categoryIds
 */
export async function create(data, categoryIds) {
  const prisma = await getPrisma();
  return prisma.project.create({
    data: { ...data, categories: { create: categoryIds.map((categoryId) => ({ categoryId })) } },
  });
}

/**
 * Updates fields and replaces the category links in one transaction.
 * @param {string} id
 * @param {object} data
 * @param {string[]} categoryIds
 */
export async function update(id, data, categoryIds) {
  const prisma = await getPrisma();
  await prisma.$transaction([
    prisma.project.update({ where: { id }, data }),
    prisma.projectCategory.deleteMany({ where: { projectId: id } }),
    prisma.projectCategory.createMany({
      data: categoryIds.map((categoryId) => ({ projectId: id, categoryId })),
    }),
  ]);
}

/** @param {string} id gallery rows and category links cascade */
export async function remove(id) {
  const prisma = await getPrisma();
  return prisma.project.delete({ where: { id } });
}

// ── Gallery (project_images), driven by media.service ────────────────

/** @param {string} id */
export async function findGalleryOwner(id) {
  const prisma = await getPrisma();
  const p = await prisma.project.findUnique({
    where: { id },
    select: { id: true, slug: true, coverImageId: true },
  });
  return p && { id: p.id, slug: p.slug, coverId: p.coverImageId };
}

/** @param {string} imageId */
export async function findGalleryImage(imageId) {
  const prisma = await getPrisma();
  const img = await prisma.projectImage.findUnique({
    where: { id: imageId },
    include: { asset: true, project: { select: { id: true, slug: true, coverImageId: true } } },
  });
  return (
    img && {
      id: img.id,
      assetId: img.assetId,
      asset: img.asset,
      ownerId: img.projectId,
      owner: { id: img.project.id, slug: img.project.slug, coverId: img.project.coverImageId },
    }
  );
}

/** @param {string} ownerId */
export async function findLastGallerySortOrder(ownerId) {
  const prisma = await getPrisma();
  const last = await prisma.projectImage.findFirst({
    where: { projectId: ownerId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return last?.sortOrder ?? -1;
}

/** @param {{ ownerId: string, assetId: string, sortOrder: number }} img */
export async function createGalleryImage({ ownerId, assetId, sortOrder }) {
  const prisma = await getPrisma();
  return prisma.projectImage.create({ data: { projectId: ownerId, assetId, sortOrder } });
}

/**
 * @param {string} ownerId
 * @param {string | null} assetId
 */
export async function setCover(ownerId, assetId) {
  const prisma = await getPrisma();
  return prisma.project.update({ where: { id: ownerId }, data: { coverImageId: assetId } });
}

/** @param {string} ownerId image ids in display order */
export async function findGalleryImageIds(ownerId) {
  const prisma = await getPrisma();
  return prisma.projectImage.findMany({
    where: { projectId: ownerId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
}

/** @param {string[]} ids renumber sortOrder 0..n in this order */
export async function reorderGallery(ids) {
  const prisma = await getPrisma();
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.projectImage.update({ where: { id }, data: { sortOrder: index } }),
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
    await tx.projectImage.delete({ where: { id: img.id } });
    if (img.owner.coverId === img.assetId) {
      const next = await tx.projectImage.findFirst({
        where: { projectId: img.ownerId },
        orderBy: { sortOrder: "asc" },
        select: { assetId: true },
      });
      await tx.project.update({
        where: { id: img.ownerId },
        data: { coverImageId: next?.assetId ?? null },
      });
    }
  });
}
