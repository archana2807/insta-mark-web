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
