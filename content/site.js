// Global site settings. In Phase 3 these move to the `site_settings` table
// (see docs/database-design.md) and are edited from the admin panel.
//
// Contact fields are intentionally `null` until the client confirms them —
// components hide anything that is not set instead of showing fake data.

export const site = {
  name: "Insta Mark",
  legalName: "Insta Mark Private Limited",
  tagline: "Signage That Guides. Safety That Lasts.",
  description:
    "Insta Mark delivers end-to-end design, manufacturing and installation of architectural signage, wayfinding systems and road safety solutions across India.",
  // Unconfirmed (IndiaMART listing says 2016; question 3). Stays null until the client
  // confirms it and an admin enters it in Settings (R-1.5). Only used in search-engine
  // data (JSON-LD foundingDate); the "years of expertise" badge was removed (21 Oct 2026,
  // the client said it was incorrect).
  establishedYear: null,
  city: "Mumbai",
  contact: {
    phone: null, // e.g. "+91 98XXX XXXXX"
    whatsapp: null, // digits only with country code, e.g. "9198XXXXXXXX"
    email: null, // e.g. "sales@instamark.in"
    address: {
      line1: null,
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
    },
    mapEmbedUrl: null,
  },
  social: {
    linkedin: null,
    instagram: null,
    facebook: null,
    youtube: null,
  },
};

export const mainNav = [
  { label: "Home", href: "/" },
  { label: "Solutions", href: "/solutions", hasMegaMenu: true },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];
