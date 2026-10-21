import Link from "next/link";
import Image from "next/image";
import * as projectService from "@/server/modules/projects/project.service";
import { requireAuth } from "@/server/auth/session";
import Icon from "@/components/ui/Icon";
import { EmptyRow } from "@/components/shared/EmptyState";
import Pagination from "@/components/shared/Pagination";

export const metadata = { title: "Projects" };

export default async function ProjectsAdminPage({ searchParams }) {
  await requireAuth("content:write");
  const { deleted, page: pageParam } = await searchParams;
  const { rows: projects, page, pages } = await projectService.listForAdmin(pageParam);

  return (
    <>
      {deleted && <div className="alert alert-success">Project deleted.</div>}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">Projects</h1>
          <p className="text-secondary mb-0">
            Named executed projects shown on the website’s Projects page.
          </p>
        </div>
        <Link href="/admin/projects/new" className="btn btn-dark">
          <Icon name="plus-lg" className="me-1" /> New project
        </Link>
      </div>
      <div className="admin-card p-0">
        <div className="table-responsive">
          <table className="table admin-table">
            <thead>
              <tr>
                <th style={{ width: 90 }}>
                  <span className="visually-hidden">Cover photo</span>
                </th>
                <th>Project</th>
                <th>Solutions</th>
                <th>Photos</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 && (
                <EmptyRow colSpan={5}>
                  No projects yet. Add the client’s executed projects (e.g. “CCI Residential Tower,
                  Kandivali”).
                </EmptyRow>
              )}
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="position-relative bg-light" style={{ width: 72, height: 54 }}>
                      {p.coverImage && (
                        <Image
                          src={p.coverImage.url}
                          alt=""
                          fill
                          sizes="72px"
                          style={{ objectFit: "cover" }}
                        />
                      )}
                    </div>
                  </td>
                  <td>
                    <Link href={`/admin/projects/${p.id}`} className="fw-semibold">
                      {p.title}
                    </Link>
                    <div className="small text-secondary">
                      {[p.clientName, p.city, p.year].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </td>
                  <td className="small">
                    {p.categories.map((c) => c.category.name).join(", ") || "—"}
                  </td>
                  <td>{p._count.images}</td>
                  <td className="small">
                    {p.isActive ? "Visible" : <span className="text-danger">Hidden</span>}
                    {p.isFeatured && <span className="badge bg-dark ms-2">Featured</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} pages={pages} href={(n) => `?page=${n}`} />
    </>
  );
}
