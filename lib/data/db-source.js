// Database source (Prisma). Every read is cached with tags (lib/data/tags.js)
// so pages stay static and fast; admin edits revalidate only what changed.
// Queries follow docs/database-design.md §6.

import { unstable_cache } from "next/cache";
import { getPrisma } from "@/lib/db";
import { site as siteDefaults } from "@/content/site";
import { enumToGroup } from "@/content/categories";
import { TAGS, REVALIDATE_SECONDS } from "./tags";

const cached = (fn, key, tags) =>
  unstable_cache(fn, ["db", ...key], { tags, revalidate: REVALIDATE_SECONDS });

const toImage = (asset) =>
  asset && { src: asset.url, width: asset.width, height: asset.height, alt: asset.alt };

const assetSelect = { url: true, width: true, height: true, alt: true };

const categorySelect = {
  slug: true,
  name: true,
  group: true,
  icon: true,
  shortDescription: true,
  overview: true,
  features: true,
  applications: true,
  seoTitle: true,
  seoDescription: true,
};

const toCategory = (row) => ({
  ...row,
  group: enumToGroup[row.group] ?? "architectural",
  icon: row.icon ?? "signpost",
  features: Array.isArray(row.features) ? row.features : [],
  seoTitle: row.seoTitle ?? undefined,
  seoDescription: row.seoDescription ?? undefined,
});

const loadCategories = cached(
  async () => {
    const prisma = await getPrisma();
    const rows = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: categorySelect,
    });
    return rows.map(toCategory);
  },
  ["categories"],
  [TAGS.categories],
);

const loadCategoryImages = (slug) =>
  cached(
    async () => {
      const prisma = await getPrisma();
      const rows = await prisma.categoryImage.findMany({
        where: { category: { slug } },
        orderBy: { sortOrder: "asc" },
        select: { type: true, asset: { select: assetSelect } },
      });
      return {
        catalogue: rows.filter((r) => r.type === "CATALOGUE").map((r) => toImage(r.asset)),
        executed: rows.filter((r) => r.type === "EXECUTED").map((r) => toImage(r.asset)),
      };
    },
    ["category-images", slug],
    [TAGS.gallery, TAGS.category(slug)],
  )();

const loadIndustries = cached(
  async () => {
    const prisma = await getPrisma();
    return prisma.industry.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { name: true, icon: true },
    });
  },
  ["industries"],
  [TAGS.industries],
);

/** categorySlug → that page's FAQs; "home" → general FAQs ticked for the home page; else general. */
const loadFaqs = (scope) =>
  cached(
    async () => {
      const prisma = await getPrisma();
      const where =
        scope === "home"
          ? { categoryId: null, showOnHome: true }
          : scope
            ? { category: { slug: scope } }
            : { categoryId: null };
      return prisma.faq.findMany({
        where: { isActive: true, ...where },
        orderBy: { sortOrder: "asc" },
        select: { question: true, answer: true },
      });
    },
    ["faqs", scope ?? "global"],
    [TAGS.faqs, ...(scope && scope !== "home" ? [TAGS.category(scope)] : [])],
  )();

const loadSettings = cached(
  async () => {
    const prisma = await getPrisma();
    const rows = await prisma.siteSetting.findMany({ select: { key: true, value: true } });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  },
  ["settings"],
  [TAGS.settings],
);

const projectListSelect = {
  slug: true,
  title: true,
  clientName: true,
  city: true,
  year: true,
  isFeatured: true,
  coverImage: { select: assetSelect },
  images: { orderBy: { sortOrder: "asc" }, take: 1, select: { asset: { select: assetSelect } } },
  categories: { select: { category: { select: { slug: true, name: true } } } },
};

const toProject = (p) => ({
  slug: p.slug,
  title: p.title,
  clientName: p.clientName,
  city: p.city,
  year: p.year,
  isFeatured: p.isFeatured,
  description: p.description ?? null,
  industry: p.industry?.name ?? null,
  cover: toImage(p.coverImage ?? p.images?.[0]?.asset) ?? null,
  categories: p.categories.map((c) => c.category),
  images: p.images.map((i) => toImage(i.asset)),
});

const loadProjects = cached(
  async () => {
    const prisma = await getPrisma();
    const rows = await prisma.project.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      select: projectListSelect,
    });
    return rows.map(toProject);
  },
  ["projects"],
  [TAGS.projects],
);

const loadProject = (slug) =>
  cached(
    async () => {
      const prisma = await getPrisma();
      const p = await prisma.project.findFirst({
        where: { slug, isActive: true },
        select: {
          ...projectListSelect,
          description: true,
          industry: { select: { name: true } },
          images: { orderBy: { sortOrder: "asc" }, select: { asset: { select: assetSelect } } },
        },
      });
      return p ? toProject(p) : null;
    },
    ["project", slug],
    [TAGS.projects, TAGS.project(slug)],
  )();

const loadClientLogos = cached(
  async () => {
    const prisma = await getPrisma();
    const rows = await prisma.clientLogo.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { name: true, websiteUrl: true, logo: { select: assetSelect } },
    });
    return rows.map((r) => ({ name: r.name, websiteUrl: r.websiteUrl, logo: toImage(r.logo) }));
  },
  ["clients"],
  [TAGS.clients],
);

export const dbSource = {
  name: "database",

  /** Site settings from `site_settings`, falling back to /content defaults. */
  async site() {
    const s = await loadSettings();
    const pick = (key, fallback) => ((s[key] ?? null) !== null ? s[key] : fallback);
    const d = siteDefaults;
    return {
      ...d,
      establishedYear: pick("company.establishedYear", d.establishedYear),
      contact: {
        phone: pick("contact.phone", d.contact.phone),
        whatsapp: pick("contact.whatsapp", d.contact.whatsapp),
        email: pick("contact.email", d.contact.email),
        address: { ...d.contact.address, ...(pick("contact.address", {}) ?? {}) },
        mapEmbedUrl: pick("contact.mapEmbedUrl", d.contact.mapEmbedUrl),
      },
      social: { ...d.social, ...(pick("social", {}) ?? {}) },
    };
  },

  categories: () => loadCategories(),
  categoryImages: (slug) => loadCategoryImages(slug),
  industries: () => loadIndustries(),
  faqs: (categorySlug) => loadFaqs(categorySlug),
  projects: () => loadProjects(),
  project: (slug) => loadProject(slug),
  clientLogos: () => loadClientLogos(),
};
