"use server";

import { requireAdmin } from "@/server/auth/session";
import { ROLES } from "@/shared/constants";
import {
  userCreateSchema,
  userPasswordResetSchema,
  userUpdateSchema,
} from "@/shared/schemas/user.schema";
import * as userService from "./user.service";

/**
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function createUser(_prev, formData) {
  const me = await requireAdmin({ role: ROLES.ADMIN });
  const parsed = userCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  return userService.createUser(parsed.data, me);
}

/**
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function updateUser(_prev, formData) {
  const me = await requireAdmin({ role: ROLES.ADMIN });
  const parsed = userUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  return userService.updateUser(parsed.data, me);
}

/**
 * Admin sets a new password for a user (also unlocks the account).
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function resetUserPassword(_prev, formData) {
  const me = await requireAdmin({ role: ROLES.ADMIN });
  const parsed = userPasswordResetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return userService.resetPassword(parsed.data.id, parsed.data.password, me);
}
