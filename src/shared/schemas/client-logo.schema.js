import { z } from "zod";
import { checkbox } from "./fields.js";
import { cloudinaryUploadSchema } from "./media.schema.js";

export const clientLogoSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(150),
  websiteUrl: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => v || null)
    .refine((v) => !v || /^https?:\/\//.test(v), "Website must start with http:// or https://"),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: checkbox(),
});

export const clientLogoUploadSchema = cloudinaryUploadSchema("insta-mark/clients/", false);

/** @typedef {z.infer<typeof clientLogoSchema>} ClientLogoInput */
