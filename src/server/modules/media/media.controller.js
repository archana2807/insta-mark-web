"use server";

import { requireAdmin } from "@/server/auth/session";
import {
  galleryKindSchema,
  galleryUploadSchema,
  imageMoveSchema,
  imageRefSchema,
  imageUpdateSchema,
} from "@/shared/schemas/media.schema";
import * as mediaService from "./media.service";

/**
 * Upload step 1: signed params for a gallery upload.
 * @param {{ kind: string, ownerId: string, type?: string }} input
 */
export async function getUploadSignature({ kind, ownerId, type }) {
  await requireAdmin();
  const k = galleryKindSchema.parse(kind);
  return mediaService.getGalleryUploadSignature({ kind: k, ownerId, type });
}

/**
 * Upload step 2: verify the upload and add it to the gallery.
 * @param {{ kind: string, ownerId: string, type?: string, alt?: string, upload: unknown }} input
 */
export async function attachUploadedImage({ kind, ownerId, type, alt, upload }) {
  const me = await requireAdmin();
  const k = galleryKindSchema.parse(kind);
  const parsed = galleryUploadSchema.safeParse(upload);
  if (!parsed.success) return { error: "Upload could not be verified." };
  return mediaService.attachUploadedImage({ kind: k, ownerId, type, alt, upload: parsed.data }, me);
}

/**
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function updateImage(_prev, formData) {
  const me = await requireAdmin();
  const parsed = imageUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return mediaService.updateImage(parsed.data, me);
}

/**
 * @param {FormData} formData
 * @returns {Promise<void>}
 */
export async function moveImage(formData) {
  await requireAdmin();
  await mediaService.moveImage(imageMoveSchema.parse(Object.fromEntries(formData)));
}

/**
 * @param {FormData} formData
 * @returns {Promise<void>}
 */
export async function setCoverImage(formData) {
  const me = await requireAdmin();
  await mediaService.setCoverImage(imageRefSchema.parse(Object.fromEntries(formData)), me);
}

/**
 * @param {FormData} formData
 * @returns {Promise<void>}
 */
export async function removeImage(formData) {
  const me = await requireAdmin();
  await mediaService.removeImage(imageRefSchema.parse(Object.fromEntries(formData)), me);
}
