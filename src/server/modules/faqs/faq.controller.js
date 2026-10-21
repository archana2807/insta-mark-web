"use server";

import { requireAuth } from "@/server/auth/session";
import { faqSchema } from "@/shared/schemas/faq.schema";
import * as faqService from "./faq.service";

/**
 * Add or edit an FAQ (admin form).
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function saveFaq(_prev, formData) {
  const me = await requireAuth("content:write");
  const id = String(formData.get("id") ?? "");
  const parsed = faqSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  return faqService.saveFaq(id, parsed.data, me);
}

/**
 * @param {FormData} formData
 * @returns {Promise<void>}
 */
export async function deleteFaq(formData) {
  const me = await requireAuth("content:write");
  const id = String(formData.get("id") ?? "");
  await faqService.deleteFaq(id, me);
}
