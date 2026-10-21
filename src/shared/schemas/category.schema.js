import { z } from "zod";
import { CATEGORY_GROUPS } from "../constants.js";
import { CHOOSABLE_ICONS } from "../../components/ui/icons.generated.js";
import { checkbox, id, optionalText } from "./fields.js";

const lines = (v) =>
  String(v ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

export const categorySchema = z.object({
  id: id(),
  name: z.string().trim().min(2).max(100),
  shortDescription: z.string().trim().min(10).max(300),
  group: z.enum(CATEGORY_GROUPS),
  icon: z
    .string()
    .trim()
    .refine((v) => !v || CHOOSABLE_ICONS.includes(v), "Pick an icon from the list")
    .transform((v) => v || null),
  overview: z.string().trim().min(20).max(4000),
  features: z
    .string()
    .transform(lines)
    .pipe(z.array(z.string().max(120)).min(1, "Add at least one feature").max(12)),
  applications: z.string().trim().min(10).max(2000),
  seoTitle: optionalText(70),
  seoDescription: optionalText(160),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: checkbox(),
});

/** @typedef {z.infer<typeof categorySchema>} CategoryInput */
