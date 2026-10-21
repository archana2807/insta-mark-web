import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "../constants.js";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
  next: z.string().optional(),
});

export const passwordChangeSchema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
      .max(200),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match.",
  });

/** @typedef {z.infer<typeof loginSchema>} LoginInput */
/** @typedef {z.infer<typeof passwordChangeSchema>} PasswordChangeInput */
