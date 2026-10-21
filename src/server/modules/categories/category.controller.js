"use server";

import { attempt, validationFailed } from "@/server/errors/app-error";
import { requireAuth } from "@/server/auth/session";
import { categorySchema } from "@/shared/schemas/category.schema";
import * as categoryService from "./category.service";

/**
 * Edit category text, group, icon, SEO, order and visibility.
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function updateCategory(_prev, formData) {
  const me = await requireAuth("content:write");
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailed(parsed.error);
  const { id, ...data } = parsed.data;
  return attempt(() => categoryService.updateCategory(id, data, me));
}
