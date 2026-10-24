// Cache tags for database reads. Services wrap reads with cached() and call the
// revalidate helpers after every write, so only the affected pages rebuild.
import "server-only";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

export const TAGS = {
  categories: "categories",
  category: (slug) => `category:${slug}`,
  gallery: "gallery",
  industries: "industries",
  faqs: "faqs",
  settings: "settings",
  clients: "clients",
  home: "home", // home banner (site_settings home.banner)
};

/** Safety net: cached DB reads also expire after this many seconds. */
export const REVALIDATE_SECONDS = 3600;

/**
 * Cached, tagged database read.
 * @template {(...args: never[]) => Promise<unknown>} T
 * @param {T} fn
 * @param {string[]} key
 * @param {string[]} tags
 * @returns {T}
 */
export const cached = (fn, key, tags) =>
  unstable_cache(fn, ["db", ...key], { tags, revalidate: REVALIDATE_SECONDS });

/** @param {string} path admin or public path to re-render */
export function revalidatePage(path) {
  revalidatePath(path);
}

/** @param {string | null | undefined} slug */
export function revalidateCategory(slug) {
  revalidateTag(TAGS.categories);
  if (slug) revalidateTag(TAGS.category(slug));
}

/** @param {string | null | undefined} slug */
export function revalidateGallery(slug) {
  revalidateTag(TAGS.gallery);
  if (slug) revalidateTag(TAGS.category(slug));
}

/** @param {string | null | undefined} categorySlug */
export function revalidateFaqs(categorySlug) {
  revalidateTag(TAGS.faqs);
  if (categorySlug) revalidateTag(TAGS.category(categorySlug));
}

export function revalidateClients() {
  revalidateTag(TAGS.clients);
}

export function revalidateHome() {
  revalidateTag(TAGS.home);
}

export function revalidateSettings() {
  revalidateTag(TAGS.settings);
}
