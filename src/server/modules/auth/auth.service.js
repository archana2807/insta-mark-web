// Admin login, logout and own-password change. Keeps the login rules: IP rate limit,
// lockout after 5 failures, equal timing for unknown accounts, no open redirects, audit.
import "server-only";
import { verifyAgainstDummy, verifyPassword } from "@/server/auth/password";
import { isAuthSecretConfigured } from "@/server/auth/jwt";
import { createSession, destroySession, getCurrentUser } from "@/server/auth/session";
import { isDatabaseConfigured } from "@/server/config/env";
import * as auditService from "@/server/modules/audit/audit.service";
import * as rateLimitService from "@/server/modules/rate-limits/rate-limit.service";
import * as userService from "@/server/modules/users/user.service";

const LOGIN_IP_LIMIT = { max: 10, windowMs: 10 * 60 * 1000 };
const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000;
const GENERIC_ERROR = "Invalid email or password.";

/**
 * Only allow redirects inside the admin area (no open redirects).
 * @param {string | undefined} next
 * @returns {string}
 */
export function safeNext(next) {
  return typeof next === "string" && /^\/admin(\/|$|\?)/.test(next) && !next.startsWith("//")
    ? next
    : "/admin";
}

/**
 * @param {import("@/shared/schemas/auth.schema").LoginInput | null} input null when the form was invalid
 * @param {{ email: string, ipHash: string | undefined }} request raw email (echoed back) and IP hash
 * @returns {Promise<{ error: string, email?: string } | { redirectTo: string }>}
 */
export async function login(input, request) {
  if (!isDatabaseConfigured()) {
    return { error: "The admin panel needs a database (DATABASE_URL)." };
  }
  if (!isAuthSecretConfigured()) {
    return { error: "AUTH_SECRET is not configured on the server." };
  }
  if (!input) return { error: GENERIC_ERROR, email: request.email };
  const { email, password, next } = input;

  const { ipHash } = request;
  if (ipHash && (await rateLimitService.isRateLimited(`login:${ipHash}`, LOGIN_IP_LIMIT))) {
    return { error: "Too many attempts. Please wait a few minutes and try again.", email };
  }

  const user = await userService.findByEmail(email);
  if (!user || !user.isActive) {
    await verifyAgainstDummy(password); // equal timing for unknown accounts
    return { error: GENERIC_ERROR, email };
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { error: "This account is temporarily locked. Try again in 15 minutes.", email };
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    const failed = user.failedLoginCount + 1;
    const lock = failed >= MAX_FAILED;
    await userService.updateLoginState(user.id, {
      failedLoginCount: lock ? 0 : failed,
      lockedUntil: lock ? new Date(Date.now() + LOCK_MS) : null,
    });
    if (lock) await auditService.log(null, "LOCKOUT", "AdminUser", user.id);
    return { error: GENERIC_ERROR, email };
  }

  await userService.updateLoginState(user.id, {
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: new Date(),
  });
  await createSession(user);
  await auditService.log(user, "LOGIN", "AdminUser", user.id);
  return { redirectTo: safeNext(next) };
}

/** Clears this browser's session and logs it. */
export async function logout() {
  const user = await getCurrentUser();
  await destroySession();
  if (user) await auditService.log(user, "LOGOUT", "AdminUser", user.id);
}

/**
 * Signs the user out on every device: their token version goes up, so every
 * token issued so far fails, and this browser's cookie is cleared.
 * @param {{ id: string }} me
 */
export async function logoutEverywhere(me) {
  await userService.revokeTokens(me.id);
  await destroySession();
  await auditService.log(me, "LOGOUT_ALL", "AdminUser", me.id);
}

/**
 * New password → old sessions are invalid; a fresh one is issued for this browser.
 * @param {{ id: string }} me
 * @param {import("@/shared/schemas/auth.schema").PasswordChangeInput} input
 */
export async function changeOwnPassword(me, { current, password }) {
  const user = await userService.findById(me.id);
  if (!(await verifyPassword(current, user.passwordHash))) {
    return { fieldErrors: { current: ["Current password is incorrect."] } };
  }
  const updated = await userService.setPassword(me.id, password);
  await createSession(updated);
  await auditService.log(me, "PASSWORD_CHANGE", "AdminUser", me.id);
  return { ok: true, message: "Password updated. Other sessions have been signed out." };
}
