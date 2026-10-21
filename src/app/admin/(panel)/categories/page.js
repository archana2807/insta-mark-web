import Link from "next/link";
import * as categoryService from "@/server/modules/categories/category.service";
import { requireAdmin } from "@/server/auth/session";
import Icon from "@/components/ui/Icon";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireAdmin();
  const categories = await categoryService.listForAdmin();

  return (
    <>
      <h1 className="mb-1">Categories &amp; photos</h1>
      <p className="text-secondary mb-4">
        The 8 solution pages on the website. Edit text, features, SEO and photos.
      </p>
      <div className="admin-card p-0">
        <div className="table-responsive">
          <table className="table admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Group</th>
                <th>Photos</th>
                <th>Enquiries</th>
                <th>Visible</th>
                <th>
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>{c.sortOrder}</td>
                  <td>
                    <Icon name={c.icon ?? "signpost"} className="me-2 text-primary" />
                    <Link href={`/admin/categories/${c.id}`} className="fw-semibold">
                      {c.name}
                    </Link>
                    <div className="small text-secondary">/solutions/{c.slug}</div>
                  </td>
                  <td className="small">
                    {c.group === "ROAD_SAFETY" ? "Road safety" : "Architectural"}
                  </td>
                  <td>{c._count.images}</td>
                  <td>{c._count.enquiries}</td>
                  <td>{c.isActive ? "Yes" : <span className="text-danger">Hidden</span>}</td>
                  <td className="text-end">
                    <Link href={`/admin/categories/${c.id}`} className="btn btn-outline-ink btn-sm">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
