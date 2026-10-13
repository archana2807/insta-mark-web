// Cache tags for database reads. Admin mutations call revalidateTag() with
// these (see lib/admin/revalidate.js) so only the affected pages rebuild.

export const TAGS = {
  categories: "categories",
  category: (slug) => `category:${slug}`,
  gallery: "gallery",
  industries: "industries",
  faqs: "faqs",
  settings: "settings",
  projects: "projects",
  project: (slug) => `project:${slug}`,
  clients: "clients",
};

/** Safety net: cached DB reads also expire after this many seconds. */
export const REVALIDATE_SECONDS = 3600;
