import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "../constants.js";
import { checkbox, id } from "./fields.js";

const password = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(200);

const role = z.enum(["ADMIN", "EDITOR"]);

export const userCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(255),
  role,
  password,
});

export const userUpdateSchema = z.object({
  id: id(),
  name: z.string().trim().min(2).max(100),
  role,
  isActive: checkbox(),
});

export const userPasswordResetSchema = z.object({ id: id(), password });

/** @typedef {z.infer<typeof userCreateSchema>} UserCreateInput */
/** @typedef {z.infer<typeof userUpdateSchema>} UserUpdateInput */
