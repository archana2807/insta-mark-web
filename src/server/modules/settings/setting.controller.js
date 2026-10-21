"use server";

import { requireAuth } from "@/server/auth/session";
import { settingsSchema } from "@/shared/schemas/setting.schema";
import * as settingService from "./setting.service";

/**
 * Save contact details, socials and founding year (admins only).
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function saveSettings(_prev, formData) {
  const me = await requireAuth("settings:write");
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  return settingService.saveSettings(parsed.data, me);
}
