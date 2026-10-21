"use server";

import { attempt, firstIssue, validationFailed } from "@/server/errors/app-error";
import { LEAD_COOKIE } from "@/shared/constants";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAuth } from "@/server/auth/session";
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
  const meta = await requestMeta();
  const result = await attempt(() =>
    enquiryService.submitEnquiry({
      honeypot: String(formData.get("website") ?? ""),
      fillMs: formData.get("fillMs") === null ? null : String(formData.get("fillMs")),
      raw,
      parsed: enquirySchema.safeParse(raw),
      turnstileToken: formData.get("cf-turnstile-response"),
      meta,
    }),
  );
  if ("redirectTo" in result) {
    // Only a real lead may count as a GA4 conversion on the thank-you page.
    if (result.lead) {
      (await cookies()).set(LEAD_COOKIE.name, "1", {
        path: LEAD_COOKIE.path,
        maxAge: LEAD_COOKIE.maxAgeSeconds,
        sameSite: "lax",
        // Holds no secret (just "1"); not Secure / HttpOnly so TrackLead can read it.
        secure: false,
        httpOnly: false,
      });
    }
    redirect(result.redirectTo);
  }
  // Echo the visible fields back so nothing the visitor typed is lost.
  const values = Object.fromEntries(enquiryFields.map((f) => [f, String(formData.get(f) ?? "")]));
  return { status: "error", ...result, values };
}

/**
 * Status and owner.
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function updateEnquiry(_prev, formData) {
  const me = await requireAuth("enquiry:update");
  const parsed = enquiryUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };
  return attempt(() => enquiryService.updateEnquiry(parsed.data, me));
}

/**
 * Internal note.
 * @param {unknown} _prev
 * @param {FormData} formData
 */
export async function addEnquiryNote(_prev, formData) {
  const me = await requireAuth("enquiry:update");
  const parsed = enquiryNoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstIssue(parsed.error);
  return attempt(() => enquiryService.addNote(parsed.data, me));
}
