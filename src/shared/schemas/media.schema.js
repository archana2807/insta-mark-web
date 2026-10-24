import { z } from "zod";
import { IMAGE_TYPES } from "../constants.js";
import { id } from "./fields.js";

/** Which gallery an image belongs to. */
export const galleryKindSchema = z.enum(["category"]);

/**
 * Cloudinary upload response, as sent back by the browser.
 * @param {string} folderPrefix public_id must start with this
 * @param {boolean} [strictUrl] require a valid URL (galleries) or only the prefix (logos)
 */
export const cloudinaryUploadSchema = (folderPrefix, strictUrl = true) =>
  z.object({
    public_id: z.string().startsWith(folderPrefix),
    version: z.union([z.number(), z.string()]),
    signature: z.string(),
    secure_url: strictUrl
      ? z.string().url().startsWith("https://res.cloudinary.com/")
      : z.string().startsWith("https://res.cloudinary.com/"),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    format: z.string().max(10),
    bytes: z.number().int().nonnegative(),
  });

export const galleryUploadSchema = cloudinaryUploadSchema("insta-mark/");

export const imageRefSchema = z.object({ kind: galleryKindSchema, id: id() });

export const imageUpdateSchema = imageRefSchema.extend({
  alt: z.string().trim().min(5, "Alt text should describe the photo (5+ characters).").max(255),
  type: z.enum(IMAGE_TYPES).optional(),
});

export const imageMoveSchema = imageRefSchema.extend({ direction: z.enum(["up", "down"]) });

/** @typedef {z.infer<typeof galleryUploadSchema>} CloudinaryUpload */
/** @typedef {z.infer<typeof imageUpdateSchema>} ImageUpdateInput */
