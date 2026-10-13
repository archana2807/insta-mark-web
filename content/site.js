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
  // TODO(client): confirm founding year (IndiaMART listing says 2016).
  establishedYear: 2016,
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
