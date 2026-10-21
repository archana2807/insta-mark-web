// Media: Cloudinary signed uploads, gallery actions for categories and projects
// (each owner module keeps its own gallery table), and unused-asset cleanup.
import "server-only";
import { AppError } from "@/server/errors/app-error";
import {
  createUploadParams,
  destroyAsset,
  isCloudinaryConfigured,
  verifyUploadResponse,
} from "@/server/integrations/cloudinary/cloudinary.adapter";
import {
  revalidateCategory,
  revalidateGallery,
  revalidatePage,
  revalidateProjects,
} from "@/server/cache";
import * as auditService from "@/server/modules/audit/audit.service";
import * as categoryService from "@/server/modules/categories/category.service";
import * as projectService from "@/server/modules/projects/project.service";
import * as mediaRepository from "./media.repository";

// Gallery "kinds": which owner module an image belongs to. Built lazily because
// projects.service also imports this module.
const kinds = () => ({
  category: {
    gallery: categoryService.gallery,
    entity: "category",
    folder: (slug, type) => `insta-mark/categories/${slug}/${(type ?? "EXECUTED").toLowerCase()}`,
    adminPath: (id) => `/admin/categories/${id}`,
    // The category list carries the cover (R-8.2), so refresh it with the gallery.
    revalidate: (slug) => {
      revalidateGallery(slug);
      revalidateCategory(slug);
    },
  },
  project: {
    gallery: projectService.gallery,
    entity: "project",
    folder: (slug) => `insta-mark/projects/${slug}`,
    adminPath: (id) => `/admin/projects/${id}`,
    revalidate: (slug) => revalidateProjects(slug),
  },
});

/**
 * Upload step 1: signed params for a direct browser → Cloudinary upload.
 * @param {{ kind: "category" | "project", ownerId: string, type?: string }} input
 */
export async function getGalleryUploadSignature({ kind, ownerId, type }) {
  if (!isCloudinaryConfigured()) throw new AppError("UPLOAD_NOT_CONFIGURED");
  const cfg = kinds()[kind];
  const owner = await cfg.gallery.findOwner(ownerId);
  if (!owner) throw new AppError("NOT_FOUND");
  return createUploadParams(cfg.folder(owner.slug, type));
}

/**
 * Signed params for an upload into one folder (e.g. the home banner).
 * @param {string} folder must start with "insta-mark/"
 */
export async function getFolderUploadSignature(folder) {
  if (!isCloudinaryConfigured()) throw new AppError("UPLOAD_NOT_CONFIGURED");
  return createUploadParams(folder);
}

/**
 * @param {(string | null | undefined)[]} ids
 * @returns {Promise<Record<string, { id: string, url: string, width: number, height: number, alt: string }>>}
 */
export async function findAssetsByIds(ids) {
  const wanted = [...new Set(ids.filter(Boolean))];
  if (wanted.length === 0) return {};
  return Object.fromEntries((await mediaRepository.findByIds(wanted)).map((a) => [a.id, a]));
}

/** Signed params for a client-logo upload. */
export async function getLogoUploadSignature() {
  if (!isCloudinaryConfigured()) throw new AppError("UPLOAD_NOT_CONFIGURED");
  return createUploadParams("insta-mark/clients");
}

/** @returns {boolean} */
export function isUploadEnabled() {
  return isCloudinaryConfigured();
}

/** @param {import("@/shared/schemas/media.schema").CloudinaryUpload} upload */
export function isGenuineUpload(upload) {
  return verifyUploadResponse(upload);
}

/**
 * Saves (or finds) the asset row for a verified upload.
 * @param {import("@/shared/schemas/media.schema").CloudinaryUpload} u
 * @param {string} alt
 */
export async function saveAsset(u, alt) {
  return mediaRepository.upsertByPublicId({
    publicId: u.public_id,
    url: u.secure_url,
    width: u.width,
    height: u.height,
    format: u.format,
    bytes: u.bytes,
    alt,
  });
}

/**
 * @param {string} assetId
 * @param {string} alt
 */
export async function updateAlt(assetId, alt) {
  return mediaRepository.updateAlt(assetId, alt);
}

/**
 * Upload step 2: register a verified upload and add it to the gallery.
 * @param {{ kind: "category" | "project", ownerId: string, type?: string, alt?: string, upload: import("@/shared/schemas/media.schema").CloudinaryUpload }} input
 * @param {{ id: string }} actor
 */
export async function attachUploadedImage({ kind, ownerId, type, alt, upload }, actor) {
  if (!verifyUploadResponse(upload)) throw new AppError("UPLOAD_NOT_VERIFIED");
  const cfg = kinds()[kind];
  const owner = await cfg.gallery.findOwner(ownerId);
  if (!owner) throw new AppError("NOT_FOUND");

  const asset = await saveAsset(
    upload,
    String(alt || "")
      .trim()
      .slice(0, 255) || "Photo",
  );
  await cfg.gallery.createImage({
    ownerId: owner.id,
    assetId: asset.id,
    sortOrder: (await cfg.gallery.findLastSortOrder(owner.id)) + 1,
    type: type === "CATALOGUE" ? "CATALOGUE" : "EXECUTED",
  });
  if (!owner.coverId) await cfg.gallery.setCover(owner.id, asset.id);
  await auditService.log(actor, "UPLOAD", cfg.entity, owner.id, {
    image: [null, upload.public_id],
  });
  cfg.revalidate(owner.slug);
  revalidatePage(cfg.adminPath(owner.id));
  return { ok: true };
}

/**
 * Alt text (and, for categories, catalogue / executed type).
 * @param {import("@/shared/schemas/media.schema").ImageUpdateInput} input
 * @param {{ id: string }} actor
 */
export async function updateImage({ kind, id, alt, type }, actor) {
  const cfg = kinds()[kind];
  const img = await cfg.gallery.findImage(id);
  if (!img) throw new AppError("IMAGE_NOT_FOUND");

  await mediaRepository.updateAlt(img.assetId, alt);
  if (kind === "category" && type) await cfg.gallery.updateImageType(id, type);
  await auditService.log(actor, "UPDATE", "MediaAsset", img.assetId, {
    alt: [img.asset.alt, alt],
  });
  cfg.revalidate(img.owner.slug);
  revalidatePage(cfg.adminPath(img.owner.id));
  return { ok: true, message: "Saved." };
}

/**
 * Moves an image one place up or down.
 * @param {{ kind: "category" | "project", id: string, direction: "up" | "down" }} input
 * @returns {Promise<void>}
 */
export async function moveImage({ kind, id, direction }) {
  const cfg = kinds()[kind];
  const img = await cfg.gallery.findImage(id);
  if (!img) return;

  const siblings = await cfg.gallery.findImageIds(img.ownerId);
  const i = siblings.findIndex((s) => s.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= siblings.length) return;
  [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
  // Renumber everything so legacy duplicate sortOrders are normalised too.
  await cfg.gallery.reorder(siblings.map((s) => s.id));
  cfg.revalidate(img.owner.slug);
  revalidatePage(cfg.adminPath(img.ownerId));
}

/**
 * @param {{ kind: "category" | "project", id: string }} input
 * @param {{ id: string }} actor
 * @returns {Promise<void>}
 */
export async function setCoverImage({ kind, id }, actor) {
  const cfg = kinds()[kind];
  const img = await cfg.gallery.findImage(id);
  if (!img) return;
  await cfg.gallery.setCover(img.ownerId, img.assetId);
  await auditService.log(actor, "SET_COVER", cfg.entity, img.ownerId, {
    cover: [null, img.assetId],
  });
  cfg.revalidate(img.owner.slug);
  revalidatePage(cfg.adminPath(img.ownerId));
}

/**
 * Removes an image from the gallery; deletes the asset if nothing else uses it.
 * @param {{ kind: "category" | "project", id: string }} input
 * @param {{ id: string }} actor
 * @returns {Promise<void>}
 */
export async function removeImage({ kind, id }, actor) {
  const cfg = kinds()[kind];
  const img = await cfg.gallery.findImage(id);
  if (!img) return;

  await cfg.gallery.removeImage(img);
  // Delete the asset only when no gallery, cover or logo references it.
  await deleteAssetsIfUnused([img.assetId]);
  await auditService.log(actor, "REMOVE_IMAGE", cfg.entity, img.ownerId, {
    image: [img.asset.publicId, null],
  });
  cfg.revalidate(img.owner.slug);
  revalidatePage(cfg.adminPath(img.ownerId));
}

/**
 * Deletes assets nothing references any more (DB row + Cloudinary file).
 * @param {(string | null | undefined)[]} assetIds
 * @returns {Promise<number>} assets deleted
 */
export async function deleteAssetsIfUnused(assetIds) {
  let deleted = 0;
  for (const id of new Set(assetIds.filter(Boolean))) {
    const usage = await mediaRepository.findUsage(id);
    if (!usage || Object.values(usage._count).some((n) => n > 0)) continue;
    await mediaRepository.remove(id);
    deleted++;
    // Local seed images ("/images/…") live in the repo; only Cloudinary files are destroyed.
    if (usage.publicId.startsWith("insta-mark/")) {
      destroyAsset(usage.publicId).catch((err) =>
        console.error("[media] cloudinary destroy failed", usage.publicId, err),
      );
    }
  }
  return deleted;
}
