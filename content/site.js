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

// PLACEHOLDERS for the footer only (the developer asked for sample data on 22 Oct 2026, to be
// replaced later). They are obviously fake (example.com is a reserved domain, the phone
// number is all zeros) and are used ONLY by the footer when Admin → Settings has no value:
// real values entered there replace them at once. They never reach the floating call and
// WhatsApp buttons, the search-engine data or the Contact page, so nobody is sent to a fake
// number. Replace them in Admin → Settings before launch (see docs/3-INFRA.md checklist).
export const footerPlaceholders = {
  phone: "+91 00000 00000",
  email: "info@example.com",
  addressLine1: "Plot 00, Sample Industrial Estate",
  social: {
    linkedin: "https://www.linkedin.com/",
    instagram: "https://www.instagram.com/",
    facebook: "https://www.facebook.com/",
    youtube: "https://www.youtube.com/",
  },
};

// PLACEHOLDERS for the Contact page office columns (the developer asked for sample data on
// 22 Oct 2026, like the reference's three offices). Obviously fake: example.com, all-zero
// phone numbers, "Address line" text. The first column uses the real head-office address,
// email and phone from Admin → Settings as soon as they are set. Replace or remove before
// launch (docs/3-INFRA.md checklist).
export const officePlaceholders = [
  {
    title: "Head Office",
    address: "Address line 1, Area, Mumbai, Maharashtra 400000",
    email: "info@example.com",
    phone: "+91 00000 00000",
  },
  {
    title: "Branch Office",
    address: "Address line 1, Area, City, State 000000",
    email: "sales@example.com",
    phone: "+91 00000 00001",
  },
  {
    title: "Factory",
    address: "Address line 1, Industrial Area, City, State 000000",
    email: "works@example.com",
    phone: "+91 00000 00002",
  },
];

// PLACEHOLDERS for three of the home counters under the banner (the developer asked for
// sample numbers on 23 Oct 2026, to be replaced before launch). These are NOT client facts:
// replace them with the client's confirmed figures (see the docs/3-INFRA.md checklist). The
// other two counters are counted from the site's own data.
export const statsPlaceholders = {
  projectsDelivered: "500+",
  yearsOfExperience: "9+",
  locationsCovered: "25+",
};
