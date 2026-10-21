"use server";

import { attempt, firstIssue, validationFailed } from "@/server/errors/app-error";
import { requireAuth } from "@/server/auth/session";
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
  const me = await requireAuth("user:manage");
  const parsed = userCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailed(parsed.error);
  return attempt(() => userService.createUser(parsed.data, me));
}

/**
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function updateUser(_prev, formData) {
  const me = await requireAuth("user:manage");
  const parsed = userUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailed(parsed.error);
  return attempt(() => userService.updateUser(parsed.data, me));
}

/**
 * Admin sets a new password for a user (also unlocks the account).
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function resetUserPassword(_prev, formData) {
  const me = await requireAuth("user:manage");
  const parsed = userPasswordResetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstIssue(parsed.error);
  return attempt(() => userService.resetPassword(parsed.data.id, parsed.data.password, me));
}
