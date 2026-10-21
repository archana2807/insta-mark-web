// Constants shared by the browser and the server. Plain JS, no imports.

export const ROLES = { ADMIN: "ADMIN", EDITOR: "EDITOR" };

export const ENQUIRY_STATUSES = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST", "SPAM"];

/** Rows per page in the admin enquiry list. */
export const ENQUIRY_PAGE_SIZE = 25;

/** Rows per page in the admin projects list. */
export const PROJECT_PAGE_SIZE = 25;

/** Rows per page in the admin audit log. */
export const AUDIT_PAGE_SIZE = 50;

export const PASSWORD_MIN_LENGTH = 10;

export const CATEGORY_GROUPS = ["ARCHITECTURAL", "ROAD_SAFETY"];

export const IMAGE_TYPES = ["CATALOGUE", "EXECUTED"];

/**
 * Home banner (design.md §4.1, R-3.2). `width`/`height` are the sizes we give the
 * client's design team; `min*` is the smallest upload we accept.
 */
export const BANNER = {
  breakpoint: 992, // desktop image from this width up (Bootstrap lg)
  desktop: {
    width: 1920,
    height: 1720,
    minWidth: 1600,
    minHeight: 1400,
    safeArea: "1500 × 1600 px",
    maxKb: 600,
  },
  mobile: {
    width: 1080,
    height: 1080,
    minWidth: 900,
    minHeight: 900,
    safeArea: "960 × 960 px",
    maxKb: 300,
  },
};

/**
 * One-time cookie the server sets only for a real, accepted enquiry; the thank-you page
 * fires the GA4 conversion only when it is present (honeypot hits never count).
 * Path "/": after a JS submit the browser reaches /thank-you by client-side navigation,
 * and Chrome then still reads cookies for the starting page's path.
 */
export const LEAD_COOKIE = { name: "im_lead", path: "/", maxAgeSeconds: 120 };
