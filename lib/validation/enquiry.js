import { z } from "zod";

/**
 * Normalises Indian/international phone input to E.164.
 * "98765 43210" | "098765-43210" | "+91 98765 43210" → "+919876543210"
 * Returns null when it cannot be normalised.
 */
export function normalizePhone(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+")) return digits.length >= 10 && digits.length <= 15 ? `+${digits}` : null;
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return null;
}

const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters.`)
    .optional()
    .transform((v) => (v ? v : undefined));

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100, "Name is too long."),
  company: optionalText(150),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Please enter your email.")
    .email("Please enter a valid email address.")
    .max(255),
  phone: z
    .string()
    .trim()
    .min(1, "Please enter your phone number.")
    .transform((v, ctx) => {
      const phone = normalizePhone(v);
      if (!phone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid phone number.",
        });
        return z.NEVER;
      }
      return phone;
    }),
  projectLocation: optionalText(150),
  requirement: optionalText(150),
  message: optionalText(2000),
  category: optionalText(100), // category slug when submitted from a category page
  sourcePage: optionalText(255),
  utmSource: optionalText(100),
  utmMedium: optionalText(100),
  utmCampaign: optionalText(100),
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
