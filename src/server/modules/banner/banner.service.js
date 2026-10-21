// Home banner (R-3.1, R-8.1): a desktop and a mobile image uploaded in admin. Without
// one, the home page keeps its current photo (the fallback lives in HomeHero).
import "server-only";
import { toImage } from "@/lib/image";
import { TAGS, cached, revalidateHome, revalidatePage } from "@/server/cache";
import { isDatabaseConfigured } from "@/server/config/env";
import { AppError } from "@/server/errors/app-error";
import * as auditService from "@/server/modules/audit/audit.service";
import * as mediaService from "@/server/modules/media/media.service";
import * as bannerRepository from "./banner.repository";

const SLOT_KEY = { desktop: "desktopAssetId", mobile: "mobileAssetId" };
const EMPTY = { desktopAssetId: null, mobileAssetId: null, alt: null };

/** @typedef {{ src: string, width: number, height: number, alt: string }} Img */

/** Stored value + its images. */
async function load() {
  const value = { ...EMPTY, ...(await bannerRepository.find()) };
  const assets = await mediaService.findAssetsByIds([value.desktopAssetId, value.mobileAssetId]);
  return {
    value,
    desktop: toImage(assets[value.desktopAssetId]) ?? null,
    mobile: toImage(assets[value.mobileAssetId]) ?? null,
  };
}

const loadBanner = cached(
  async () => {
    const { value, desktop, mobile } = await load();
    if (!desktop && !mobile) return null;
    return { desktop, mobile, alt: value.alt };
  },
  ["home-banner"],
  [TAGS.home],
);

/**
 * The uploaded banner for the home page, or null (= show the fallback photo).
 * @returns {Promise<{ desktop: Img | null, mobile: Img | null, alt: string | null } | null>}
 */
export async function getBanner() {
  return isDatabaseConfigured() ? loadBanner() : null;
}

/** Current banner for the admin page (not cached). */
export async function getForAdmin() {
  const { value, desktop, mobile } = await load();
  return { desktop, mobile, alt: value.alt ?? "" };
}

/** @returns {boolean} */
export function isUploadEnabled() {
  return mediaService.isUploadEnabled();
}

/** @param {import("@/shared/schemas/banner.schema").BannerSlot} slot */
export async function getUploadSignature(slot) {
  return mediaService.getFolderUploadSignature(`insta-mark/banner/${slot}`);
}

/**
 * Deletes a banner image that is no longer used in either slot.
 * @param {string | null} assetId
 * @param {typeof EMPTY} next value after the change
 */
async function dropIfUnused(assetId, next) {
  if (!assetId || assetId === next.desktopAssetId || assetId === next.mobileAssetId) return;
  await mediaService.deleteAssetsIfUnused([assetId]);
}

/**
 * @param {typeof EMPTY} next
 * @param {{ id: string }} actor
 * @param {Record<string, [unknown, unknown]>} changes
 * @param {string} message
 */
async function commit(next, actor, changes, message) {
  await bannerRepository.save(next);
  await auditService.log(actor, "UPDATE", "Banner", null, changes);
  revalidateHome();
  revalidatePage("/admin/banner");
  return { ok: true, message };
}

/**
 * Stores a verified upload (size already checked) in one slot; the replaced image is deleted.
 * @param {import("@/shared/schemas/banner.schema").BannerSlot} slot
 * @param {import("@/shared/schemas/media.schema").CloudinaryUpload} upload
 * @param {{ id: string }} actor
 */
export async function saveImage(slot, upload, actor) {
  if (!mediaService.isGenuineUpload(upload)) throw new AppError("UPLOAD_NOT_VERIFIED");
  const current = { ...EMPTY, ...(await bannerRepository.find()) };
  const asset = await mediaService.saveAsset(upload, current.alt || "Insta Mark banner");
  const key = SLOT_KEY[slot];
  const next = { ...current, [key]: asset.id };
  const result = await commit(
    next,
    actor,
    { [slot]: [current[key], asset.id] },
    "Banner saved. The home page updates within a few seconds.",
  );
  await dropIfUnused(current[key], next);
  return result;
}

/**
 * Removes one slot's image; the home page falls back (mobile → desktop → old photo).
 * @param {import("@/shared/schemas/banner.schema").BannerSlot} slot
 * @param {{ id: string }} actor
 */
export async function removeImage(slot, actor) {
  const current = { ...EMPTY, ...(await bannerRepository.find()) };
  const key = SLOT_KEY[slot];
  if (!current[key]) return { ok: true, message: "Nothing to remove." };
  const next = { ...current, [key]: null };
  const result = await commit(next, actor, { [slot]: [current[key], null] }, "Banner removed.");
  await dropIfUnused(current[key], next);
  return result;
}

/**
 * @param {string} alt
 * @param {{ id: string }} actor
 */
export async function saveAlt(alt, actor) {
  const current = { ...EMPTY, ...(await bannerRepository.find()) };
  return commit({ ...current, alt }, actor, { alt: [current.alt, alt] }, "Saved.");
}
