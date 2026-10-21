// THE role map (D2, 2-ARCHITECTURE §6). Nothing else decides who may do what.
// Edge-safe (the middleware imports it), so no `server-only` marker.

/** @typedef {"dashboard:read" | "enquiry:read" | "enquiry:update" | "enquiry:export" | "content:write" | "media:upload" | "settings:write" | "user:manage" | "audit:read"} Permission */

const EDITOR = [
  "dashboard:read",
  "enquiry:read",
  "enquiry:update",
  "enquiry:export",
  "content:write",
  "media:upload",
];

/** @type {Record<string, readonly Permission[]>} */
const ROLE_PERMISSIONS = {
  ADMIN: [...EDITOR, "settings:write", "user:manage", "audit:read"],
  EDITOR,
};

/**
 * @param {string | undefined} role
 * @returns {readonly Permission[]}
 */
export function permissionsFor(role) {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * @param {string | undefined} role
 * @param {Permission} permission
 * @returns {boolean}
 */
export function can(role, permission) {
  return permissionsFor(role).includes(permission);
}

// Admin routes → permission. Most specific prefix first. Pages re-check with
// requireAuth(); this list lets the middleware block early.
const ROUTE_PERMISSIONS = [
  ["/admin/enquiries/export", "enquiry:export"],
  ["/admin/enquiries", "enquiry:read"],
  ["/admin/categories", "content:write"],
  ["/admin/projects", "content:write"],
  ["/admin/clients", "content:write"],
  ["/admin/faqs", "content:write"],
  ["/admin/banner", "content:write"],
  ["/admin/settings", "settings:write"],
  ["/admin/users", "user:manage"],
  ["/admin/audit", "audit:read"],
];

/**
 * @param {string} pathname
 * @returns {Permission | null} null = any signed-in user (dashboard needs dashboard:read)
 */
export function permissionForPath(pathname) {
  if (pathname === "/admin" || pathname === "/admin/") return "dashboard:read";
  for (const [prefix, permission] of ROUTE_PERMISSIONS) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return permission;
  }
  return null;
}
