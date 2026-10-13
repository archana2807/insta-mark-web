import { z } from "zod";
import { cleanField, normalizePhone, validateField } from "./enquiry-rules";

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
