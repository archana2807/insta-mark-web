// Solution categories: public pages, admin edits, and the category gallery table
// (driven by media.service). Without a database, /content is used.
import "server-only";
import { categories as contentCategories, categoryGroups, enumToGroup } from "@/content/categories";
import { gallery as contentGallery } from "@/content/gallery";
import { toImage } from "@/lib/image";
import { TAGS, cached, revalidateCategory, revalidatePage } from "@/server/cache";
import { isDatabaseConfigured } from "@/server/config/env";
import * as auditService from "@/server/modules/audit/audit.service";
import * as categoryRepository from "./category.repository";

const toCategory = (row) => ({
  ...row,
  group: enumToGroup[row.group] ?? "architectural",
  icon: row.icon ?? "signpost",
  features: Array.isArray(row.features) ? row.features : [],
  seoTitle: row.seoTitle ?? undefined,
  seoDescription: row.seoDescription ?? undefined,
});

const loadCategories = cached(
  async () => (await categoryRepository.findActive()).map(toCategory),
  ["categories"],
  [TAGS.categories],
);

const loadAllCategoryImages = cached(
  async () => {
    const bySlug = {};
    for (const r of await categoryRepository.findAllImages()) {
      const g = (bySlug[r.category.slug] ??= { catalogue: [], executed: [] });
      (r.type === "CATALOGUE" ? g.catalogue : g.executed).push(toImage(r.asset));
    }
    return bySlug;
  },
  ["category-images-all"],
  [TAGS.gallery, TAGS.categories],
);

/** Active categories in display order. */
export async function listCategories() {
  return isDatabaseConfigured() ? loadCategories() : contentCategories;
}

/** Categories split into the two groups (architectural, road safety). */
export async function listCategoriesByGroup() {
  const categories = await listCategories();
  return Object.entries(categoryGroups).map(([key, label]) => ({
    key,
    label,
    items: categories.filter((c) => c.group === key),
  }));
}

/**
 * Catalogue and executed photos of one category.
 * @param {string} slug
 */
export async function getCategoryImages(slug) {
  if (!isDatabaseConfigured()) return { catalogue: [], executed: contentGallery[slug] ?? [] };
  return (await loadAllCategoryImages())[slug] ?? { catalogue: [], executed: [] };
}

/** @param {string} slug */
export async function getCategoryCoverImage(slug) {
  const images = await getCategoryImages(slug);
  return images.executed[0] ?? images.catalogue[0] ?? null;
}

/** Executed work grouped by category for the Projects page. */
export async function listExecutedWork() {
  const categories = await listCategories();
  const groups = await Promise.all(
    categories.map(async (c) => ({
      category: c,
      images: (await getCategoryImages(c.slug)).executed,
    })),
  );
  return groups.filter((g) => g.images.length > 0);
}

/**
 * @param {string} slug
 * @returns {Promise<string | null>} category id, or null
 */
export async function findIdBySlug(slug) {
  return (await categoryRepository.findIdBySlug(slug))?.id ?? null;
}

/**
 * @param {string | null | undefined} id
 * @returns {Promise<string | null>} category slug, or null
 */
export async function findSlugById(id) {
  if (!id) return null;
  return (await categoryRepository.findSlugById(id))?.slug ?? null;
}

// ── Admin ─────────────────────────────────────────────────────────────

export async function listForAdmin() {
  return categoryRepository.findAllWithCounts();
}

/** @param {string} id */
export async function getForEdit(id) {
  return categoryRepository.findByIdWithImages(id);
}

/** { id, name } for admin dropdowns. */
export async function listIdOptions() {
  return categoryRepository.findOptions({ id: true });
}

/** { slug, name } for the enquiry filter. */
export async function listSlugOptions() {
  return categoryRepository.findOptions({ slug: true });
}

/** @returns {Promise<Record<string, string>>} id → name */
export async function getNamesById() {
  return Object.fromEntries((await categoryRepository.findNames()).map((c) => [c.id, c.name]));
}

/**
 * @param {string} id
 * @param {Omit<import("@/shared/schemas/category.schema").CategoryInput, "id">} data
 * @param {{ id: string }} actor
 */
export async function updateCategory(id, data, actor) {
  const before = await categoryRepository.findById(id);
  if (!before) return { error: "Category not found." };

  await categoryRepository.update(id, data);
  await auditService.log(actor, "UPDATE", "Category", id, auditService.diff(before, data));
  revalidateCategory(before.slug);
  revalidatePage(`/admin/categories/${id}`);
  revalidatePage("/admin/categories");
  return { ok: true, message: "Saved. The website updates within a few seconds." };
}

/** Category gallery table, used by media.service. */
export const gallery = {
  findOwner: categoryRepository.findGalleryOwner,
  findImage: categoryRepository.findGalleryImage,
  findLastSortOrder: categoryRepository.findLastGallerySortOrder,
  createImage: categoryRepository.createGalleryImage,
  updateImageType: categoryRepository.updateGalleryImageType,
  setCover: categoryRepository.setCover,
  findImageIds: categoryRepository.findGalleryImageIds,
  reorder: categoryRepository.reorderGallery,
  removeImage: categoryRepository.removeGalleryImage,
};
