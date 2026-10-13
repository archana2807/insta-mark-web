import InnerHero from "@/components/sections/InnerHero";
import EnquirySection from "@/components/sections/EnquirySection";
import { getCategories, getContactPageContent, getPageHeroImage, getSite } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact Us — Request a Quote",
  description:
    "Request a consultation or quote for architectural signage, wayfinding or road safety products. Insta Mark supports you from consultation to installation.",
  path: "/contact",
});

export default async function ContactPage() {
  const [page, site, categories, heroImage] = await Promise.all([
    getContactPageContent(),
    getSite(),
    getCategories(),
    getPageHeroImage("contact"),
  ]);
  const { address, mapEmbedUrl } = site.contact;

  return (
    <>
      <InnerHero
        label="Contact us"
        image={heroImage}
        title={page.title}
        lead={page.text}
        breadcrumbs={[{ label: "Contact", href: "/contact" }]}
      />
      <EnquirySection
        id="contact-form"
        title="Request a consultation"
        text={`Share your requirement and our team will get back to you. Head office: ${[address.line1, address.city, address.state].filter(Boolean).join(", ")}.`}
        categories={categories}
        contact={site.contact}
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
    </>
  );
}
