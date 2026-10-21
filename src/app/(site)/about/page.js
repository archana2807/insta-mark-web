import Image from "next/image";
import Link from "next/link";
import InnerHero from "@/components/sections/InnerHero";
import StatementBadge from "@/components/sections/StatementBadge";
import CounterColumns from "@/components/sections/CounterColumns";
import OverlapFeature from "@/components/sections/OverlapFeature";
import RowList from "@/components/sections/RowList";
import ProcessSteps from "@/components/sections/ProcessSteps";
import IconGrid from "@/components/sections/IconGrid";
import LogoStrip from "@/components/sections/LogoStrip";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/ui/Icon";
import * as pageSectionService from "@/server/modules/page-sections/page-section.service";
import { pageMetadata } from "@/lib/seo";
import BtnText from "@/components/ui/BtnText";

export const metadata = pageMetadata({
  title: "About Us",
  description:
    "Insta Mark is an architectural signage and road safety solutions company delivering end-to-end design, engineering, manufacturing and installation across India.",
  path: "/about",
});

/** Layout follows the Crafto "Branding Agency – About" page (own code, client copy). */
export default async function AboutPage() {
  const [about, home] = await Promise.all([
    pageSectionService.getAboutContent(),
    pageSectionService.getHomeContent(),
  ]);

  return (
    <>
      {/* 1. Hero: vertical label + title over a large photo */}
      <InnerHero
        label="About Insta Mark"
        title="We design, build and install signage that guides."
        image={about.heroImage}
        breadcrumbs={[{ label: "About", href: "/about" }]}
      />

      {/* 2. Statement + badge + who we are */}
      <StatementBadge
        line1="Signage that"
        line2="guides."
        badgeText="Design · Manufacture · Install · Pan India · "
        icon="signpost-split"
        text={about.whoWeAre}
      />

      {/* 3. Real counts from the content */}
      <CounterColumns items={about.counters} />

      {/* 4. Collage + vision & mission */}
      <section className="section pt-0" aria-labelledby="vision-title">
        <div className="container">
          <div className="row align-items-center g-4 g-lg-5">
            <div className="col-lg-6">
              <div className="about-collage">
                {about.featuredImages.map((img, i) => (
                  <Reveal
                    effect="wipe"
                    delay={i * 200}
                    className="about-collage__item"
                    key={img.src}
                  >
                    <Image src={img.src} alt={img.alt} fill sizes="(min-width: 992px) 25vw, 50vw" />
                  </Reveal>
                ))}
              </div>
            </div>
            <Reveal className="col-lg-5 offset-lg-1">
              <h2 id="vision-title" className="h3 mb-4">
                {about.vision}
              </h2>
              <h3 className="h6 text-uppercase fw-bold text-ink mb-2">Mission</h3>
              <p className="mb-5">{about.mission}</p>
              <div className="d-flex flex-wrap gap-3">
                <Link href="/contact" className="btn btn-dark btn-lg">
                  <Icon name="envelope" /> <BtnText>Let’s talk</BtnText>
                </Link>
                <Link href="/solutions" className="btn btn-outline-ink btn-lg">
                  <Icon name="grid" /> <BtnText>Our solutions</BtnText>
                </Link>
              </div>
            </Reveal>
          </div>
          <LogoStrip logos={home.clientLogos} />
        </div>
      </section>

      {/* 5. Manufacturing: image left, heading overlapping */}
      <OverlapFeature
        id="mfg-title"
        title="Precision-made in our own facility."
        intro={about.manufacturing.title}
        text={about.manufacturing.text}
        image={about.featureImage}
        tags={about.manufacturing.capabilities}
        highlight={{ icon: "shield-check", text: about.manufacturing.quality }}
      />

      {/* 6. Why choose us: heading left, rows right */}
      <RowList
        id="why-title"
        title="We work with developers and architects to make every space clear and safe."
        rows={about.whyChooseRows}
      />

      {/* 7. Solutions overview rows */}
      <RowList
        id="solutions-title"
        className="section bg-surface"
        title="Solutions under one roof."
        rows={about.solutions}
      />

      {/* 8. Industries */}
      <section className="section" aria-labelledby="industries-title">
        <div className="container">
          <SectionHeading
            className="mb-6"
            title={<span id="industries-title">Built for every sector</span>}
            text={about.industriesApproach}
          />
          <IconGrid items={about.industries} />
        </div>
      </section>

      {/* 9. Process */}
      <section className="section bg-surface" aria-labelledby="process-title">
        <div className="container">
          <SectionHeading
            className="mb-6"
            title={<span id="process-title">From discovery to support</span>}
          />
          <ProcessSteps steps={about.process} />
        </div>
      </section>

    </>
  );
}
