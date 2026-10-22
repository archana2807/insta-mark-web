import Image from "next/image";
import Link from "next/link";
import { breadcrumbJsonLd } from "@/lib/seo";
import FancyText from "@/components/ui/FancyText";
import ScrollDrift from "@/components/ui/ScrollDrift";

/**
 * Inner-page hero (theme "About" layout): vertical label + large
 * title on the left, a big photo on the right that the title overlaps.
 */
export default function InnerHero({
  label,
  title,
  lead,
  image,
  fallback,
  breadcrumbs = [], // not shown (client, 22 Oct 2026); still sent to search engines as JSON-LD
  children,
}) {
  const trail = [{ label: "Home", href: "/" }, ...breadcrumbs];
  return (
    <section className="inner-hero" aria-labelledby="page-title">
      <div className="container-fluid px-0">
        <div className="row g-0 align-items-stretch">
          <div className="col-xl-4 col-lg-5 inner-hero__text">
            <div className="d-flex w-100">
              {label && (
                <div className="inner-hero__vertical" aria-hidden="true">
                  <FancyText text={label} />
                </div>
              )}
              <div className="load-stagger">
                <h1 id="page-title">{title}</h1>
                {lead && <p className="inner-hero__lead">{lead}</p>}
                {children}
              </div>
            </div>
          </div>
          <div className="col-xl-8 col-lg-7 order-first order-lg-last">
            {!image && fallback}
            {image && (
              <div className="inner-hero__media load-wipe">
                {/* Reference: "liquid parallax", scale 1.05, the photo moves at 0.2 × the scroll speed. */}
                <ScrollDrift
                  className="drift-fill drift-fill--parallax"
                  from={-203}
                  to={110}
                  scale={1.049}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    priority
                    sizes="(min-width: 1200px) 67vw, (min-width: 992px) 58vw, 100vw"
                  />
                </ScrollDrift>
              </div>
            )}
          </div>
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd(trail) }}
      />
    </section>
  );
}
