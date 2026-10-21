"use server";

import { requireAdmin } from "@/server/auth/session";
import { clientLogoSchema, clientLogoUploadSchema } from "@/shared/schemas/client-logo.schema";
import * as clientLogoService from "./client-logo.service";

/** Signed Cloudinary params for a logo upload. */
export async function getLogoUploadSignature() {
  await requireAdmin();
  return clientLogoService.getUploadSignature();
}

/**
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function createClientLogo(_prev, formData) {
  const me = await requireAdmin();
  const fields = clientLogoSchema.safeParse(Object.fromEntries(formData));
  if (!fields.success) return { fieldErrors: fields.error.flatten().fieldErrors };

  let upload;
  try {
    upload = clientLogoUploadSchema.parse(JSON.parse(String(formData.get("upload") || "null")));
  } catch {
    return { error: "Please upload the logo image first." };
  }
  return clientLogoService.createClientLogo(fields.data, upload, me);
}

/**
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function updateClientLogo(_prev, formData) {
  const me = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const fields = clientLogoSchema.safeParse(Object.fromEntries(formData));
  if (!fields.success) return { fieldErrors: fields.error.flatten().fieldErrors };
  return clientLogoService.updateClientLogo(id, fields.data, me);
}

/**
 * @param {FormData} formData
 * @returns {Promise<void>}
 */
export async function deleteClientLogo(formData) {
  const me = await requireAdmin();
  await clientLogoService.deleteClientLogo(String(formData.get("id") ?? ""), me);
}
