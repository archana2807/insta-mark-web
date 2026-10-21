import Link from "next/link";
import * as categoryService from "@/server/modules/categories/category.service";
import * as industryService from "@/server/modules/industries/industry.service";
import { requireAdmin } from "@/server/auth/session";
import { createProject } from "@/server/modules/projects/project.controller";
import ActionForm from "@/components/admin/ActionForm";
import SubmitButton from "@/components/admin/SubmitButton";
import ProjectFields from "@/components/admin/ProjectFields";
import Icon from "@/components/ui/Icon";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  await requireAdmin();
  const [categories, industries] = await Promise.all([
    categoryService.listIdOptions(),
    industryService.listOptions(),
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
