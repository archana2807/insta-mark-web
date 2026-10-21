import { z } from "zod";

const opt = (schema) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null)
    .pipe(schema.nullable());

const https = z.string().url().startsWith("https://", "Must start with https://").max(300);

export const settingsSchema = z.object({
  phone: opt(
    z
      .string()
      .max(30)
      .regex(/^[+\d][\d\s-]{6,}$/, "Enter a valid phone number"),
  ),
  whatsapp: opt(
    z.string().regex(/^\d{10,15}$/, "Digits only with country code, e.g. 919876543210"),
  ),
  email: opt(z.string().email().max(255)),
  addressLine1: opt(z.string().max(200)),
  city: opt(z.string().max(100)),
  state: opt(z.string().max(100)),
  mapEmbedUrl: opt(
    https.refine(
      (v) => v.startsWith("https://www.google.com/maps/embed"),
      "Use the Google Maps “Embed a map” URL",
    ),
  ),
  linkedin: opt(https),
  instagram: opt(https),
  facebook: opt(https),
  youtube: opt(https),
  establishedYear: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v, 10) : null))
    .pipe(z.number().int().min(1950).max(2100).nullable()),
});

/** @typedef {z.infer<typeof settingsSchema>} SettingsInput */
