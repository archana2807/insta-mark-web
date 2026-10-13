// Data access layer. Pages and components read data ONLY through these
// functions. The source is chosen once:
//   - DATABASE_URL set  → PostgreSQL via Prisma (cached + tagged, see db-source.js)
//   - otherwise         → static /content (see content-source.js)
// Long-form company copy (hero, about, process…) always comes from /content.

import { categoryGroups } from "@/content/categories";
import { featured } from "@/content/gallery";
import { mainNav } from "@/content/site";
import {
  home,
  whyChooseUs,
  workingProcess,
  about,
  projectsPage,
  contactPage,
} from "@/content/company";
import { isDatabaseConfigured } from "@/lib/db";
import { contentSource } from "./content-source";
import { dbSource } from "./db-source";

const source = () => (isDatabaseConfigured() ? dbSource : contentSource);

export function getDataSourceName() {
  return source().name;
}

export async function getSite() {
  return source().site();
}

export async function getNavigation() {
  return mainNav;
}

export async function getCategories() {
  return source().categories();
}

export async function getCategoriesByGroup() {
  const categories = await getCategories();
  return Object.entries(categoryGroups).map(([key, label]) => ({
    key,
    label,
    items: categories.filter((c) => c.group === key),
  }));
}

/**
 * Everything the category page needs in one call.
 * Returns null for an unknown slug (page renders notFound()).
 */
export async function getCategoryPage(slug) {
  const categories = await getCategories();
  const index = categories.findIndex((c) => c.slug === slug);
  if (index === -1) return null;

  const category = categories[index];
  const [images, categoryFaqs, globalFaqs] = await Promise.all([
    source().categoryImages(slug),
    source().faqs(slug),
    source().faqs(),
  ]);
  return {
    ...category,
    number: index + 1,
    heroImages: images.executed.slice(0, 2),
    catalogueImages: images.catalogue,
    executedImages: images.executed,
    faqs: categoryFaqs.length ? categoryFaqs : globalFaqs,
    related: categories.filter((c) => c.slug !== slug && c.group === category.group).slice(0, 3),
  };
}

export async function getCategoryCoverImage(slug) {
  const images = await source().categoryImages(slug);
  return images.executed[0] ?? images.catalogue[0] ?? null;
}

/** Executed work grouped by category for the Projects page. */
export async function getExecutedWork() {
  const categories = await getCategories();
  const groups = await Promise.all(
    categories.map(async (c) => ({
      category: c,
      images: (await source().categoryImages(c.slug)).executed,
    })),
  );
  return groups.filter((g) => g.images.length > 0);
}

/** Named projects (added in admin). Empty until the client's projects are entered. */
export async function getProjects() {
  return source().projects();
}

export async function getProject(slug) {
  return source().project(slug);
}

export async function getClientLogos() {
  return source().clientLogos();
}

export async function getHomeContent() {
  const [industries, faqs, clientLogos] = await Promise.all([
    source().industries(),
    source().faqs("home"),
    source().clientLogos(),
  ]);
  return { ...home, featured, whyChooseUs, workingProcess, industries, faqs, clientLogos };
}

export async function getAboutContent() {
  const [industries, categories] = await Promise.all([source().industries(), getCategories()]);
  return {
    ...about,
    industries,
    whyChooseRows: whyChooseUs,
    featuredImages: featured.about,
    heroImage: featured.pages.about,
    featureImage: featured.aboutFeature,
    // Counted from real content — never invented figures.
    counters: [
      { value: categories.length, label: "Signage & road safety solution categories" },
      { value: industries.length, label: "Industries and sectors served" },
      {
        value: about.manufacturing.capabilities.length,
        label: "In-house manufacturing capabilities",
      },
      { value: about.process.length, label: "Steps from discovery to after-sales support" },
    ],
  };
}

/** Photo for the inner-page hero ("about" | "solutions" | "projects" | "contact"). */
export async function getPageHeroImage(page) {
  return featured.pages[page] ?? null;
}

export async function getProjectsPageContent() {
  return projectsPage;
}

export async function getContactPageContent() {
  return contactPage;
}
