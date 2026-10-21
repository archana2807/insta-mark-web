import { z } from "zod";
import { slugify } from "../../lib/slug.js";
import { checkbox, optionalText } from "./fields.js";

export const projectSchema = z.object({
  title: z.string().trim().min(3, "Title is required.").max(150),
  slug: z
    .string()
    .trim()
    .optional()
    .transform((v) => slugify(v ?? "")),
  clientName: optionalText(150),
  city: optionalText(100),
  state: optionalText(100),
  year: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v, 10) : null))
    .pipe(z.number().int().min(1990).max(2100).nullable()),
  industryId: optionalText(40),
  description: optionalText(5000),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isFeatured: checkbox(),
  isActive: checkbox(),
});

/** @typedef {z.infer<typeof projectSchema>} ProjectInput */
