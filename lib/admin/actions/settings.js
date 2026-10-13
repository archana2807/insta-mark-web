"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/db";
import { requireAdmin, ROLES } from "@/lib/auth";
import { logAudit } from "@/lib/admin/audit";
import { revalidateSettings } from "@/lib/admin/revalidate";

const opt = (schema) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null)
    .pipe(schema.nullable());

const https = z.string().url().startsWith("https://", "Must start with https://").max(300);

const settingsSchema = z.object({
  phone: opt(
    z
      .string()
      .max(30)
      .regex(/^[+\d][\d\s-]{6,}$/, "Enter a valid phone number"),
  ),
  whatsapp: opt(
    z.string().regex(/^\d{10,15}$/, "Digits only with country code, e.g. 919876543210"),
  ),
  email: opt(z.string().email().max(255)),
  addressLine1: opt(z.string().max(200)),
  city: opt(z.string().max(100)),
  state: opt(z.string().max(100)),
  mapEmbedUrl: opt(
    https.refine(
      (v) => v.startsWith("https://www.google.com/maps/embed"),
      "Use the Google Maps “Embed a map” URL",
    ),
  ),
  linkedin: opt(https),
  instagram: opt(https),
  facebook: opt(https),
  youtube: opt(https),
  establishedYear: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v, 10) : null))
    .pipe(z.number().int().min(1950).max(2100).nullable()),
});

export async function saveSettings(_prev, formData) {
  const me = await requireAdmin({ role: ROLES.ADMIN });
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const s = parsed.data;

  const values = {
    "contact.phone": s.phone,
    "contact.whatsapp": s.whatsapp,
    "contact.email": s.email,
    "contact.address": { line1: s.addressLine1, city: s.city, state: s.state, country: "India" },
    "contact.mapEmbedUrl": s.mapEmbedUrl,
    social: {
      linkedin: s.linkedin,
      instagram: s.instagram,
      facebook: s.facebook,
      youtube: s.youtube,
    },
    "company.establishedYear": s.establishedYear,
  };

  const prisma = await getPrisma();
  const before = Object.fromEntries(
    (await prisma.siteSetting.findMany()).map((r) => [r.key, r.value]),
  );
  await prisma.$transaction(
    Object.entries(values).map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: value ?? Prisma.JsonNull },
        update: { value: value ?? Prisma.JsonNull },
      }),
    ),
  );
  const changes = {};
  for (const [k, v] of Object.entries(values)) {
    if (JSON.stringify(before[k] ?? null) !== JSON.stringify(v ?? null))
      changes[k] = [before[k] ?? null, v];
  }
  await logAudit(me, "UPDATE", "SiteSetting", null, changes);
  revalidateSettings();
  revalidatePath("/admin/settings");
  return { ok: true, message: "Settings saved. The website updates within a few seconds." };
}
