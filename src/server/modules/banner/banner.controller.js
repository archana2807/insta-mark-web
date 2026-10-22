"use server";

import { requireAuth } from "@/server/auth/session";
import { attempt, firstIssue } from "@/server/errors/app-error";
import {
  bannerAltSchema,
  bannerMoveSchema,
  bannerSlideSchema,
  bannerSlotSchema,
  bannerUploadSchema,
  checkBannerSize,
} from "@/shared/schemas/banner.schema";
import * as bannerService from "./banner.service";

/**
 * Upload step 1: signed Cloudinary params for one banner slot.
 * @param {{ slot: string }} input
 */
export async function getBannerUploadSignature({ slot }) {
  await requireAuth("media:upload");
  const s = bannerSlotSchema.parse(slot);
  return attempt(() => bannerService.getUploadSignature(s));
}

/**
 * Upload step 2: verify the upload and its size, then use it in one slot of one slide.
 * @param {{ slide: number, slot: string, upload: unknown }} input
 */
export async function saveBannerImage({ slide, slot, upload }) {
  const me = await requireAuth("media:upload");
  const index = bannerSlideSchema.parse(slide);
  const s = bannerSlotSchema.parse(slot);
  const parsed = bannerUploadSchema.safeParse(upload);
  if (!parsed.success) return { ok: false, code: "UPLOAD_NOT_VERIFIED" };
  const tooSmall = checkBannerSize(s, parsed.data.width, parsed.data.height);
  if (tooSmall) return { ok: false, code: "VALIDATION_FAILED", message: tooSmall };
  return attempt(() => bannerService.saveImage(index, s, parsed.data, me));
}

/**
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function removeBannerImage(_prev, formData) {
  const me = await requireAuth("content:write");
  const index = bannerSlideSchema.parse(formData.get("slide"));
  const s = bannerSlotSchema.parse(formData.get("slot"));
  return attempt(() => bannerService.removeImage(index, s, me));
}

/**
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function saveBannerAlt(_prev, formData) {
  const me = await requireAuth("content:write");
  const parsed = bannerAltSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstIssue(parsed.error);
  return attempt(() => bannerService.saveAlt(parsed.data.slide, parsed.data.alt, me));
}

/**
 * Adds an empty slide (up to three).
 * @param {unknown} _prev
 * @param {FormData} _formData
 */
export async function addBannerSlide(_prev, _formData) {
  const me = await requireAuth("content:write");
  return attempt(() => bannerService.addSlide(me));
}

/**
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function removeBannerSlide(_prev, formData) {
  const me = await requireAuth("content:write");
  const index = bannerSlideSchema.parse(formData.get("slide"));
  return attempt(() => bannerService.removeSlide(index, me));
}

/**
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function moveBannerSlide(_prev, formData) {
  const me = await requireAuth("content:write");
  const index = bannerSlideSchema.parse(formData.get("slide"));
  const direction = bannerMoveSchema.parse(formData.get("direction"));
  return attempt(() => bannerService.moveSlide(index, direction, me));
}
