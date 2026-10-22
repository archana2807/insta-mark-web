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
  // As in the theme's About hero: a narrow text column and a wide photo. Pages that carry a
  // longer lead or buttons get a slightly wider text column.
  const wideText = Boolean(lead || children);

  return (
    <section className="inner-hero" aria-labelledby="page-title">
      <div className="container-fluid px-0">
        <div className="row g-0 align-items-stretch">
          <div
            className={`${wideText ? "col-lg-5" : "col-lg-4"} inner-hero__text px-3 px-sm-4 px-lg-5`}
          >
            <div className="d-flex w-100 ps-xl-4">
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
          <div className={`${wideText ? "col-lg-7" : "col-lg-8"} order-first order-lg-last`}>
            {!image && fallback}
            {image && (
              <div className="inner-hero__media load-wipe">
                <ScrollDrift className="drift-fill" from={-40} to={40} scale={1.08}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    priority
                    sizes="(min-width: 992px) 58vw, 100vw"
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
