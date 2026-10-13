"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPrisma } from "@/lib/db";
import { requireAdmin, ROLES } from "@/lib/auth";
import { hashPassword, PASSWORD_MIN_LENGTH } from "@/lib/auth/password";
import { logAudit, diff } from "@/lib/admin/audit";

const password = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(200);

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(255),
  role: z.enum(["ADMIN", "EDITOR"]),
  password,
});

export async function createUser(_prev, formData) {
  const me = await requireAdmin({ role: ROLES.ADMIN });
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const { password: pw, ...data } = parsed.data;

  const prisma = await getPrisma();
  if (await prisma.adminUser.findUnique({ where: { email: data.email } })) {
    return { fieldErrors: { email: ["A user with this email already exists."] } };
  }
  const user = await prisma.adminUser.create({
    data: { ...data, passwordHash: await hashPassword(pw) },
  });
  await logAudit(me, "CREATE", "AdminUser", user.id, {
    email: [null, user.email],
    role: [null, user.role],
  });
  revalidatePath("/admin/users");
  return {
    ok: true,
    message: `User ${user.email} created. Share the password with them securely.`,
    reset: Date.now(),
  };
}

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(100),
  role: z.enum(["ADMIN", "EDITOR"]),
  isActive: z.preprocess((v) => v === "on", z.boolean()),
});

export async function updateUser(_prev, formData) {
  const me = await requireAdmin({ role: ROLES.ADMIN });
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const { id, ...data } = parsed.data;

  if (id === me.id && (!data.isActive || data.role !== "ADMIN")) {
    return { error: "You cannot deactivate yourself or remove your own admin role." };
  }
  const prisma = await getPrisma();
  const before = await prisma.adminUser.findUnique({ where: { id } });
  if (!before) return { error: "User not found." };

  const losesAdmin =
    before.role === "ADMIN" && before.isActive && (data.role !== "ADMIN" || !data.isActive);
  if (losesAdmin) {
    const admins = await prisma.adminUser.count({ where: { role: "ADMIN", isActive: true } });
    if (admins <= 1) return { error: "At least one active administrator is required." };
  }

  await prisma.adminUser.update({ where: { id }, data });
  await logAudit(me, "UPDATE", "AdminUser", id, diff(before, data));
  revalidatePath("/admin/users");
  return { ok: true, message: "Saved." };
}

const resetSchema = z.object({ id: z.string().min(1), password });

/** Admin sets a new password for a user (also unlocks the account). */
export async function resetUserPassword(_prev, formData) {
  const me = await requireAdmin({ role: ROLES.ADMIN });
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const prisma = await getPrisma();
  await prisma.adminUser.update({
    where: { id: parsed.data.id },
    data: {
      passwordHash: await hashPassword(parsed.data.password),
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });
  await logAudit(me, "PASSWORD_RESET", "AdminUser", parsed.data.id);
  return {
    ok: true,
    message: "Password reset. Their existing sessions are signed out.",
    reset: Date.now(),
  };
}
