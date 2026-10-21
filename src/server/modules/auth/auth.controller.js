"use server";

import { attempt, validationFailed } from "@/server/errors/app-error";
import { redirect } from "next/navigation";
import { requireAuth } from "@/server/auth/session";
import { requestMeta } from "@/server/request";
import { loginSchema, passwordChangeSchema } from "@/shared/schemas/auth.schema";
import * as authService from "./auth.service";

/**
 * Admin login form (public).
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function login(_prev, formData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  const { ipHash } = await requestMeta();
  const result = await attempt(() =>
    authService.login(parsed.success ? parsed.data : null, ipHash),
  );
  if ("redirectTo" in result) redirect(result.redirectTo);
  // Keep the email in the form (never the password).
  const email = parsed.success ? parsed.data.email : String(formData.get("email") ?? "");
  return { ...result, email };
}

/** @returns {Promise<void>} */
export async function logout() {
  await authService.logout();
  redirect("/admin/login");
}

/**
 * Sign out on every device (all tokens of this user stop working).
 * @returns {Promise<void>}
 */
export async function logoutEverywhere() {
  const me = await requireAuth();
  await authService.logoutEverywhere(me);
  redirect("/admin/login");
}

/**
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function changeOwnPassword(_prev, formData) {
  const me = await requireAuth();
  const parsed = passwordChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailed(parsed.error);
  return attempt(() => authService.changeOwnPassword(me, parsed.data));
}
