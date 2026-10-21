// Server-side session helpers for the admin panel.
// Middleware does a fast signature check; every admin page and server action
// ALSO calls requireAdmin(), which re-checks the user in the database
// (deactivated users and changed passwords take effect immediately).

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  passwordFingerprint,
  signSession,
  verifySession,
} from "./session";

export const ROLES = { ADMIN: "ADMIN", EDITOR: "EDITOR" };

export async function createSession(user) {
  const token = await signSession({
    uid: user.id,
    role: user.role,
    pwv: await passwordFingerprint(user.passwordHash),
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Current admin user or null (no redirect). */
export async function getCurrentUser() {
  if (!isDatabaseConfigured()) return null;
  const jar = await cookies();
  const session = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  const prisma = await getPrisma();
  const user = await prisma.adminUser.findUnique({
    where: { id: session.uid },
    select: { id: true, name: true, email: true, role: true, isActive: true, passwordHash: true },
  });
  if (!user || !user.isActive) return null;
  if ((await passwordFingerprint(user.passwordHash)) !== session.pwv) return null;

  const { passwordHash: _hash, ...safe } = user;
  return safe;
}

/**
 * Guard for admin pages and server actions.
 * @param {{ role?: "ADMIN" }} [opts] require the ADMIN role (users, settings, audit)
 */
export async function requireAdmin(opts = {}) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (opts.role === ROLES.ADMIN && user.role !== ROLES.ADMIN) redirect("/admin?denied=1");
  return user;
}
