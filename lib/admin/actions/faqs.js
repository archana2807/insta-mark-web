"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPrisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit, diff } from "@/lib/admin/audit";
import { revalidateFaqs } from "@/lib/admin/revalidate";

const faqSchema = z.object({
  question: z.string().trim().min(5, "Question is too short.").max(300),
  answer: z.string().trim().min(2, "Answer is required.").max(3000),
  categoryId: z
    .string()
    .optional()
    .transform((v) => v || null),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  showOnHome: z.preprocess((v) => v === "on", z.boolean()),
  isActive: z.preprocess((v) => v === "on", z.boolean()),
});

async function slugOf(prisma, categoryId) {
  if (!categoryId) return null;
  const c = await prisma.category.findUnique({ where: { id: categoryId }, select: { slug: true } });
  return c?.slug ?? null;
}

export async function saveFaq(_prev, formData) {
  const me = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = faqSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const prisma = await getPrisma();
  if (id) {
    const before = await prisma.faq.findUnique({ where: { id } });
    if (!before) return { error: "FAQ not found." };
    await prisma.faq.update({ where: { id }, data: parsed.data });
    await logAudit(me, "UPDATE", "Faq", id, diff(before, parsed.data));
    revalidateFaqs(await slugOf(prisma, before.categoryId));
  } else {
    const faq = await prisma.faq.create({ data: parsed.data });
    await logAudit(me, "CREATE", "Faq", faq.id, { question: [null, faq.question] });
  }
  revalidateFaqs(await slugOf(prisma, parsed.data.categoryId));
  revalidatePath("/admin/faqs");
  return { ok: true, message: id ? "Saved." : "FAQ added.", reset: id ? undefined : Date.now() };
}

export async function deleteFaq(formData) {
  const me = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const prisma = await getPrisma();
  const faq = await prisma.faq.findUnique({ where: { id } });
  if (!faq) return;
  await prisma.faq.delete({ where: { id } });
  await logAudit(me, "DELETE", "Faq", id, { question: [faq.question, null] });
  revalidateFaqs(await slugOf(prisma, faq.categoryId));
  revalidatePath("/admin/faqs");
}
