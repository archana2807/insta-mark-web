"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth/session";
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
  const result = await authService.login(parsed.success ? parsed.data : null, {
    email: String(formData.get("email") ?? ""),
    ipHash,
  });
  if ("redirectTo" in result) redirect(result.redirectTo);
  return result;
}

/** @returns {Promise<void>} */
export async function logout() {
  await authService.logout();
  redirect("/admin/login");
}

/**
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function changeOwnPassword(_prev, formData) {
  const me = await requireAdmin();
  const parsed = passwordChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  return authService.changeOwnPassword(me, parsed.data);
}
