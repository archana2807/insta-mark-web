// Static source: reads /content. Used when no database is configured
// (local dev, CI, previews without a DB).

import { categories } from "@/content/categories";
import { gallery } from "@/content/gallery";
import { site } from "@/content/site";
import { industries, faqs } from "@/content/company";

export const contentSource = {
  name: "content",

  async site() {
    return site;
  },

  async categories() {
    return categories;
  },

  async categoryImages(slug) {
    return { catalogue: [], executed: gallery[slug] ?? [] };
  },

  async industries() {
    return industries;
  },

  async faqs(scope) {
    return scope && scope !== "home" ? [] : faqs;
  },

  // Named projects and client logos only exist once added in the admin panel.
  async projects() {
    return [];
  },

  async project() {
    return null;
  },

  async clientLogos() {
    return [];
  },
};
