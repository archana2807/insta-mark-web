import { getCategories, getProjects } from "@/lib/data";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap() {
  const [categories, projects] = await Promise.all([getCategories(), getProjects()]);
  const now = new Date();

  const pages = [
    { path: "/", priority: 1 },
    { path: "/solutions", priority: 0.9 },
    { path: "/projects", priority: 0.8 },
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
    ...projects.map((p) => ({
      url: absoluteUrl(`/projects/${p.slug}`),
      lastModified: now,
      priority: 0.6,
    })),
  ];
}
