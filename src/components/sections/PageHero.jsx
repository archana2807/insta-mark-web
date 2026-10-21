import Link from "next/link";
import { breadcrumbJsonLd } from "@/lib/seo";

/** Inner-page header with breadcrumb (+ BreadcrumbList JSON-LD). */
export default function PageHero({ title, lead, breadcrumbs = [], children }) {
  const trail = [{ label: "Home", href: "/" }, ...breadcrumbs];

  return (
    <section className="page-hero">
      <div className="container">
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
        <h1>{title}</h1>
        {lead && <p className="page-hero__lead mb-0">{lead}</p>}
        {children}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd(trail) }}
      />
    </section>
  );
}
