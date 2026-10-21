"use server";

import { requireAuth } from "@/server/auth/session";
import { attempt, firstIssue } from "@/server/errors/app-error";
import {
  bannerAltSchema,
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
 * Upload step 2: verify the upload and its size, then use it as the banner.
 * @param {{ slot: string, upload: unknown }} input
 */
export async function saveBannerImage({ slot, upload }) {
  const me = await requireAuth("media:upload");
  const s = bannerSlotSchema.parse(slot);
  const parsed = bannerUploadSchema.safeParse(upload);
  if (!parsed.success) return { ok: false, code: "UPLOAD_NOT_VERIFIED" };
  const tooSmall = checkBannerSize(s, parsed.data.width, parsed.data.height);
  if (tooSmall) return { ok: false, code: "VALIDATION_FAILED", message: tooSmall };
  return attempt(() => bannerService.saveImage(s, parsed.data, me));
}

/**
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function removeBannerImage(_prev, formData) {
  const me = await requireAuth("content:write");
  const s = bannerSlotSchema.parse(formData.get("slot"));
  return attempt(() => bannerService.removeImage(s, me));
}

/**
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function saveBannerAlt(_prev, formData) {
  const me = await requireAuth("content:write");
  const parsed = bannerAltSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstIssue(parsed.error);
  return attempt(() => bannerService.saveAlt(parsed.data.alt, me));
}
