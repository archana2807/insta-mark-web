"use server";

import { attempt, validationFailed } from "@/server/errors/app-error";
import { redirect } from "next/navigation";
import { requireAuth } from "@/server/auth/session";
import { projectSchema } from "@/shared/schemas/project.schema";
import * as projectService from "./project.service";

/** @param {FormData} formData */
function parse(formData) {
  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  const categoryIds = formData.getAll("categoryIds").map(String).filter(Boolean);
  return { parsed, categoryIds };
}

/**
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function createProject(_prev, formData) {
  const me = await requireAuth("content:write");
  const { parsed, categoryIds } = parse(formData);
  if (!parsed.success) return validationFailed(parsed.error);
  const result = await attempt(async () => ({
    id: await projectService.createProject(parsed.data, categoryIds, me),
  }));
  if (!("id" in result)) return result;
  redirect(`/admin/projects/${result.id}?created=1`);
}

/**
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function updateProject(_prev, formData) {
  const me = await requireAuth("content:write");
  const id = String(formData.get("id") ?? "");
  const { parsed, categoryIds } = parse(formData);
  if (!parsed.success) return validationFailed(parsed.error);
  return attempt(() => projectService.updateProject(id, parsed.data, categoryIds, me));
}

/**
 * @param {FormData} formData
 * @returns {Promise<void>}
 */
export async function deleteProject(formData) {
  const me = await requireAuth("content:write");
  const id = String(formData.get("id") ?? "");
  const deleted = await projectService.deleteProject(id, me);
  redirect(deleted ? "/admin/projects?deleted=1" : "/admin/projects");
}
