"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Dropdown from "react-bootstrap/Dropdown";
import Offcanvas from "react-bootstrap/Offcanvas";
import BrandLogo from "@/components/ui/BrandLogo";
import ClientIcon from "@/components/ui/ClientIcon";
import BtnText from "@/components/ui/BtnText";

function isActive(pathname, href) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Header({ nav, solutionGroups }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on navigation.
  useEffect(() => {
    setMenuOpen(false);
    setSolutionsOpen(false);
  }, [pathname]);

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <nav className="navbar navbar-expand-lg" aria-label="Main">
        <div className="container-fluid px-3 px-lg-5">
          <BrandLogo />

          {/* Desktop navigation */}
          <ul className="navbar-nav ms-auto me-4 d-none d-lg-flex align-items-lg-center">
            {nav.map((item) =>
              item.hasMegaMenu ? (
                <Dropdown
                  as="li"
                  className="nav-item"
                  key={item.href}
                  show={solutionsOpen}
                  onToggle={(next) => setSolutionsOpen(next)}
                >
                  <Dropdown.Toggle
                    as="button"
                    type="button"
                    className={`nav-link btn btn-link border-0 ${isActive(pathname, item.href) ? "active" : ""}`}
                  >
                    {item.label}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="mega-menu" align="end">
                    <div className="row g-4">
                      {solutionGroups.map((group) => (
                        <div className="col-6" key={group.key}>
                          <div className="mega-menu__group-title">{group.label}</div>
                          {group.items.map((c) => (
                            <Dropdown.Item as={Link} href={`/solutions/${c.slug}`} key={c.slug}>
                              {c.iconNode /* rendered on the server (full icon set) */}
                              {c.name}
                            </Dropdown.Item>
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className="border-top mt-3 pt-3">
                      <Link href="/solutions" className="link-arrow">
                        View all solutions <ClientIcon name="arrow-right" />
                      </Link>
                    </div>
                  </Dropdown.Menu>
                </Dropdown>
              ) : (
                <li className="nav-item" key={item.href}>
                  <Link
                    href={item.href}
                    className={`nav-link ${isActive(pathname, item.href) ? "active" : ""}`}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>

          <div className="d-flex align-items-center gap-2 ms-auto ms-lg-0">
            <Link href="/contact" className="btn btn-outline-ink d-none d-sm-inline-flex">
              <ClientIcon name="envelope" />
              <BtnText>Get a Quote</BtnText>
            </Link>
            <button
              type="button"
              className="menu-toggle d-lg-none"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              <ClientIcon name="list" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile navigation */}
      <Offcanvas
        id="mobile-menu"
        show={menuOpen}
        onHide={() => setMenuOpen(false)}
        placement="end"
        className="mobile-menu"
        aria-label="Menu"
      >
        <Offcanvas.Header closeButton closeLabel="Close menu">
          <BrandLogo />
        </Offcanvas.Header>
        <Offcanvas.Body>
          {nav.map((item) => (
            <div key={item.href}>
              <Link href={item.href} className="mobile-menu__link">
                {item.label}
              </Link>
              {item.hasMegaMenu && (
                <div className="mobile-menu__sub">
                  {solutionGroups
                    .flatMap((g) => g.items)
                    .map((c) => (
                      <Link href={`/solutions/${c.slug}`} key={c.slug}>
                        {c.name}
                      </Link>
                    ))}
                </div>
              )}
            </div>
          ))}
          <Link href="/contact" className="btn btn-dark btn-lg mt-4">
            Get a Quote <ClientIcon name="arrow-right" />
          </Link>
        </Offcanvas.Body>
      </Offcanvas>
    </header>
  );
}
