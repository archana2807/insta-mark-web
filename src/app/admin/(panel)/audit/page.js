import Link from "next/link";
import * as auditService from "@/server/modules/audit/audit.service";
import { requireAuth } from "@/server/auth/session";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Audit log" };

export default async function AuditPage({ searchParams }) {
  await requireAuth("audit:read");
  const { rows, page, pages } = await auditService.listPage((await searchParams).page);

  return (
    <>
      <h1 className="mb-1">Audit log</h1>
      <p className="text-secondary mb-4">Who changed what, and when. Kept for one year.</p>
      <div className="admin-card p-0">
        <div className="table-responsive">
          <table className="table admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Action</th>
                <th>What</th>
                <th>Changes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="text-nowrap small">{formatDateTime(r.createdAt)}</td>
                  <td className="small">{r.actor?.name ?? "System / unknown"}</td>
                  <td>
                    <code>{r.action}</code>
                  </td>
                  <td className="small">
                    {r.entity}
                    {r.entityId && (
                      <span className="text-secondary"> · {r.entityId.slice(0, 10)}</span>
                    )}
                  </td>
                  <td className="small text-secondary" style={{ maxWidth: 360 }}>
                    {r.changes ? Object.keys(r.changes).join(", ") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {pages > 1 && (
        <div className="d-flex gap-2 mt-3">
          {page > 1 && (
            <Link className="btn btn-light btn-sm" href={`?page=${page - 1}`}>
              Newer
            </Link>
          )}
          {page < pages && (
            <Link className="btn btn-light btn-sm" href={`?page=${page + 1}`}>
              Older
            </Link>
          )}
        </div>
      )}
    </>
  );
}
