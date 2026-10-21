"use server";

import { attempt, validationFailed } from "@/server/errors/app-error";
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
  if (!parsed.success) return validationFailed(parsed.error);
  return attempt(() => settingService.saveSettings(parsed.data, me));
}
