import Image from "next/image";
import Link from "next/link";
import { breadcrumbJsonLd } from "@/lib/seo";
import ScrollDrift from "@/components/ui/ScrollDrift";

/**
 * Inner-page hero, laid out like the home banner (client, 23 Oct 2026): the title (and the
 * lead, if any) in the left column, never on the photo, and the photo on the right. No
 * vertical label. Same columns and left padding as the home banner, so all heroes line up.
 * @param {{ title: string, lead?: string, image?: { src: string, alt: string },
 *   fallback?: import("react").ReactNode, breadcrumbs?: { label: string, href: string }[],
 *   children?: import("react").ReactNode }} props
 * @returns {JSX.Element}
 */
export default function InnerHero({
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
          <div className="col-lg-5 inner-hero__text px-3 px-sm-4 px-lg-5">
            <div className="w-100 ps-xl-4">
              <div className="load-stagger">
                <h1 id="page-title">{title}</h1>
                {lead && <p className="inner-hero__lead">{lead}</p>}
                {children}
              </div>
            </div>
          </div>
          <div className="col-lg-7 order-first order-lg-last">
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
