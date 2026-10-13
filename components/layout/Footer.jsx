import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";
import { telHref } from "@/lib/format";
import Icon from "@/components/ui/Icon";

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "All Solutions", href: "/solutions" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy-policy" },
];

export default function Footer({ site, categories, ctaTitle }) {
  const { contact } = site;
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer pt-7 pb-4">
      <div className="container">
        <div className="mb-6">
          <BrandLogo light />
        </div>
        <div className="row g-5">
          <div className="col-lg-5">
            <h2 className="h3 mb-5">{ctaTitle}</h2>
            <div className="row g-4">
              {contact.phone && (
                <div className="col-sm-6">
                  <span className="site-footer__label">Call our office</span>
                  <a href={telHref(contact.phone)}>{contact.phone}</a>
                </div>
              )}
              {contact.email && (
                <div className="col-sm-6">
                  <span className="site-footer__label">Send a message</span>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </div>
              )}
              <div className="col-sm-6">
                <span className="site-footer__label">Head office</span>
                <span>
                  {[contact.address.line1, contact.address.city, contact.address.state]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
              <div className="col-sm-6">
                <Link href="/contact" className="btn btn-white">
                  Request a Quote <Icon name="arrow-right" />
                </Link>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-4 col-lg-3 offset-lg-2">
            <span className="site-footer__label">Solutions</span>
            <ul className="site-footer__links">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/solutions/${c.slug}`}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-6 col-md-4 col-lg-2">
            <span className="site-footer__label">Company</span>
            <ul className="site-footer__links">
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="site-footer__bottom d-flex flex-column flex-md-row justify-content-between gap-2 mt-7 pt-4">
          <span>
            © {year} {site.legalName}. All rights reserved.
          </span>
          <span>Architectural Signage · Wayfinding · Road Safety</span>
        </div>
      </div>
    </footer>
  );
}
