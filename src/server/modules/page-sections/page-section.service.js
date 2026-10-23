// Page copy for the public site. Long-form company copy (hero, about, process…) still
// comes from /content (D5: the page_sections table comes later); this service combines
// it with data from the other modules.
import "server-only";
import { featured } from "@/content/gallery";
import { mainNav, statsPlaceholders } from "@/content/site";
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

/**
 * The call to action in the site footer (the same text on every page).
 * @returns {Promise<typeof home.cta>}
 */
export async function getFooterCta() {
  return home.cta;
}

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

/**
 * The counters shown on Home and About, counted from real content (never invented figures).
 * @param {{ length: number }} categories
 * @param {{ length: number }} industries
 * @returns {{ value: number, label: string }[]}
 */
function realCounters(categories, industries) {
  return [
    { value: categories.length, label: "Signage & road safety solution categories" },
    { value: industries.length, label: "Industries and sectors served" },
    {
      value: about.manufacturing.capabilities.length,
      label: "In-house manufacturing capabilities",
    },
    { value: about.process.length, label: "Steps from discovery to after-sales support" },
  ];
}

export async function getHomeContent() {
  const [industries, categories, faqs, clientLogos, banner] = await Promise.all([
    industryService.listIndustries(),
    categoryService.listCategories(),
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
    // Five counters in the row under the banner, where the logos were (client, 23 Oct
    // 2026). The first three are sample numbers until the client confirms them.
    stats: [
      { value: statsPlaceholders.projectsDelivered, label: "Projects Delivered" },
      { value: statsPlaceholders.yearsOfExperience, label: "Years of Experience" },
      { value: statsPlaceholders.locationsCovered, label: "Locations Covered" },
      { value: categories.length, label: "Solutions & Applications" },
      { value: industries.length, label: "Industries Served" },
    ],
    // The About page counters, below that row (client, 23 Oct 2026).
    counters: realCounters(categories, industries),
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
    // Cards of the About page carousel: the photo, the solution's real name and its page.
    carouselItems: featured.aboutCarousel
      .map(({ slug, image }) => {
        const category = categories.find((c) => c.slug === slug);
        return category
          ? { src: image.src, alt: image.alt, label: category.name, href: `/solutions/${slug}` }
          : null;
      })
      .filter(Boolean),
    heroImage: featured.pages.about,
    featureImage: featured.aboutFeature,
    counters: realCounters(categories, industries),
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
