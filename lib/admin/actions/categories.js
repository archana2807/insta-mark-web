"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPrisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit, diff } from "@/lib/admin/audit";
import { revalidateCategory } from "@/lib/admin/revalidate";
import { CHOOSABLE_ICONS } from "@/components/ui/icons.generated";

const lines = (v) =>
  String(v ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

const optional = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(100),
  shortDescription: z.string().trim().min(10).max(300),
  group: z.enum(["ARCHITECTURAL", "ROAD_SAFETY"]),
  icon: z
    .string()
    .trim()
    .refine((v) => !v || CHOOSABLE_ICONS.includes(v), "Pick an icon from the list")
    .transform((v) => v || null),
  overview: z.string().trim().min(20).max(4000),
  features: z
    .string()
    .transform(lines)
    .pipe(z.array(z.string().max(120)).min(1, "Add at least one feature").max(12)),
  applications: z.string().trim().min(10).max(2000),
  seoTitle: optional(70),
  seoDescription: optional(160),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.preprocess((v) => v === "on", z.boolean()),
});

export async function updateCategory(_prev, formData) {
  const me = await requireAdmin();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const { id, ...data } = parsed.data;

  const prisma = await getPrisma();
  const before = await prisma.category.findUnique({ where: { id } });
  if (!before) return { error: "Category not found." };

  await prisma.category.update({ where: { id }, data });
  await logAudit(me, "UPDATE", "Category", id, diff(before, data));
  revalidateCategory(before.slug);
  revalidatePath(`/admin/categories/${id}`);
  revalidatePath("/admin/categories");
  return { ok: true, message: "Saved. The website updates within a few seconds." };
}
