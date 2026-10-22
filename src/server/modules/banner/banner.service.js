// Home banner (R-3.1, R-8.1, task 10h): a slider of 1–3 slides, each with a desktop and a
// mobile image uploaded in admin. Without any image the home page shows its three
// hand-picked photos (the fallback lives in HomeHero).
import "server-only";
import { toImage } from "@/lib/image";
import { BANNER } from "@/shared/constants";
import { TAGS, cached, revalidateHome, revalidatePage } from "@/server/cache";
import { isDatabaseConfigured } from "@/server/config/env";
import { AppError } from "@/server/errors/app-error";
import * as auditService from "@/server/modules/audit/audit.service";
import * as mediaService from "@/server/modules/media/media.service";
import * as bannerRepository from "./banner.repository";

const SLOT_KEY = { desktop: "desktopAssetId", mobile: "mobileAssetId" };
const EMPTY_SLIDE = { desktopAssetId: null, mobileAssetId: null, alt: null };

/** @typedef {{ desktopAssetId: string | null, mobileAssetId: string | null, alt: string | null }} Slide */
/** @typedef {{ src: string, width: number, height: number, alt: string }} Img */
/** @typedef {{ desktop: Img | null, mobile: Img | null, alt: string | null }} SlideImages */

/**
 * The stored slides, whichever shape the setting has (the older single banner is slide 1).
 * @param {Record<string, unknown> | null} value
 * @returns {Slide[]}
 */
export function normalizeSlides(value) {
  if (!value) return [];
  const list = Array.isArray(value.slides)
    ? value.slides
    : value.desktopAssetId || value.mobileAssetId
      ? [value]
      : [];
  return list.slice(0, BANNER.maxSlides).map((s) => ({ ...EMPTY_SLIDE, ...s }));
}

/** Stored slides + their images. */
async function load() {
  const slides = normalizeSlides(await bannerRepository.find());
  const ids = slides.flatMap((s) => [s.desktopAssetId, s.mobileAssetId]).filter(Boolean);
  const assets = await mediaService.findAssetsByIds(ids);
  return slides.map((s) => ({
    ...s,
    desktop: toImage(assets[s.desktopAssetId]) ?? null,
    mobile: toImage(assets[s.mobileAssetId]) ?? null,
  }));
}

const loadBanner = cached(
  async () => {
    const slides = (await load())
      .filter((s) => s.desktop || s.mobile)
      .map((s) => ({ desktop: s.desktop, mobile: s.mobile, alt: s.alt }));
    return slides.length ? slides : null;
  },
  ["home-banner-slides"],
  [TAGS.home],
);

/**
 * The uploaded slides for the home page (slides without any image are skipped), or null
 * (= show the three hand-picked photos).
 * @returns {Promise<SlideImages[] | null>}
 */
export async function getBanner() {
  return isDatabaseConfigured() ? loadBanner() : null;
}

/**
 * Every stored slide for the admin page (not cached, empty slides included).
 * @returns {Promise<(SlideImages & { alt: string })[]>}
 */
export async function getForAdmin() {
  return (await load()).map((s) => ({ desktop: s.desktop, mobile: s.mobile, alt: s.alt ?? "" }));
}

/** @returns {boolean} */
export function isUploadEnabled() {
  return mediaService.isUploadEnabled();
}

/** @param {import("@/shared/schemas/banner.schema").BannerSlot} slot */
export async function getUploadSignature(slot) {
  return mediaService.getFolderUploadSignature(`insta-mark/banner/${slot}`);
}

/** The stored slides (raw ids). */
async function currentSlides() {
  return normalizeSlides(await bannerRepository.find());
}

/**
 * @param {Slide[]} slides
 * @param {number} index
 * @returns {Slide}
 */
function slideAt(slides, index) {
  const slide = slides[index];
  if (!slide) throw new AppError("VALIDATION_FAILED");
  return slide;
}

/**
 * Deletes banner images that are no longer used by any slot.
 * @param {(string | null)[]} candidates asset ids that may have become unused
 * @param {Slide[]} next slides after the change
 */
async function dropIfUnused(candidates, next) {
  const used = new Set(next.flatMap((s) => [s.desktopAssetId, s.mobileAssetId]));
  const unused = candidates.filter((id) => id && !used.has(id));
  if (unused.length) await mediaService.deleteAssetsIfUnused(unused);
}

/**
 * @param {Slide[]} next
 * @param {{ id: string }} actor
 * @param {Record<string, [unknown, unknown]>} changes
 * @param {string} message
 */
async function commit(next, actor, changes, message) {
  await bannerRepository.save({ slides: next });
  await auditService.log(actor, "UPDATE", "Banner", null, changes);
  revalidateHome();
  revalidatePage("/admin/banner");
  return { ok: true, message };
}

/**
 * Stores a verified upload (size already checked) in one slot of one slide; the replaced
 * image is deleted.
 * @param {number} index slide position (0-based)
 * @param {import("@/shared/schemas/banner.schema").BannerSlot} slot
 * @param {import("@/shared/schemas/media.schema").CloudinaryUpload} upload
 * @param {{ id: string }} actor
 */
export async function saveImage(index, slot, upload, actor) {
  if (!mediaService.isGenuineUpload(upload)) throw new AppError("UPLOAD_NOT_VERIFIED");
  const slides = await currentSlides();
  const slide = slideAt(slides, index);
  const asset = await mediaService.saveAsset(upload, slide.alt || "Insta Mark banner");
  const key = SLOT_KEY[slot];
  const next = slides.map((s, i) => (i === index ? { ...s, [key]: asset.id } : s));
  const result = await commit(
    next,
    actor,
    { [`slide ${index + 1} ${slot}`]: [slide[key], asset.id] },
    "Banner saved. The home page updates within a few seconds.",
  );
  await dropIfUnused([slide[key]], next);
  return result;
}

/**
 * Removes one slot's image of a slide; the home page falls back (mobile → desktop).
 * @param {number} index
 * @param {import("@/shared/schemas/banner.schema").BannerSlot} slot
 * @param {{ id: string }} actor
 */
export async function removeImage(index, slot, actor) {
  const slides = await currentSlides();
  const slide = slideAt(slides, index);
  const key = SLOT_KEY[slot];
  if (!slide[key]) return { ok: true, message: "Nothing to remove." };
  const next = slides.map((s, i) => (i === index ? { ...s, [key]: null } : s));
  const result = await commit(
    next,
    actor,
    { [`slide ${index + 1} ${slot}`]: [slide[key], null] },
    "Banner photo removed.",
  );
  await dropIfUnused([slide[key]], next);
  return result;
}

/**
 * @param {number} index
 * @param {string} alt
 * @param {{ id: string }} actor
 */
export async function saveAlt(index, alt, actor) {
  const slides = await currentSlides();
  const slide = slideAt(slides, index);
  const next = slides.map((s, i) => (i === index ? { ...s, alt } : s));
  return commit(next, actor, { [`slide ${index + 1} alt`]: [slide.alt, alt] }, "Saved.");
}

/**
 * Adds an empty slide at the end (up to the limit); photos are uploaded into it next.
 * @param {{ id: string }} actor
 */
export async function addSlide(actor) {
  const slides = await currentSlides();
  if (slides.length >= BANNER.maxSlides) throw new AppError("VALIDATION_FAILED"); // the admin page hides "Add slide" at the limit
  const next = [...slides, { ...EMPTY_SLIDE }];
  return commit(next, actor, { slides: [slides.length, next.length] }, "Slide added.");
}

/**
 * Removes a slide and deletes its photos when nothing else uses them.
 * @param {number} index
 * @param {{ id: string }} actor
 */
export async function removeSlide(index, actor) {
  const slides = await currentSlides();
  const slide = slideAt(slides, index);
  const next = slides.filter((_, i) => i !== index);
  const result = await commit(
    next,
    actor,
    { slides: [slides.length, next.length] },
    "Slide removed.",
  );
  await dropIfUnused([slide.desktopAssetId, slide.mobileAssetId], next);
  return result;
}

/**
 * Moves a slide one place up (earlier) or down (later).
 * @param {number} index
 * @param {import("@/shared/schemas/banner.schema").BannerMove} direction
 * @param {{ id: string }} actor
 */
export async function moveSlide(index, direction, actor) {
  const slides = await currentSlides();
  slideAt(slides, index);
  const to = direction === "up" ? index - 1 : index + 1;
  if (to < 0 || to >= slides.length) return { ok: true, message: "Already there." };
  const next = [...slides];
  [next[index], next[to]] = [next[to], next[index]];
  return commit(next, actor, { order: [index + 1, to + 1] }, "Order saved.");
}
