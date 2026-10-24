import * as categoryService from "@/server/modules/categories/category.service";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap() {
  // No Projects pages (deleted at the client's request, 24 Oct 2026).
  const categories = await categoryService.listCategories();
  const now = new Date();

  const pages = [
    { path: "/", priority: 1 },
    { path: "/solutions", priority: 0.9 },
    { path: "/about", priority: 0.7 },
    { path: "/contact", priority: 0.8 },
    { path: "/privacy-policy", priority: 0.2 },
  ];

  return [
    ...pages.map((p) => ({ url: absoluteUrl(p.path), lastModified: now, priority: p.priority })),
    ...categories.map((c) => ({
      url: absoluteUrl(`/solutions/${c.slug}`),
      lastModified: now,
      priority: 0.9,
    })),
  ];
}
