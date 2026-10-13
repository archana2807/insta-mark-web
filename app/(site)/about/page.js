import Image from "next/image";
import PageHero from "@/components/sections/PageHero";
import ProcessSteps from "@/components/sections/ProcessSteps";
import IconGrid from "@/components/sections/IconGrid";
import CtaPanel from "@/components/sections/CtaPanel";
import SectionHeading from "@/components/ui/SectionHeading";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/ui/Reveal";
import { getAboutContent, getHomeContent } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import Icon from "@/components/ui/Icon";

export const metadata = pageMetadata({
  title: "About Us",
  description:
    "Insta Mark is an architectural signage and road safety solutions company delivering end-to-end design, engineering, manufacturing and installation across India.",
  path: "/about",
});

export default async function AboutPage() {
  const [about, home] = await Promise.all([getAboutContent(), getHomeContent()]);
  const [imgA, imgB] = about.featuredImages;

  return (
    <>
      <PageHero
        eyebrow="Who we are"
        title="Signage that guides, safety that lasts"
        lead={about.whoWeAre}
        breadcrumbs={[{ label: "About", href: "/about" }]}
      />

      {/* Vision & mission */}
      <section className="pb-7">
        <div className="container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6">
              <div className="category-hero__images">
                {[imgA, imgB].map((img) => (
                  <div className="img-wrap" key={img.src}>
                    <Image src={img.src} alt={img.alt} fill sizes="(min-width: 992px) 28vw, 50vw" />
                  </div>
                ))}
              </div>
            </div>
            <div className="col-lg-5 offset-lg-1">
              <Reveal className="mb-5">
                <Eyebrow>Vision</Eyebrow>
                <p className="h4 fw-medium text-ink lh-base">{about.vision}</p>
              </Reveal>
              <Reveal delay={120}>
                <Eyebrow>Mission</Eyebrow>
                <p className="h4 fw-medium text-ink lh-base">{about.mission}</p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Why choose us + solutions */}
      <section className="section bg-surface" aria-labelledby="why-title">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-5">
              <SectionHeading
                eyebrow="Why choose us"
                title={<span id="why-title">Why clients choose Insta Mark</span>}
              />
              <ul className="check-list mt-4">
                {about.whyChooseUs.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
            <div className="col-lg-6 offset-lg-1">
              <Eyebrow>Solutions</Eyebrow>
              {about.solutions.map((s, i) => (
                <Reveal key={s.title} delay={i * 100} className="py-4 border-bottom">
                  <h3 className="h4">{s.title}</h3>
                  <p className="mb-0">{s.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="section" aria-labelledby="industries-title">
        <div className="container">
          <SectionHeading
            className="mb-6"
            eyebrow="Industries we serve"
            title={<span id="industries-title">Built for every sector</span>}
            text={about.industriesApproach}
          />
          <IconGrid items={about.industries} />
        </div>
      </section>

      {/* Manufacturing */}
      <section className="section bg-surface" aria-labelledby="mfg-title">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-5">
              <SectionHeading
                eyebrow="Manufacturing excellence"
                title={<span id="mfg-title">{about.manufacturing.title}</span>}
                text={about.manufacturing.text}
              />
              <p className="mt-4 mb-0 fw-medium text-ink">
                <Icon name="shield-check" className="me-2 text-primary" />
                {about.manufacturing.quality}
              </p>
            </div>
            <div className="col-lg-6 offset-lg-1">
              <h3 className="h5 mb-4">Capabilities</h3>
              <ul className="tag-list">
                {about.manufacturing.capabilities.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Process (5 steps) */}
      <section className="section" aria-labelledby="process-title">
        <div className="container">
          <SectionHeading
            className="mb-6"
            eyebrow="Our process"
            title={<span id="process-title">From discovery to support</span>}
          />
          <ProcessSteps steps={about.process} />
        </div>
      </section>

      <CtaPanel cta={home.cta} />
    </>
  );
}
