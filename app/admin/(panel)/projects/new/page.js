import Link from "next/link";
import { getPrisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createProject } from "@/lib/admin/actions/projects";
import ActionForm from "@/components/admin/ActionForm";
import SubmitButton from "@/components/admin/SubmitButton";
import ProjectFields from "@/components/admin/ProjectFields";
import Icon from "@/components/ui/Icon";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  await requireAdmin();
  const prisma = await getPrisma();
  const [categories, industries] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.industry.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <Link href="/admin/projects" className="small">
        <Icon name="arrow-left" className="me-1" /> All projects
      </Link>
      <h1 className="my-3">New project</h1>
      <div className="admin-card">
        <ActionForm action={createProject}>
          <ProjectFields categories={categories} industries={industries} />
          <SubmitButton>Create project</SubmitButton>
          <span className="small text-secondary ms-3">You can add photos after creating it.</span>
        </ActionForm>
      </div>
    </>
  );
}
