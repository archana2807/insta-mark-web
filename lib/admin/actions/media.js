"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPrisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/admin/audit";
import { revalidateGallery, revalidateProjects, revalidateCategory } from "@/lib/admin/revalidate";
import { createUploadParams, isCloudinaryConfigured, verifyUploadResponse } from "@/lib/cloudinary";
import { deleteAssetsIfUnused } from "@/lib/admin/media-cleanup";

// Gallery "kinds": which join table an image belongs to.
const KINDS = {
  category: {
    join: "categoryImage",
    owner: "category",
    ownerKey: "categoryId",
    coverField: "heroImageId",
    folder: (slug, type) => `insta-mark/categories/${slug}/${(type ?? "EXECUTED").toLowerCase()}`,
    adminPath: (id) => `/admin/categories/${id}`,
    revalidate: (slug) => revalidateGallery(slug),
  },
  project: {
    join: "projectImage",
    owner: "project",
    ownerKey: "projectId",
    coverField: "coverImageId",
    folder: (slug) => `insta-mark/projects/${slug}`,
    adminPath: (id) => `/admin/projects/${id}`,
    revalidate: (slug) => revalidateProjects(slug),
  },
};

const kindSchema = z.enum(["category", "project"]);

async function loadOwner(prisma, kind, ownerId) {
  return prisma[KINDS[kind].owner].findUnique({
    where: { id: ownerId },
    select: { id: true, slug: true },
  });
}

/** Step 1 of an upload: signed params for a direct browser → Cloudinary upload. */
export async function getUploadSignature({ kind, ownerId, type }) {
  await requireAdmin();
  if (!isCloudinaryConfigured()) return { error: "Cloudinary is not configured." };
  const k = kindSchema.parse(kind);
  const prisma = await getPrisma();
  const owner = await loadOwner(prisma, k, ownerId);
  if (!owner) return { error: "Not found." };
  return createUploadParams(KINDS[k].folder(owner.slug, type));
}

const uploadSchema = z.object({
  public_id: z.string().startsWith("insta-mark/"),
  version: z.union([z.number(), z.string()]),
  signature: z.string(),
  secure_url: z.string().url().startsWith("https://res.cloudinary.com/"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  format: z.string().max(10),
  bytes: z.number().int().nonnegative(),
});

/** Step 2: register a verified Cloudinary upload and attach it to the gallery. */
export async function attachUploadedImage({ kind, ownerId, type, alt, upload }) {
  const me = await requireAdmin();
  const k = kindSchema.parse(kind);
  const parsed = uploadSchema.safeParse(upload);
  if (!parsed.success || !verifyUploadResponse(parsed.data)) {
    return { error: "Upload could not be verified." };
  }
  const cfg = KINDS[k];
  const prisma = await getPrisma();
  const owner = await prisma[cfg.owner].findUnique({
    where: { id: ownerId },
    select: { id: true, slug: true, [cfg.coverField]: true },
  });
  if (!owner) return { error: "Not found." };

  const u = parsed.data;
  const asset = await prisma.mediaAsset.upsert({
    where: { publicId: u.public_id },
    create: {
      publicId: u.public_id,
      url: u.secure_url,
      width: u.width,
      height: u.height,
      format: u.format,
      bytes: u.bytes,
      alt:
        String(alt || "")
          .trim()
          .slice(0, 255) || "Photo",
    },
    update: {},
  });
  const last = await prisma[cfg.join].findFirst({
    where: { [cfg.ownerKey]: owner.id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  await prisma[cfg.join].create({
    data: {
      [cfg.ownerKey]: owner.id,
      assetId: asset.id,
      sortOrder: (last?.sortOrder ?? -1) + 1,
      ...(k === "category" ? { type: type === "CATALOGUE" ? "CATALOGUE" : "EXECUTED" } : {}),
    },
  });
  if (!owner[cfg.coverField]) {
    await prisma[cfg.owner].update({
      where: { id: owner.id },
      data: { [cfg.coverField]: asset.id },
    });
  }
  await logAudit(me, "UPLOAD", cfg.owner, owner.id, { image: [null, u.public_id] });
  cfg.revalidate(owner.slug);
  revalidatePath(cfg.adminPath(owner.id));
  return { ok: true };
}

const imageRef = z.object({ kind: kindSchema, id: z.string().min(1) });

async function loadImage(prisma, kind, id) {
  const cfg = KINDS[kind];
  return prisma[cfg.join].findUnique({
    where: { id },
    include: {
      asset: true,
      [cfg.owner]: { select: { id: true, slug: true, [cfg.coverField]: true } },
    },
  });
}

export async function updateImage(_prev, formData) {
  const me = await requireAdmin();
  const parsed = imageRef
    .extend({
      alt: z.string().trim().min(5, "Alt text should describe the photo (5+ characters).").max(255),
      type: z.enum(["CATALOGUE", "EXECUTED"]).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { kind, id, alt, type } = parsed.data;
  const cfg = KINDS[kind];
  const prisma = await getPrisma();
  const img = await loadImage(prisma, kind, id);
  if (!img) return { error: "Image not found." };

  await prisma.mediaAsset.update({ where: { id: img.assetId }, data: { alt } });
  if (kind === "category" && type)
    await prisma.categoryImage.update({ where: { id }, data: { type } });
  await logAudit(me, "UPDATE", "MediaAsset", img.assetId, { alt: [img.asset.alt, alt] });
  cfg.revalidate(img[cfg.owner].slug);
  revalidatePath(cfg.adminPath(img[cfg.owner].id));
  return { ok: true, message: "Saved." };
}

export async function moveImage(formData) {
  await requireAdmin();
  const { kind, id, direction } = imageRef
    .extend({ direction: z.enum(["up", "down"]) })
    .parse(Object.fromEntries(formData));
  const cfg = KINDS[kind];
  const prisma = await getPrisma();
  const img = await loadImage(prisma, kind, id);
  if (!img) return;

  const ownerId = img[cfg.ownerKey];
  const siblings = await prisma[cfg.join].findMany({
    where: { [cfg.ownerKey]: ownerId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const i = siblings.findIndex((s) => s.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= siblings.length) return;
  [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
  // Renumber everything so legacy duplicate sortOrders are normalised too.
  await prisma.$transaction(
    siblings.map((s, index) =>
      prisma[cfg.join].update({ where: { id: s.id }, data: { sortOrder: index } }),
    ),
  );
  cfg.revalidate(img[cfg.owner].slug);
  revalidatePath(cfg.adminPath(ownerId));
}

export async function setCoverImage(formData) {
  const me = await requireAdmin();
  const { kind, id } = imageRef.parse(Object.fromEntries(formData));
  const cfg = KINDS[kind];
  const prisma = await getPrisma();
  const img = await loadImage(prisma, kind, id);
  if (!img) return;
  await prisma[cfg.owner].update({
    where: { id: img[cfg.ownerKey] },
    data: { [cfg.coverField]: img.assetId },
  });
  await logAudit(me, "SET_COVER", cfg.owner, img[cfg.ownerKey], { cover: [null, img.assetId] });
  cfg.revalidate(img[cfg.owner].slug);
  if (kind === "category") revalidateCategory(img[cfg.owner].slug);
  revalidatePath(cfg.adminPath(img[cfg.ownerKey]));
}

/** Removes an image from the gallery; deletes the asset if nothing else uses it. */
export async function removeImage(formData) {
  const me = await requireAdmin();
  const { kind, id } = imageRef.parse(Object.fromEntries(formData));
  const cfg = KINDS[kind];
  const prisma = await getPrisma();
  const img = await loadImage(prisma, kind, id);
  if (!img) return;

  await prisma.$transaction(async (tx) => {
    await tx[cfg.join].delete({ where: { id } });
    if (img[cfg.owner][cfg.coverField] === img.assetId) {
      const next = await tx[cfg.join].findFirst({
        where: { [cfg.ownerKey]: img[cfg.ownerKey] },
        orderBy: { sortOrder: "asc" },
        select: { assetId: true },
      });
      await tx[cfg.owner].update({
        where: { id: img[cfg.ownerKey] },
        data: { [cfg.coverField]: next?.assetId ?? null },
      });
    }
  });

  // Delete the asset only when no gallery, cover or logo references it.
  await deleteAssetsIfUnused(prisma, [img.assetId]);
  await logAudit(me, "REMOVE_IMAGE", cfg.owner, img[cfg.ownerKey], {
    image: [img.asset.publicId, null],
  });
  cfg.revalidate(img[cfg.owner].slug);
  revalidatePath(cfg.adminPath(img[cfg.ownerKey]));
}
