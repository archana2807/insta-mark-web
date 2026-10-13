"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPrisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit, diff } from "@/lib/admin/audit";
import { ENQUIRY_STATUSES } from "@/lib/admin/enquiries";

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(ENQUIRY_STATUSES),
  assignedToId: z
    .string()
    .optional()
    .transform((v) => v || null),
});

export async function updateEnquiry(_prev, formData) {
  const me = await requireAdmin();
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid input." };
  const { id, ...data } = parsed.data;

  const prisma = await getPrisma();
  const before = await prisma.enquiry.findUnique({
    where: { id },
    select: { status: true, assignedToId: true },
  });
  if (!before) return { error: "Enquiry not found." };

  await prisma.enquiry.update({ where: { id }, data });
  await logAudit(me, "UPDATE", "Enquiry", id, diff(before, data));
  revalidatePath(`/admin/enquiries/${id}`);
  revalidatePath("/admin/enquiries");
  return { ok: true, message: "Saved." };
}

const noteSchema = z.object({
  enquiryId: z.string().min(1),
  body: z.string().trim().min(1, "Write a note first.").max(2000),
});

export async function addEnquiryNote(_prev, formData) {
  const me = await requireAdmin();
  const parsed = noteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const prisma = await getPrisma();
  await prisma.enquiryNote.create({
    data: { enquiryId: parsed.data.enquiryId, body: parsed.data.body, authorId: me.id },
  });
  await logAudit(me, "CREATE", "EnquiryNote", parsed.data.enquiryId);
  revalidatePath(`/admin/enquiries/${parsed.data.enquiryId}`);
  return { ok: true, reset: Date.now() };
}
