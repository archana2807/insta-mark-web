"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { createSession, destroySession, getCurrentUser, requireAdmin } from "@/lib/auth";
import {
  hashPassword,
  verifyAgainstDummy,
  verifyPassword,
  PASSWORD_MIN_LENGTH,
} from "@/lib/auth/password";
import { isRateLimited, requestMeta } from "@/lib/security/rate-limit";
import { logAudit } from "@/lib/admin/audit";

const LOGIN_IP_LIMIT = { max: 10, windowMs: 10 * 60 * 1000 };
const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000;
const GENERIC_ERROR = "Invalid email or password.";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
  next: z.string().optional(),
});

/** Only allow redirects inside the admin area (no open redirects). */
function safeNext(next) {
  return typeof next === "string" && /^\/admin(\/|$|\?)/.test(next) && !next.startsWith("//")
    ? next
    : "/admin";
}

export async function login(_prev, formData) {
  if (!isDatabaseConfigured()) {
    return { error: "The admin panel needs a database (DATABASE_URL)." };
  }
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
    return { error: "AUTH_SECRET is not configured on the server." };
  }

  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: GENERIC_ERROR, email: String(formData.get("email") ?? "") };
  const { email, password, next } = parsed.data;

  const prisma = await getPrisma();
  const { ipHash } = await requestMeta();
  if (ipHash && (await isRateLimited(prisma, `login:${ipHash}`, LOGIN_IP_LIMIT))) {
    return { error: "Too many attempts. Please wait a few minutes and try again.", email };
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });
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
    await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        failedLoginCount: lock ? 0 : failed,
        lockedUntil: lock ? new Date(Date.now() + LOCK_MS) : null,
      },
    });
    if (lock) await logAudit(null, "LOCKOUT", "AdminUser", user.id);
    return { error: GENERIC_ERROR, email };
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await createSession(user);
  await logAudit(user, "LOGIN", "AdminUser", user.id);
  redirect(safeNext(next));
}

export async function logout() {
  const user = await getCurrentUser();
  await destroySession();
  if (user) await logAudit(user, "LOGOUT", "AdminUser", user.id);
  redirect("/admin/login");
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
      .max(200),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match.",
  });

export async function changeOwnPassword(_prev, formData) {
  const me = await requireAdmin();
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const prisma = await getPrisma();
  const user = await prisma.adminUser.findUnique({ where: { id: me.id } });
  if (!(await verifyPassword(parsed.data.current, user.passwordHash))) {
    return { fieldErrors: { current: ["Current password is incorrect."] } };
  }
  const updated = await prisma.adminUser.update({
    where: { id: me.id },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  });
  // New password → old sessions are invalid; issue a fresh one for this browser.
  await createSession(updated);
  await logAudit(me, "PASSWORD_CHANGE", "AdminUser", me.id);
  return { ok: true, message: "Password updated. Other sessions have been signed out." };
}
