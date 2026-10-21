// Small Zod building blocks used by several admin schemas.
import { z } from "zod";

/**
 * Optional trimmed text; empty → null.
 * @param {number} max
 */
export const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

/** HTML checkbox: "on" → true, missing → false. */
export const checkbox = () => z.preprocess((v) => v === "on", z.boolean());

/** Non-empty id from a hidden form field. */
export const id = () => z.string().min(1);
