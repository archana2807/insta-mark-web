"use server";

import { attempt, validationFailed } from "@/server/errors/app-error";
import { requireAuth } from "@/server/auth/session";
import { clientLogoSchema, clientLogoUploadSchema } from "@/shared/schemas/client-logo.schema";
import * as clientLogoService from "./client-logo.service";

/** Signed Cloudinary params for a logo upload. */
export async function getLogoUploadSignature() {
  await requireAuth("media:upload");
  return attempt(() => clientLogoService.getUploadSignature());
}

/**
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function createClientLogo(_prev, formData) {
  const me = await requireAuth("content:write");
  const fields = clientLogoSchema.safeParse(Object.fromEntries(formData));
  if (!fields.success) return validationFailed(fields.error);

  let upload;
  try {
    upload = clientLogoUploadSchema.parse(JSON.parse(String(formData.get("upload") || "null")));
  } catch {
    return { ok: false, code: "UPLOAD_MISSING" };
  }
  return attempt(() => clientLogoService.createClientLogo(fields.data, upload, me));
}

/**
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function updateClientLogo(_prev, formData) {
  const me = await requireAuth("content:write");
  const id = String(formData.get("id") ?? "");
  const fields = clientLogoSchema.safeParse(Object.fromEntries(formData));
  if (!fields.success) return validationFailed(fields.error);
  return attempt(() => clientLogoService.updateClientLogo(id, fields.data, me));
}

/**
 * @param {FormData} formData
 * @returns {Promise<void>}
 */
export async function deleteClientLogo(formData) {
  const me = await requireAuth("content:write");
  await clientLogoService.deleteClientLogo(String(formData.get("id") ?? ""), me);
}
