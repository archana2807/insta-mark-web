// Named projects: public pages, admin CRUD, and the project gallery table (driven by
// media.service). Without a database there are no projects.
import "server-only";
import { toImage } from "@/lib/image";
import { uniqueSlug } from "@/lib/slug";
import { TAGS, cached, revalidatePage, revalidateProjects } from "@/server/cache";
import { isDatabaseConfigured } from "@/server/config/env";
import * as auditService from "@/server/modules/audit/audit.service";
import * as mediaService from "@/server/modules/media/media.service";
import * as projectRepository from "./project.repository";

const toProject = (p) => ({
  slug: p.slug,
  title: p.title,
  clientName: p.clientName,
  city: p.city,
  year: p.year,
  isFeatured: p.isFeatured,
  description: p.description ?? null,
  industry: p.industry?.name ?? null,
  cover: toImage(p.coverImage ?? p.images?.[0]?.asset) ?? null,
  categories: p.categories.map((c) => c.category),
  images: p.images.map((i) => toImage(i.asset)),
});

const loadProjects = cached(
  async () => (await projectRepository.findActive()).map(toProject),
  ["projects"],
  [TAGS.projects],
);

/** @param {string} slug */
const loadProject = (slug) =>
  cached(
    async () => {
      const p = await projectRepository.findActiveBySlug(slug);
      return p ? toProject(p) : null;
    },
    ["project", slug],
    [TAGS.projects, TAGS.project(slug)],
  )();

/** Named projects (added in admin). Empty without a database. */
export async function listProjects() {
  return isDatabaseConfigured() ? loadProjects() : [];
}

/** @param {string} slug */
export async function getProject(slug) {
  return isDatabaseConfigured() ? loadProject(slug) : null;
}

// ── Admin ─────────────────────────────────────────────────────────────

export async function listForAdmin() {
  return projectRepository.findAllForAdmin();
}

/** @param {string} id */
export async function getForEdit(id) {
  return projectRepository.findByIdForEdit(id);
}

/**
 * @param {import("@/shared/schemas/project.schema").ProjectInput} input
 * @param {string[]} categoryIds
 * @param {{ id: string }} actor
 * @returns {Promise<string>} new project id
 */
export async function createProject(input, categoryIds, actor) {
  const { slug: wanted, ...data } = input;
  const slug = await uniqueSlug(wanted || data.title, projectRepository.existsBySlug);
  const project = await projectRepository.create({ ...data, slug }, categoryIds);
  await auditService.log(actor, "CREATE", "Project", project.id, { title: [null, data.title] });
  revalidateProjects(slug);
  return project.id;
}

/**
 * @param {string} id
 * @param {import("@/shared/schemas/project.schema").ProjectInput} input
 * @param {string[]} categoryIds
 * @param {{ id: string }} actor
 */
export async function updateProject(id, input, categoryIds, actor) {
  const before = await projectRepository.findById(id);
  if (!before) return { error: "Project not found." };

  const { slug: wanted, ...data } = input;
  let slug = before.slug;
  if (wanted && wanted !== before.slug) {
    if (await projectRepository.existsBySlug(wanted)) {
      return { fieldErrors: { slug: ["This URL is already used by another project."] } };
    }
    slug = wanted;
  }

  await projectRepository.update(id, { ...data, slug }, categoryIds);
  await auditService.log(
    actor,
    "UPDATE",
    "Project",
    id,
    auditService.diff(before, { ...data, slug }),
  );
  revalidateProjects(before.slug);
  if (slug !== before.slug) revalidateProjects(slug);
  revalidatePage(`/admin/projects/${id}`);
  return { ok: true, message: "Saved." };
}

/**
 * Deletes a project and every image asset nothing else uses.
 * @param {string} id
 * @param {{ id: string }} actor
 * @returns {Promise<boolean>} false when the project does not exist
 */
export async function deleteProject(id, actor) {
  const project = await projectRepository.findForDelete(id);
  if (!project) return false;
  await projectRepository.remove(id);
  await mediaService.deleteAssetsIfUnused([
    project.coverImageId,
    ...project.images.map((i) => i.assetId),
  ]);
  await auditService.log(actor, "DELETE", "Project", id, { title: [project.title, null] });
  revalidateProjects(project.slug);
  return true;
}

/** Project gallery table, used by media.service. */
export const gallery = {
  findOwner: projectRepository.findGalleryOwner,
  findImage: projectRepository.findGalleryImage,
  findLastSortOrder: projectRepository.findLastGallerySortOrder,
  createImage: projectRepository.createGalleryImage,
  updateImageType: async () => {},
  setCover: projectRepository.setCover,
  findImageIds: projectRepository.findGalleryImageIds,
  reorder: projectRepository.reorderGallery,
  removeImage: projectRepository.removeGalleryImage,
};
