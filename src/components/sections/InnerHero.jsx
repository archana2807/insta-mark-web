import Image from "next/image";
import Link from "next/link";
import { breadcrumbJsonLd } from "@/lib/seo";
import FancyText from "@/components/ui/FancyText";
import ScrollDrift from "@/components/ui/ScrollDrift";

/**
 * Inner-page hero (theme "About" layout): vertical label + breadcrumb + large
 * title on the left, a big photo on the right that the title overlaps.
 */
export default function InnerHero({
  label,
  title,
  lead,
  image,
  fallback,
  breadcrumbs = [],
  children,
}) {
  const trail = [{ label: "Home", href: "/" }, ...breadcrumbs];

  return (
    <section className="inner-hero" aria-labelledby="page-title">
      <div className="container-fluid px-0">
        <div className="row g-0 align-items-stretch">
          <div className="col-lg-5 inner-hero__text px-3 px-sm-4 px-lg-5">
            <div className="d-flex w-100 ps-xl-4">
              {label && (
                <div className="inner-hero__vertical" aria-hidden="true">
                  <FancyText text={label} />
                </div>
              )}
              <div className="load-stagger">
                <nav aria-label="Breadcrumb">
                  <ol className="breadcrumb">
                    {trail.map((b, i) =>
                      i === trail.length - 1 ? (
                        <li className="breadcrumb-item active" aria-current="page" key={b.label}>
                          {b.label}
                        </li>
                      ) : (
                        <li className="breadcrumb-item" key={b.label}>
                          <Link href={b.href}>{b.label}</Link>
                        </li>
                      ),
                    )}
                  </ol>
                </nav>
                <h1 id="page-title">{title}</h1>
                {lead && <p className="inner-hero__lead">{lead}</p>}
                {children}
              </div>
            </div>
          </div>
          <div className="col-lg-7">
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
