import { z } from "zod";
import { BANNER } from "../constants.js";
import { cloudinaryUploadSchema } from "./media.schema.js";

export const bannerSlotSchema = z.enum(["desktop", "mobile"]);

export const bannerUploadSchema = cloudinaryUploadSchema("insta-mark/banner/");

export const bannerAltSchema = z.object({
  alt: z.string().trim().min(5, "Describe the banner image (5+ characters).").max(255),
});

/**
 * Checks an image against the banner minimum for its slot.
 * @param {"desktop" | "mobile"} slot
 * @param {number} width
 * @param {number} height
 * @returns {string | null} message for the admin, or null when big enough
 */
export function checkBannerSize(slot, width, height) {
  const s = BANNER[slot];
  if (width >= s.minWidth && height >= s.minHeight) return null;
  return `The ${slot} banner is ${width} × ${height} px. Upload at least ${s.minWidth} × ${s.minHeight} px (recommended ${s.width} × ${s.height} px).`;
}

/** @typedef {z.infer<typeof bannerSlotSchema>} BannerSlot */
