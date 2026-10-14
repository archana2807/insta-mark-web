import Link from "next/link";
import { notFound } from "next/navigation";
import InnerHero from "@/components/sections/InnerHero";
import Gallery from "@/components/sections/Gallery";
import FaqSection from "@/components/sections/FaqSection";
import EnquirySection from "@/components/sections/EnquirySection";
import CategoryGrid from "@/components/sections/CategoryGrid";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import { getCategories, getCategoryCoverImage, getCategoryPage, getSite } from "@/lib/data";
import { pageMetadata, serviceJsonLd } from "@/lib/seo";
import { toList } from "@/lib/format";
import Icon from "@/components/ui/Icon";

// Unknown slugs 404 via notFound() below. Do NOT set `dynamicParams = false`:
// with it, Next.js 15 answers on-demand revalidation (revalidateTag after an
// admin edit) with NoFallbackError and the page starts returning 404.
export const dynamicParams = true;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await getCategoryPage(slug);
  if (!category) return {};
  return pageMetadata({
    title: category.seoTitle ?? `${category.name} Manufacturer & Installer`,
    description: category.seoDescription ?? category.shortDescription,
    path: `/solutions/${slug}`,
    image: category.heroImages[0],
  });
}

/**
 * Category template (meeting): content first → catalogue images → executed
 * site photos → enquiry form on the same page.
 */
export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const [category, site, categories] = await Promise.all([
    getCategoryPage(slug),
    getSite(),
    getCategories(),
  ]);
  if (!category) notFound();

  const relatedCovers = Object.fromEntries(
    await Promise.all(
      category.related.map(async (c) => [c.slug, await getCategoryCoverImage(c.slug)]),
    ),
  );

  return (
    <>
      {/* 1. Write-up (client's content) with a real project photo */}
      <InnerHero
        label={`Solution ${String(category.number).padStart(2, "0")}`}
        title={category.name}
        lead={category.overview}
        image={category.heroImages[0]}
        fallback={
          <div className="category-hero__placeholder h-100" aria-hidden="true">
            <Icon name={category.icon} />
          </div>
        }
        breadcrumbs={[
          { label: "Solutions", href: "/solutions" },
          { label: category.name, href: `/solutions/${category.slug}` },
        ]}
      >
        <div className="d-flex flex-wrap gap-3 mt-4">
          <Link href="#enquiry" className="btn btn-dark btn-lg">
            Get a quote <Icon name="arrow-right" />
          </Link>
          {category.executedImages.length > 0 && (
            <Link href="#work" className="btn btn-outline-ink btn-lg">
              See our work
            </Link>
          )}
        </div>
      </InnerHero>

      {/* Key features + applications */}
      <section className="section bg-surface" aria-labelledby="features-title">
        <div className="container">
          <div className="row g-4 g-lg-5">
            <Reveal className="col-lg-5">
              <SectionHeading
                eyebrow="Key features"
                title={<span id="features-title">What you get</span>}
              />
              <ul className="check-list mt-4">
                {category.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </Reveal>
            <Reveal className="col-lg-6 offset-lg-1" delay={120}>
              <SectionHeading eyebrow="Applications" title="Where it is used" />
              <p className="mt-4 mb-4">{category.applications}</p>
              <ul className="tag-list">
                {toList(category.applications).map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Catalogue images (product profiles) — shown once supplied */}
      {category.catalogueImages.length > 0 && (
        <section className="section" aria-labelledby="catalogue-title">
          <div className="container">
            <SectionHeading
              className="mb-6"
              eyebrow="Product range"
              title={<span id="catalogue-title">Our {category.name.toLowerCase()} range</span>}
            />
            <Gallery images={category.catalogueImages} label={`${category.name} product range`} />
          </div>
        </section>
      )}

      {/* Executed work */}
      {category.executedImages.length > 0 && (
        <section className="section" id="work" aria-labelledby="work-title">
          <div className="container">
            <SectionHeading
              className="mb-6"
              eyebrow="Executed projects"
              title={<span id="work-title">Our work on site</span>}
              text={`Real ${category.name.toLowerCase()} projects designed, manufactured and installed by Insta Mark.`}
            />
            <Gallery
              images={category.executedImages}
              label={`${category.name} executed projects`}
            />
          </div>
        </section>
      )}

      <EnquirySection
        title={`Looking for reliable ${category.name} solutions?`}
        text="Contact Insta Mark today for expert consultation and a customized quotation."
        categories={categories}
        defaultRequirement={category.name}
        categorySlug={category.slug}
        contact={site.contact}
      />

      <FaqSection faqs={category.faqs} />

      {category.related.length > 0 && (
        <section className="section pt-0" aria-labelledby="related-title">
          <div className="container">
            <SectionHeading
              className="mb-6"
              eyebrow="Explore more"
              title={<span id="related-title">Related solutions</span>}
            />
            <CategoryGrid
              categories={category.related}
              covers={relatedCovers}
              showNumbers={false}
            />
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serviceJsonLd(category) }}
      />
    </>
  );
}
