"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth/session";
import { requestMeta } from "@/server/request";
import {
  enquiryFields,
  enquiryNoteSchema,
  enquirySchema,
  enquiryUpdateSchema,
} from "@/shared/schemas/enquiry.schema";
import * as enquiryService from "./enquiry.service";

/**
 * Public enquiry form (contact page + category pages).
 * @param {unknown} _prevState
 * @param {FormData} formData
 */
export async function submitEnquiry(_prevState, formData) {
  const raw = Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string"));
  const result = await enquiryService.submitEnquiry({
    honeypot: String(formData.get("website") ?? ""),
    fillMs: formData.get("fillMs") === null ? null : String(formData.get("fillMs")),
    raw,
    parsed: enquirySchema.safeParse(raw),
    values: Object.fromEntries(enquiryFields.map((f) => [f, String(formData.get(f) ?? "")])),
    turnstileToken: formData.get("cf-turnstile-response"),
    meta: await requestMeta(),
  });
  if ("redirectTo" in result) redirect(result.redirectTo);
  return result;
}

/**
 * Status and owner.
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function updateEnquiry(_prev, formData) {
  const me = await requireAdmin();
  const parsed = enquiryUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid input." };
  return enquiryService.updateEnquiry(parsed.data, me);
}

/**
 * Internal note.
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function addEnquiryNote(_prev, formData) {
  const me = await requireAdmin();
  const parsed = enquiryNoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return enquiryService.addNote(parsed.data, me);
}
