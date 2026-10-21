import Link from "next/link";
import HomeHero from "@/components/sections/HomeHero";
import AboutIntro from "@/components/sections/AboutIntro";
import ProductMosaic from "@/components/sections/ProductMosaic";
import TextMarquee from "@/components/sections/TextMarquee";
import LogoWall from "@/components/sections/LogoWall";
import ProcessSteps from "@/components/sections/ProcessSteps";
import IconGrid from "@/components/sections/IconGrid";
import LogoStrip from "@/components/sections/LogoStrip";
import ProjectLogos from "@/components/sections/ProjectLogos";
import CtaPanel from "@/components/sections/CtaPanel";
import SectionHeading from "@/components/ui/SectionHeading";
import * as categoryService from "@/server/modules/categories/category.service";
import * as pageSectionService from "@/server/modules/page-sections/page-section.service";
import { pageMetadata } from "@/lib/seo";
import Icon from "@/components/ui/Icon";
import BtnText from "@/components/ui/BtnText";

export const metadata = pageMetadata({
  title: null,
  description:
    "Architectural signage, wayfinding and road safety solutions — designed, manufactured and installed by Insta Mark for projects across India.",
  path: "/",
});

/**
 * Order (client feedback 21 Oct 2026, Crafto "Branding Agency" flow): banner → project
 * logos → About → scrolling line → products → industries → working process → trusted by
 * (all project logos) → call to action. Longer copy (why choose us, FAQs) lives on About,
 * Contact and the category pages.
 */
export default async function HomePage() {
  const [home, categories] = await Promise.all([
    pageSectionService.getHomeContent(),
    categoryService.listCategories(),
  ]);
  const covers = Object.fromEntries(
    await Promise.all(
      categories.map(async (c) => [c.slug, await categoryService.getCategoryCoverImage(c.slug)]),
    ),
  );

  return (
    <>
      {/* 1. Banner + tagline */}
      <HomeHero hero={home.hero} image={home.featured.hero} banner={home.banner} />

      {/* Five project logos right under the banner */}
      <ProjectLogos logos={home.projectLogos.slice(0, 5)} />

      {/* 2. About — photo collage left, company text right */}
      <AboutIntro about={home.about} images={home.featured.about} />

      {/* Big line that scrolls across the page */}
      <TextMarquee text={home.marquee} />

      {/* 3. Products — photo mosaic */}
      <section className="section pt-4" aria-labelledby="solutions-title">
        <div className="container">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-4 mb-6">
            <SectionHeading
              eyebrow="Our products"
              title={<span id="solutions-title">Signage & road safety solutions</span>}
              text="Click a category to see the products, real projects we have executed, and to request a quote."
            />
            <Link href="/solutions" className="btn btn-outline-ink btn-lg flex-shrink-0">
              <BtnText>View all solutions</BtnText> <Icon name="arrow-right" />
            </Link>
          </div>
          <ProductMosaic categories={categories} covers={covers} />
        </div>
      </section>

      {/* 4. Industries we serve — straight after the products */}
      <section className="section bg-surface" aria-labelledby="industries-title">
        <div className="container">
          <SectionHeading
            className="mb-6"
            title={<span id="industries-title">Industries we serve</span>}
          />
          <IconGrid items={home.industries} />
        </div>
      </section>

      {/* 5. Working process — survey, design, manufacture, install */}
      <section className="section" aria-labelledby="process-title">
        <div className="container">
          <SectionHeading
            className="mb-6"
            title={<span id="process-title">{home.workingProcess.title}</span>}
            text={home.workingProcess.text}
          />
          <ProcessSteps steps={home.workingProcess.steps} />
        </div>
      </section>

      {/* 6. Trusted by leading brands — logos of our projects */}
      <section className="section bg-surface" aria-labelledby="trusted-title">
        <div className="container">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-4 mb-6">
            <SectionHeading
              title={<span id="trusted-title">{home.trustedBy.title}</span>}
              text={home.trustedBy.text}
            />
            <Link href="/projects" className="btn btn-dark btn-lg flex-shrink-0">
              <BtnText>See all projects</BtnText> <Icon name="arrow-right" />
            </Link>
          </div>
          <LogoWall logos={home.projectLogos} />
          <LogoStrip logos={home.clientLogos} />
        </div>
      </section>

      <CtaPanel cta={home.cta} />
    </>
  );
}
