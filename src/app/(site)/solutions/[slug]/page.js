import Link from "next/link";
import { notFound } from "next/navigation";
import InnerHero from "@/components/sections/InnerHero";
import Gallery from "@/components/sections/Gallery";
import RingGallery from "@/components/sections/RingGallery";
import FaqSection from "@/components/sections/FaqSection";
import CtaBand from "@/components/sections/CtaBand";
import CategoryGrid from "@/components/sections/CategoryGrid";
import { CounterGrid } from "@/components/sections/CounterColumns";
import CardDeck from "@/components/sections/CardDeck";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import * as categoryService from "@/server/modules/categories/category.service";
import * as pageSectionService from "@/server/modules/page-sections/page-section.service";
import { pageMetadata, serviceJsonLd } from "@/lib/seo";
import { pad2, toList } from "@/lib/format";
import Icon from "@/components/ui/Icon";
import BtnText from "@/components/ui/BtnText";

// Unknown slugs 404 via notFound() below. Do NOT set `dynamicParams = false`:
// with it, Next.js 15 answers on-demand revalidation (revalidateTag after an
// admin edit) with NoFallbackError and the page starts returning 404.
export const dynamicParams = true;

export async function generateStaticParams() {
  const categories = await categoryService.listCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await pageSectionService.getCategoryPage(slug);
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
 * site photos → a call to action to the Contact page form.
 */
export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = await pageSectionService.getCategoryPage(slug);
  if (!category) notFound();

  const relatedCovers = Object.fromEntries(
    await Promise.all(
      category.related.map(async (c) => [
        c.slug,
        await categoryService.getCategoryCoverImage(c.slug),
      ]),
    ),
  );

  // Industries from the client's text; photos for the first three come from this solution's
  // own work (executed first, then the catalogue, then the cover images).
  const industries = toList(category.applications);
  const usedPhotos = [
    ...new Map(
      [...category.executedImages, ...category.catalogueImages, ...category.heroImages].map(
        (img) => [img.src, img],
      ),
    ).values(),
  ].slice(0, 7);

  return (
    <>
      {/* 1. Hero: only the title and a real project photo, laid out like the home banner */}
      <InnerHero
        title={category.name}
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
      />

      {/* 2. Overview — the client's paragraph for this solution, word for word, under the
          document's own heading; it comes first in the document, before Key Features */}
      <section className="section pb-0" aria-labelledby="overview-title">
        <div className="container">
          <div className="row g-4 g-lg-5">
            <Reveal className="col-lg-5">
              <SectionHeading title={<span id="overview-title">Overview</span>} />
            </Reveal>
            <Reveal className="col-lg-7" delay={120}>
              <p className="mb-0">{category.overview}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* What you get — the theme's counter columns: feature on top, big number below */}
      <section className="section pb-0" aria-labelledby="features-title">
        <div className="container">
          <SectionHeading className="mb-6" title={<span id="features-title">What you get</span>} />
          <CounterGrid
            items={category.features.map((f, i) => ({ label: f, value: pad2(i + 1) }))}
            colClass="col-6 col-lg"
            arrow={false}
          />
        </div>
      </section>

      {/* Where it is used — a fanned photo deck on the left (client, 24 Oct 2026), every
          industry with a + icon on the right */}
      <section className="section" aria-labelledby="used-title">
        <div className="container">
          <div className="row align-items-center g-4 g-lg-5">
            {usedPhotos.length > 0 && (
              <div className="col-lg-6">
                <CardDeck
                  images={usedPhotos.map((photo) => ({ ...photo, alt: photo.alt ?? "" }))}
                  label={`${category.name} photos`}
                />
              </div>
            )}
            <Reveal className={usedPhotos.length > 0 ? "col-lg-6" : "col-lg-8"}>
              <SectionHeading
                title={<span id="used-title">Where it is used</span>}
                text={category.applications}
              />
              <Reveal as="ul" effect="flip-y" stagger={80} className="used-list mt-5">
                {industries.map((a) => (
                  <li key={a}>
                    <Icon name="plus-lg" />
                    {a}
                  </li>
                ))}
              </Reveal>
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
              title={<span id="catalogue-title">Our {category.name.toLowerCase()} range</span>}
            />
            <Gallery images={category.catalogueImages} label={`${category.name} product range`} />
          </div>
        </section>
      )}

      {/* Executed work */}
      {category.executedImages.length > 0 && (
        <section className="section pb-5" id="work" aria-labelledby="work-title">
          <div className="container">
            <SectionHeading
              className="mb-6"
              title={<span id="work-title">Our work on site</span>}
              text={`Real ${category.name.toLowerCase()} projects designed, manufactured and installed by Insta Mark.`}
            />
          </div>
          <RingGallery
            images={category.executedImages}
            label={`${category.name} executed projects`}
          />
        </section>
      )}

      {/* Call to Action from the client's document; the form itself is on the Contact page */}
      <CtaBand
        title={`Looking for reliable ${category.name} solutions?`}
        text="Contact Insta Mark today for expert consultation and a customized quotation."
        requirement={category.name}
      />

      <FaqSection faqs={category.faqs} />

      {category.related.length > 0 && (
        <section className="section pt-0" aria-labelledby="related-title">
          <div className="container">
            <SectionHeading
              className="mb-6"
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
