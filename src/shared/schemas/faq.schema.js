import { z } from "zod";
import { checkbox } from "./fields.js";

export const faqSchema = z.object({
  question: z.string().trim().min(5, "Question is too short.").max(300),
  answer: z.string().trim().min(2, "Answer is required.").max(3000),
  categoryId: z
    .string()
    .optional()
    .transform((v) => v || null),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  showOnHome: checkbox(),
  isActive: checkbox(),
});

/** @typedef {z.infer<typeof faqSchema>} FaqInput */
