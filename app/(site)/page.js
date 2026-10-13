import Link from "next/link";
import HomeHero from "@/components/sections/HomeHero";
import AboutIntro from "@/components/sections/AboutIntro";
import StatsLine from "@/components/sections/StatsLine";
import CategoryGrid from "@/components/sections/CategoryGrid";
import ProcessSteps from "@/components/sections/ProcessSteps";
import IconGrid from "@/components/sections/IconGrid";
import Gallery from "@/components/sections/Gallery";
import LogoStrip from "@/components/sections/LogoStrip";
import FaqSection from "@/components/sections/FaqSection";
import CtaPanel from "@/components/sections/CtaPanel";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import {
  getCategories,
  getCategoryCoverImage,
  getExecutedWork,
  getHomeContent,
  getSite,
} from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import Icon from "@/components/ui/Icon";

export const metadata = pageMetadata({
  title: null,
  description:
    "Architectural signage, wayfinding and road safety solutions — designed, manufactured and installed by Insta Mark for projects across India.",
  path: "/",
});

export default async function HomePage() {
  const [home, site, categories, work] = await Promise.all([
    getHomeContent(),
    getSite(),
    getCategories(),
    getExecutedWork(),
  ]);
  const covers = Object.fromEntries(
    await Promise.all(categories.map(async (c) => [c.slug, await getCategoryCoverImage(c.slug)])),
  );
  // One photo from each category with work, then fill up to 9.
  const recentWork = [
    ...work.map((g) => g.images[1] ?? g.images[0]),
    ...work.flatMap((g) => g.images.slice(2, 4)),
  ].slice(0, 9);

  const stats = home.whyChooseUs.filter((w) =>
    ["End-to-End Expertise", "Premium Manufacturing", "Nationwide Service"].includes(w.title),
  );

  return (
    <>
      {/* 1. Banner */}
      <HomeHero
        hero={home.hero}
        image={home.featured.hero}
        establishedYear={site.establishedYear}
      />

      {/* 2. About */}
      <AboutIntro about={home.about} images={home.featured.about} />
      <StatsLine items={stats} />

      {/* 3. Products — category grid */}
      <section className="section pt-0" aria-labelledby="solutions-title">
        <div className="container">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-4 mb-6">
            <SectionHeading
              eyebrow="Our solutions"
              title={<span id="solutions-title">Signage & safety solutions for every space</span>}
              text="Click a category to see what we make, real projects we have executed, and to request a quote."
            />
            <Link href="/solutions" className="btn btn-outline-ink btn-lg flex-shrink-0">
              View all solutions <Icon name="arrow-right" />
            </Link>
          </div>
          <CategoryGrid categories={categories} covers={covers} />
        </div>
      </section>

      {/* Statement */}
      <section className="statement-band py-5" aria-hidden="true">
        <p>{home.hero.title}</p>
      </section>

      {/* 4. Working process */}
      <section className="section" aria-labelledby="process-title">
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
      <section className="section bg-surface" aria-labelledby="industries-title">
        <div className="container">
          <SectionHeading
            className="mb-6"
            eyebrow="Industries we serve"
            title={<span id="industries-title">Sectors we cater to</span>}
          />
          <IconGrid items={home.industries} />
        </div>
      </section>

      {/* 6. Pictures — executed work */}
      <section className="section" aria-labelledby="work-title">
        <div className="container">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-4 mb-6">
            <SectionHeading
              eyebrow={home.trustedBy.title}
              title={<span id="work-title">Executed on site, across India</span>}
              text={home.trustedBy.text}
            />
            <Link href="/projects" className="btn btn-dark btn-lg flex-shrink-0">
              See all projects <Icon name="arrow-right" />
            </Link>
          </div>
          <Gallery images={recentWork} label="Recent executed work" />
          <LogoStrip logos={home.clientLogos} />
        </div>
      </section>

      <section className="quote-band section-sm text-center" aria-label="Our promise">
        <Reveal className="container">
          <blockquote>“{home.quote}”</blockquote>
        </Reveal>
      </section>

      <FaqSection faqs={home.faqs} />
      <CtaPanel cta={home.cta} />
    </>
  );
}
