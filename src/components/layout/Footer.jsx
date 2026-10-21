import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";
import BtnText from "@/components/ui/BtnText";
import { telHref } from "@/lib/format";
import Icon from "@/components/ui/Icon";

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "All Solutions", href: "/solutions" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy-policy" },
];

const socialNetworks = [
  { key: "linkedin", label: "LinkedIn" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
];

/**
 * Site footer, the same on every page: the call to action (heading, text, two buttons),
 * contact details and social icons on the left; solutions and company links on the right.
 * Contact details and social links that are not set stay hidden (R-1.5).
 * @param {{ site: object, categories: { slug: string, name: string }[],
 *   cta: { title: string, text: string,
 *     primaryCta: { label: string, href: string },
 *     secondaryCta?: { label: string, href: string } } }} props
 * @returns {JSX.Element}
 */
export default function Footer({ site, categories, cta }) {
  const { contact } = site;
  const year = new Date().getFullYear();
  const address = [contact.address.line1, contact.address.city, contact.address.state]
    .filter(Boolean)
    .join(", ");
  const socials = socialNetworks.filter((n) => site.social?.[n.key]);

  return (
    <footer className="site-footer pt-7 pb-4">
      <div className="container">
        <div className="mb-6">
          <BrandLogo light />
        </div>
        <div className="row g-4 g-lg-5">
          <div className="col-lg-6">
            <h2 className="site-footer__title mb-4">{cta.title}</h2>
            <p className="site-footer__text mb-5">{cta.text}</p>
            <div className="d-flex flex-wrap gap-3 mb-6">
              <Link href={cta.primaryCta.href} className="btn btn-white btn-lg">
                <BtnText>{cta.primaryCta.label}</BtnText> <Icon name="arrow-right" />
              </Link>
              {cta.secondaryCta && (
                <Link href={cta.secondaryCta.href} className="btn btn-outline-white btn-lg">
                  <BtnText>{cta.secondaryCta.label}</BtnText>
                </Link>
              )}
            </div>

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
              {address && (
                <div className="col-sm-6">
                  <span className="site-footer__label">Head office</span>
                  <span>{address}</span>
                </div>
              )}
              {socials.length > 0 && (
                <div className="col-sm-6">
                  <span className="site-footer__label">Follow us</span>
                  <ul className="site-footer__social list-unstyled mb-0">
                    {socials.map((n) => (
                      <li key={n.key}>
                        <a
                          href={site.social[n.key]}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Insta Mark on ${n.label}`}
                        >
                          <Icon name={n.key} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="col-6 col-md-4 col-lg-3">
            <span className="site-footer__label">Solutions</span>
            <ul className="site-footer__links">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/solutions/${c.slug}`}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-6 col-md-4 col-lg-3">
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
