import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { deleteProject, updateProject } from "@/lib/admin/actions/projects";
import ActionForm from "@/components/admin/ActionForm";
import SubmitButton from "@/components/admin/SubmitButton";
import ProjectFields from "@/components/admin/ProjectFields";
import ImageManager from "@/components/admin/ImageManager";
import Icon from "@/components/ui/Icon";

export const metadata = { title: "Edit project" };

export default async function EditProjectPage({ params, searchParams }) {
  await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;
  const prisma = await getPrisma();
  const [p, categories, industries] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        categories: { select: { categoryId: true } },
        images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: { asset: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.industry.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!p) notFound();

  return (
    <>
      <Link href="/admin/projects" className="small">
        <Icon name="arrow-left" className="me-1" /> All projects
      </Link>
      {created && <div className="alert alert-success mt-3">Project created. Now add photos.</div>}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 my-3">
        <h1 className="mb-0">{p.title}</h1>
        {p.isActive && (
          <a href={`/projects/${p.slug}`} target="_blank" className="btn btn-outline-ink btn-sm">
            View page <Icon name="box-arrow-up-right" className="ms-1" />
          </a>
        )}
      </div>

      <div className="admin-card">
        <h2>Photos</h2>
        <ImageManager
          kind="project"
          ownerId={p.id}
          ownerName={p.title}
          images={p.images.map((i) => ({
            id: i.id,
            assetId: i.assetId,
            src: i.asset.url,
            alt: i.asset.alt,
          }))}
          coverAssetId={p.coverImageId}
          uploadsEnabled={isCloudinaryConfigured()}
        />
      </div>

      <div className="admin-card">
        <h2>Details</h2>
        <ActionForm action={updateProject}>
          <input type="hidden" name="id" value={p.id} />
          <ProjectFields
            project={p}
            categories={categories}
            industries={industries}
            selectedCategoryIds={p.categories.map((c) => c.categoryId)}
          />
          <SubmitButton>Save changes</SubmitButton>
        </ActionForm>
      </div>

      <div className="admin-card border-danger">
        <h2 className="text-danger">Delete project</h2>
        <p className="small text-secondary">
          Removes the project and its gallery from the website. Photos not used anywhere else are
          deleted too. This cannot be undone.
        </p>
        <form action={deleteProject}>
          <input type="hidden" name="id" value={p.id} />
          <SubmitButton
            className="btn btn-outline-danger btn-sm"
            confirm={`Delete “${p.title}” permanently?`}
          >
            Delete project
          </SubmitButton>
        </form>
      </div>
    </>
  );
}
