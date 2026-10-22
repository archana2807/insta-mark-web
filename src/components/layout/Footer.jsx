import Link from "next/link";
import { telHref } from "@/lib/format";
import { footerPlaceholders as sample } from "@/content/site";
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
 * Site footer, the same on every page: the call to action (heading and text), contact
 * details and social icons on the left; solutions and company links on the right.
 * Contact details and social links come from Admin → Settings; until they are set, obviously
 * fake sample values (content/site.js `footerPlaceholders`) stand in for them in this footer.
 * @param {{ site: object, categories: { slug: string, name: string }[],
 *   cta: { title: string, text: string } }} props
 * @returns {JSX.Element}
 */
export default function Footer({ site, categories, cta }) {
  const { contact } = site;
  const year = new Date().getFullYear();
  const phone = contact.phone || sample.phone;
  const email = contact.email || sample.email;
  const address = [
    contact.address.line1 || sample.addressLine1,
    contact.address.city,
    contact.address.state,
  ]
    .filter(Boolean)
    .join(", ");
  const socialUrl = (key) => site.social?.[key] || sample.social[key];
  const socials = socialNetworks.filter((n) => socialUrl(n.key));

  return (
    <footer className="site-footer pt-7 pb-4">
      <div className="container">
        <div className="row g-4 g-lg-5">
          <div className="col-lg-6">
            <h2 className="site-footer__title mb-4">{cta.title}</h2>
            <p className="site-footer__text mb-6">{cta.text}</p>

            <div className="row g-4">
              {phone && (
                <div className="col-sm-6">
                  <span className="site-footer__label">Call our office</span>
                  <a href={telHref(phone)}>{phone}</a>
                </div>
              )}
              {email && (
                <div className="col-sm-6">
                  <span className="site-footer__label">Send a message</span>
                  <a href={`mailto:${email}`}>{email}</a>
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
                          href={socialUrl(n.key)}
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
