"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getPrisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit, diff } from "@/lib/admin/audit";
import { revalidateProjects } from "@/lib/admin/revalidate";
import { slugify, uniqueSlug } from "@/lib/admin/slug";
import { deleteAssetsIfUnused } from "@/lib/admin/media-cleanup";

const optional = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

const projectSchema = z.object({
  title: z.string().trim().min(3, "Title is required.").max(150),
  slug: z
    .string()
    .trim()
    .optional()
    .transform((v) => slugify(v ?? "")),
  clientName: optional(150),
  city: optional(100),
  state: optional(100),
  year: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v, 10) : null))
    .pipe(z.number().int().min(1990).max(2100).nullable()),
  industryId: optional(40),
  description: optional(5000),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isFeatured: z.preprocess((v) => v === "on", z.boolean()),
  isActive: z.preprocess((v) => v === "on", z.boolean()),
});

function parse(formData) {
  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  const categoryIds = formData.getAll("categoryIds").map(String).filter(Boolean);
  return { parsed, categoryIds };
}

export async function createProject(_prev, formData) {
  const me = await requireAdmin();
  const { parsed, categoryIds } = parse(formData);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const prisma = await getPrisma();
  const { slug: wanted, ...data } = parsed.data;
  const slug = await uniqueSlug(wanted || data.title, async (s) =>
    Boolean(await prisma.project.findUnique({ where: { slug: s }, select: { id: true } })),
  );
  const project = await prisma.project.create({
    data: {
      ...data,
      slug,
      categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
    },
  });
  await logAudit(me, "CREATE", "Project", project.id, { title: [null, data.title] });
  revalidateProjects(slug);
  redirect(`/admin/projects/${project.id}?created=1`);
}

export async function updateProject(_prev, formData) {
  const me = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const { parsed, categoryIds } = parse(formData);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const prisma = await getPrisma();
  const before = await prisma.project.findUnique({ where: { id } });
  if (!before) return { error: "Project not found." };

  const { slug: wanted, ...data } = parsed.data;
  let slug = before.slug;
  if (wanted && wanted !== before.slug) {
    const taken = await prisma.project.findUnique({
      where: { slug: wanted },
      select: { id: true },
    });
    if (taken) return { fieldErrors: { slug: ["This URL is already used by another project."] } };
    slug = wanted;
  }

  await prisma.$transaction([
    prisma.project.update({ where: { id }, data: { ...data, slug } }),
    prisma.projectCategory.deleteMany({ where: { projectId: id } }),
    prisma.projectCategory.createMany({
      data: categoryIds.map((categoryId) => ({ projectId: id, categoryId })),
    }),
  ]);
  await logAudit(me, "UPDATE", "Project", id, diff(before, { ...data, slug }));
  revalidateProjects(before.slug);
  if (slug !== before.slug) revalidateProjects(slug);
  revalidatePath(`/admin/projects/${id}`);
  return { ok: true, message: "Saved." };
}

export async function deleteProject(formData) {
  const me = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const prisma = await getPrisma();
  const project = await prisma.project.findUnique({
    where: { id },
    select: { slug: true, title: true, coverImageId: true, images: { select: { assetId: true } } },
  });
  if (!project) redirect("/admin/projects");
  await prisma.project.delete({ where: { id } }); // gallery rows + category links cascade
  await deleteAssetsIfUnused(prisma, [
    project.coverImageId,
    ...project.images.map((i) => i.assetId),
  ]);
  await logAudit(me, "DELETE", "Project", id, { title: [project.title, null] });
  revalidateProjects(project.slug);
  redirect("/admin/projects?deleted=1");
}
