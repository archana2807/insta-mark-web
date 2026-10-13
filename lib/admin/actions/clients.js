"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPrisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit, diff } from "@/lib/admin/audit";
import { revalidateClients } from "@/lib/admin/revalidate";
import { createUploadParams, isCloudinaryConfigured, verifyUploadResponse } from "@/lib/cloudinary";
import { deleteAssetsIfUnused } from "@/lib/admin/media-cleanup";

export async function getLogoUploadSignature() {
  await requireAdmin();
  if (!isCloudinaryConfigured()) return { error: "Cloudinary is not configured." };
  return createUploadParams("insta-mark/clients");
}

const fieldsSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(150),
  websiteUrl: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => v || null)
    .refine((v) => !v || /^https?:\/\//.test(v), "Website must start with http:// or https://"),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.preprocess((v) => v === "on", z.boolean()),
});

const uploadSchema = z.object({
  public_id: z.string().startsWith("insta-mark/clients/"),
  version: z.union([z.number(), z.string()]),
  signature: z.string(),
  secure_url: z.string().startsWith("https://res.cloudinary.com/"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  format: z.string().max(10),
  bytes: z.number().int().nonnegative(),
});

function done(message) {
  revalidateClients();
  revalidatePath("/admin/clients");
  return { ok: true, message };
}

export async function createClientLogo(_prev, formData) {
  const me = await requireAdmin();
  const fields = fieldsSchema.safeParse(Object.fromEntries(formData));
  if (!fields.success) return { fieldErrors: fields.error.flatten().fieldErrors };

  let upload;
  try {
    upload = uploadSchema.parse(JSON.parse(String(formData.get("upload") || "null")));
  } catch {
    return { error: "Please upload the logo image first." };
  }
  if (!verifyUploadResponse(upload)) return { error: "Upload could not be verified." };

  const prisma = await getPrisma();
  const asset = await prisma.mediaAsset.upsert({
    where: { publicId: upload.public_id },
    create: {
      publicId: upload.public_id,
      url: upload.secure_url,
      width: upload.width,
      height: upload.height,
      format: upload.format,
      bytes: upload.bytes,
      alt: `${fields.data.name} logo`,
    },
    update: {},
  });
  const logo = await prisma.clientLogo.create({ data: { ...fields.data, logoId: asset.id } });
  await logAudit(me, "CREATE", "ClientLogo", logo.id, { name: [null, logo.name] });
  return { ...done("Logo added."), reset: Date.now() };
}

export async function updateClientLogo(_prev, formData) {
  const me = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const fields = fieldsSchema.safeParse(Object.fromEntries(formData));
  if (!fields.success) return { fieldErrors: fields.error.flatten().fieldErrors };
  const prisma = await getPrisma();
  const before = await prisma.clientLogo.findUnique({ where: { id } });
  if (!before) return { error: "Logo not found." };
  await prisma.clientLogo.update({ where: { id }, data: fields.data });
  await prisma.mediaAsset.update({
    where: { id: before.logoId },
    data: { alt: `${fields.data.name} logo` },
  });
  await logAudit(me, "UPDATE", "ClientLogo", id, diff(before, fields.data));
  return done("Saved.");
}

export async function deleteClientLogo(formData) {
  const me = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const prisma = await getPrisma();
  const logo = await prisma.clientLogo.findUnique({ where: { id } });
  if (!logo) return;
  await prisma.clientLogo.delete({ where: { id } });
  await deleteAssetsIfUnused(prisma, [logo.logoId]);
  await logAudit(me, "DELETE", "ClientLogo", id, { name: [logo.name, null] });
  done();
}
