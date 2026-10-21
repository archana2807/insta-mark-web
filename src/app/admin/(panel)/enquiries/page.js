import Link from "next/link";
import * as enquiryService from "@/server/modules/enquiries/enquiry.service";
import * as categoryService from "@/server/modules/categories/category.service";
import { requireAuth } from "@/server/auth/session";
import { ENQUIRY_STATUSES } from "@/shared/constants";
import { formatDateTime } from "@/lib/format";
import Icon from "@/components/ui/Icon";

export const metadata = { title: "Enquiries" };

export default async function EnquiriesPage({ searchParams }) {
  await requireAuth("enquiry:read");
  const params = await searchParams;
  const [{ rows, total, page, pages }, categories] = await Promise.all([
    enquiryService.listEnquiries(params),
    categoryService.listSlugOptions(),
  ]);

  const qs = (overrides) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, ...overrides })) if (v) p.set(k, v);
    return `?${p.toString()}`;
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <h1 className="mb-0">Enquiries</h1>
        <a
          href={`/admin/enquiries/export${qs({ page: "" })}`}
          className="btn btn-outline-ink btn-sm"
        >
          <Icon name="download" className="me-1" /> Export CSV
        </a>
      </div>

      <form className="admin-card row g-2 align-items-end mb-4" role="search">
        <div className="col-md-4">
          <label htmlFor="q" className="form-label small">
            Search
          </label>
          <input
            id="q"
            name="q"
            className="form-control form-control-sm"
            placeholder="Name, email, company, phone, location"
            defaultValue={params.q ?? ""}
          />
        </div>
        <div className="col-6 col-md-3">
          <label htmlFor="status" className="form-label small">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="form-select form-select-sm"
            defaultValue={params.status ?? ""}
          >
            <option value="">All (except spam)</option>
            {ENQUIRY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="col-6 col-md-3">
          <label htmlFor="category" className="form-label small">
            Solution
          </label>
          <select
            id="category"
            name="category"
            className="form-select form-select-sm"
            defaultValue={params.category ?? ""}
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2 d-flex gap-2">
          <button type="submit" className="btn btn-dark btn-sm flex-grow-1">
            Filter
          </button>
          <Link href="/admin/enquiries" className="btn btn-outline-ink btn-sm">
            Reset
          </Link>
        </div>
      </form>

      <div className="admin-card p-0">
        <div className="p-3 border-bottom small text-secondary">
          {total} enquir{total === 1 ? "y" : "ies"}
        </div>
        <div className="table-responsive">
          <table className="table admin-table">
            <thead>
              <tr>
                <th>Received</th>
                <th>Contact</th>
                <th>Requirement</th>
                <th>Location</th>
                <th>Source</th>
                <th>Status</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-secondary">
                    No enquiries match these filters.
                  </td>
                </tr>
              )}
              {rows.map((e) => (
                <tr key={e.id}>
                  <td className="text-nowrap">{formatDateTime(e.createdAt)}</td>
                  <td>
                    <Link href={`/admin/enquiries/${e.id}`} className="fw-semibold">
                      {e.name}
                    </Link>
                    <div className="small text-secondary">
                      {[e.company, e.phone, e.email].filter(Boolean).join(" · ")}
                    </div>
                  </td>
                  <td>{e.category?.name ?? e.requirement ?? "—"}</td>
                  <td>{e.projectLocation ?? "—"}</td>
                  <td className="small">
                    {e.utmSource
                      ? `${e.utmSource}${e.utmMedium ? ` / ${e.utmMedium}` : ""}`
                      : "direct"}
                  </td>
                  <td>
                    <span className={`status-badge is-${e.status}`}>{e.status}</span>
                  </td>
                  <td className="small">{e.assignedTo?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-3">
          <ul className="pagination pagination-sm">
            <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
              <Link className="page-link" href={qs({ page: String(page - 1) })}>
                Previous
              </Link>
            </li>
            <li className="page-item disabled">
              <span className="page-link">
                Page {page} of {pages}
              </span>
            </li>
            <li className={`page-item ${page >= pages ? "disabled" : ""}`}>
              <Link className="page-link" href={qs({ page: String(page + 1) })}>
                Next
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
}
