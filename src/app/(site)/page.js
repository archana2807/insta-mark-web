import Link from "next/link";
import HomeHero from "@/components/sections/HomeHero";
import AboutIntro from "@/components/sections/AboutIntro";
import CategoryGrid from "@/components/sections/CategoryGrid";
import ProcessSteps from "@/components/sections/ProcessSteps";
import IconGrid from "@/components/sections/IconGrid";
import Gallery from "@/components/sections/Gallery";
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
 * Order agreed in the client meeting ("follow the flow of my catalogue"):
 * banner → 1–2 line about → all products → working process → sectors →
 * ending with pictures. Longer copy (why choose us, FAQs) lives on About,
 * Contact and the category pages.
 */
export default async function HomePage() {
  const [home, categories, work] = await Promise.all([
    pageSectionService.getHomeContent(),
    categoryService.listCategories(),
    categoryService.listExecutedWork(),
  ]);
  const covers = Object.fromEntries(
    await Promise.all(
      categories.map(async (c) => [c.slug, await categoryService.getCategoryCoverImage(c.slug)]),
    ),
  );
  // One photo from each category with work, then fill up to 9.
  const recentWork = [
    ...work.map((g) => g.images[1] ?? g.images[0]),
    ...work.flatMap((g) => g.images.slice(2, 4)),
  ].slice(0, 9);

  return (
    <>
      {/* 1. Banner + tagline */}
      <HomeHero hero={home.hero} image={home.featured.hero} banner={home.banner} />

      {/* Project logos — right under the banner (client feedback 21 Oct 2026) */}
      <ProjectLogos logos={home.projectLogos} />

      {/* 2. About — photo collage left, company text right */}
      <AboutIntro about={home.about} images={home.featured.about} />

      {/* 3. Products — the most important part */}
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
          <CategoryGrid categories={categories} covers={covers} />
        </div>
      </section>

      {/* 4. Working process — survey, design, manufacture, install */}
      <section className="section bg-surface" aria-labelledby="process-title">
        <div className="container">
          <SectionHeading
            className="mb-6"
            eyebrow="How we work"
            title={<span id="process-title">{home.workingProcess.title}</span>}
            text={home.workingProcess.text}
          />
          <ProcessSteps steps={home.workingProcess.steps} />
        </div>
      </section>

      {/* 5. Sectors */}
      <section className="section" aria-labelledby="industries-title">
        <div className="container">
          <SectionHeading
            className="mb-6"
            eyebrow="Industries we serve"
            title={<span id="industries-title">Sectors we cater to</span>}
          />
          <IconGrid items={home.industries} />
        </div>
      </section>

      {/* 6. Ending with pictures — executed work */}
      <section className="section bg-surface" aria-labelledby="work-title">
        <div className="container">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-4 mb-6">
            <SectionHeading
              eyebrow={home.trustedBy.title}
              title={<span id="work-title">Executed on site, across India</span>}
              text={home.trustedBy.text}
            />
            <Link href="/projects" className="btn btn-dark btn-lg flex-shrink-0">
              <BtnText>See all projects</BtnText> <Icon name="arrow-right" />
            </Link>
          </div>
          <Gallery images={recentWork} label="Recent executed work" />
          <LogoStrip logos={home.clientLogos} />
        </div>
      </section>

      <CtaPanel cta={home.cta} />
    </>
  );
}
