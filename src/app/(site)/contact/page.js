import InnerHero from "@/components/sections/InnerHero";
import EnquirySection from "@/components/sections/EnquirySection";
import FaqSection from "@/components/sections/FaqSection";
import OfficeColumns from "@/components/sections/OfficeColumns";
import { officePlaceholders } from "@/content/site";
import * as categoryService from "@/server/modules/categories/category.service";
import * as pageSectionService from "@/server/modules/page-sections/page-section.service";
import * as settingService from "@/server/modules/settings/setting.service";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact Us — Request a Quote",
  description:
    "Request a consultation or quote for architectural signage, wayfinding or road safety products. Insta Mark supports you from consultation to installation.",
  path: "/contact",
});

/**
 * @param {{ searchParams: Promise<{ requirement?: string }> }} props
 * @returns {Promise<JSX.Element>}
 */
export default async function ContactPage({ searchParams }) {
  const { requirement } = await searchParams;
  const [page, site, categories, heroImage, formPhoto, home] = await Promise.all([
    pageSectionService.getContactPageContent(),
    settingService.getSite(),
    categoryService.listCategories(),
    pageSectionService.getPageHeroImage("contact"),
    pageSectionService.getPageHeroImage("contactForm"),
    pageSectionService.getHomeContent(),
  ]);
  // A Call to Action on a solution or project page links here with ?requirement=<name>.
  const chosen = categories.find((c) => c.name === requirement);
  const { mapEmbedUrl, address, email, phone } = site.contact;
  // The head office uses the real details from Admin → Settings once they are set; until
  // then (and for the other offices) the sample data from content/site.js is shown.
  const realAddress = address.line1
    ? [address.line1, address.city, address.state].filter(Boolean).join(", ")
    : null;
  const [head, ...others] = officePlaceholders;
  const offices = [
    {
      ...head,
      address: realAddress ?? head.address,
      email: email || head.email,
      phone: phone || head.phone,
    },
    ...others,
  ];

  return (
    <>
      <InnerHero
        image={heroImage}
        title={page.title}
        lead={page.text}
        breadcrumbs={[{ label: "Contact", href: "/contact" }]}
      />
      <OfficeColumns offices={offices} />
      <EnquirySection
        id="contact-form"
        title="Request a consultation"
        categories={categories}
        contact={site.contact}
        photo={formPhoto}
        defaultRequirement={chosen?.name}
        categorySlug={chosen?.slug}
      />
      {mapEmbedUrl && (
        <section aria-label="Office location">
          <iframe
            title="Insta Mark office location"
            src={mapEmbedUrl}
            width="100%"
            height="420"
            style={{ border: 0, display: "block" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </section>
      )}
      <FaqSection faqs={home.faqs} />
    </>
  );
}
