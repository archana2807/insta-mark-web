// Page copy for the public site. Long-form company copy (hero, about, process…) still
// comes from /content (D5: the page_sections table comes later); this service combines
// it with data from the other modules.
import "server-only";
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
import * as bannerService from "@/server/modules/banner/banner.service";
import * as categoryService from "@/server/modules/categories/category.service";
import * as clientLogoService from "@/server/modules/client-logos/client-logo.service";
import * as faqService from "@/server/modules/faqs/faq.service";
import * as industryService from "@/server/modules/industries/industry.service";

export async function getNavigation() {
  return mainNav;
}

/**
 * Everything the category page needs in one call.
 * @param {string} slug
 * @returns {Promise<object | null>} null for an unknown slug (page renders notFound())
 */
export async function getCategoryPage(slug) {
  const categories = await categoryService.listCategories();
  const index = categories.findIndex((c) => c.slug === slug);
  if (index === -1) return null;

  const category = categories[index];
  const [images, heroImages, categoryFaqs, globalFaqs] = await Promise.all([
    categoryService.getCategoryImages(slug),
    categoryService.getCategoryPhotos(slug, 2),
    faqService.listFaqs(slug),
    faqService.listFaqs(),
  ]);
  return {
    ...category,
    number: index + 1,
    heroImages, // the cover chosen in admin first (R-8.2)
    catalogueImages: images.catalogue,
    executedImages: images.executed,
    faqs: categoryFaqs.length ? categoryFaqs : globalFaqs,
    related: categories.filter((c) => c.slug !== slug && c.group === category.group).slice(0, 3),
  };
}

export async function getHomeContent() {
  const [industries, faqs, clientLogos, banner] = await Promise.all([
    industryService.listIndustries(),
    faqService.listFaqs("home"),
    clientLogoService.listClientLogos(),
    bannerService.getBanner(),
  ]);
  return {
    ...home,
    featured,
    whyChooseUs,
    workingProcess,
    industries,
    faqs,
    clientLogos,
    banner, // null until an admin uploads one (fallback: featured.hero)
  };
}

export async function getAboutContent() {
  const [industries, categories] = await Promise.all([
    industryService.listIndustries(),
    categoryService.listCategories(),
  ]);
  return {
    ...about,
    industries,
    // The client's six About-page items (R-5.3). Titles only: no invented text.
    whyChooseRows: about.whyChooseUs.map((title) => ({ title })),
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

/**
 * Photo for the inner-page hero.
 * @param {"about" | "solutions" | "projects" | "contact"} page
 */
export async function getPageHeroImage(page) {
  return featured.pages[page] ?? null;
}

export async function getProjectsPageContent() {
  return projectsPage;
}

export async function getContactPageContent() {
  return contactPage;
}
