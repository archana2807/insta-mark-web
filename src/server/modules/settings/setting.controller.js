"use server";

import { requireAdmin } from "@/server/auth/session";
import { ROLES } from "@/shared/constants";
import { settingsSchema } from "@/shared/schemas/setting.schema";
import * as settingService from "./setting.service";

/**
 * Save contact details, socials and founding year (admins only).
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function saveSettings(_prev, formData) {
  const me = await requireAdmin({ role: ROLES.ADMIN });
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  return settingService.saveSettings(parsed.data, me);
}
