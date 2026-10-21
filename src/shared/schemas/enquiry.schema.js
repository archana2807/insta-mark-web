import { z } from "zod";
import { ENQUIRY_STATUSES } from "../constants.js";
import { cleanField, normalizePhone, validateField } from "./enquiry-rules.js";

export { normalizePhone };

/**
 * One form field: sanitise (NFC, strip invisible chars, collapse spaces), then
 * apply the shared rule from enquiry-rules.js. Empty optional values → undefined.
 */
const field = (name) =>
  z
    .preprocess((v) => cleanField(name, typeof v === "string" ? v : ""), z.string())
    .superRefine((v, ctx) => {
      const message = validateField(name, v);
      if (message) ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    })
    .transform((v) => (v === "" ? undefined : v));

/** Hidden/context fields: sanitised and length-capped, never shown to users. */
const meta = (max) =>
  z
    .preprocess((v) => cleanField("meta", typeof v === "string" ? v : "").slice(0, max), z.string())
    .transform((v) => (v === "" ? undefined : v));

export const enquirySchema = z.object({
  name: field("name"),
  company: field("company"),
  email: field("email").transform((v) => v.toLowerCase()),
  phone: field("phone").transform((v) => normalizePhone(v)),
  projectLocation: field("projectLocation"),
  requirement: field("requirement"),
  message: field("message"),
  category: meta(100), // category slug when submitted from a category page
  sourcePage: meta(255),
  utmSource: meta(100),
  utmMedium: meta(100),
  utmCampaign: meta(100),
});

/** Field names rendered by the form (used to echo values back on error). */
export const enquiryFields = [
  "name",
  "company",
  "email",
  "phone",
  "projectLocation",
  "requirement",
  "message",
];

// Admin follow-up

export const enquiryUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(ENQUIRY_STATUSES),
  assignedToId: z
    .string()
    .optional()
    .transform((v) => v || null),
});

export const enquiryNoteSchema = z.object({
  enquiryId: z.string().min(1),
  body: z.string().trim().min(1, "Write a note first.").max(2000),
});

/** @typedef {z.infer<typeof enquirySchema>} EnquiryInput */
/** @typedef {z.infer<typeof enquiryUpdateSchema>} EnquiryUpdateInput */
