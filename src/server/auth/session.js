// Server-side session helpers for the admin panel.
// The middleware does a fast JWT + route check; every admin page and controller ALSO
// calls requireAuth(permission), which re-checks the user in the database (exists,
// active, not locked, token version matches). That is the check that counts.
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDatabaseConfigured } from "@/server/config/env";
import * as userService from "@/server/modules/users/user.service";
import { TOKEN_COOKIE, tokenCookieOptions } from "./cookies";
import { signAccessToken, verifyAccessToken } from "./jwt";
import { can } from "./permissions";

/**
 * Issues the access token for this browser.
 * @param {{ id: string, role: string, tokenVersion: number }} user
 * @returns {Promise<void>}
 */
export async function createSession(user) {
  const token = await signAccessToken({ sub: user.id, role: user.role, tv: user.tokenVersion });
  const jar = await cookies();
  jar.set(TOKEN_COOKIE, token, tokenCookieOptions());
}

/** @returns {Promise<void>} */
export async function destroySession() {
  const jar = await cookies();
  jar.delete(TOKEN_COOKIE);
}

/**
 * Current admin user or null (no redirect).
 * @returns {Promise<{ id: string, name: string, email: string, role: string } | null>}
 */
export async function getCurrentUser() {
  if (!isDatabaseConfigured()) return null;
  const jar = await cookies();
  const claims = await verifyAccessToken(jar.get(TOKEN_COOKIE)?.value);
  if (!claims) return null;

  const user = await userService.findForSession(claims.sub);
  if (!user || !user.isActive) return null;
  if (user.lockedUntil && user.lockedUntil > new Date()) return null;
  if (user.tokenVersion !== claims.tv) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

/**
 * Guard for admin pages and controllers.
 * Not signed in → /admin/login. Missing permission → /admin?denied=1.
 * @param {import("./permissions").Permission} [permission] omit = any signed-in user
 */
export async function requireAuth(permission) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (permission && !can(user.role, permission)) redirect("/admin?denied=1");
  return user;
}
