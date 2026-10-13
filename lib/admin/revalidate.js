// Maps admin edits to cache tags so the public site updates without redeploy.

import { revalidatePath, revalidateTag } from "next/cache";
import { TAGS } from "@/lib/data/tags";

export function revalidateCategory(slug) {
  revalidateTag(TAGS.categories);
  if (slug) revalidateTag(TAGS.category(slug));
}

export function revalidateGallery(slug) {
  revalidateTag(TAGS.gallery);
  if (slug) revalidateTag(TAGS.category(slug));
}

export function revalidateProjects(slug) {
  revalidateTag(TAGS.projects);
  if (slug) revalidateTag(TAGS.project(slug));
  revalidatePath("/sitemap.xml");
}

export function revalidateFaqs(categorySlug) {
  revalidateTag(TAGS.faqs);
  if (categorySlug) revalidateTag(TAGS.category(categorySlug));
}

export function revalidateClients() {
  revalidateTag(TAGS.clients);
}

export function revalidateSettings() {
  revalidateTag(TAGS.settings);
}
