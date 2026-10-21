import Link from "next/link";
import * as enquiryService from "@/server/modules/enquiries/enquiry.service";
import { requireAuth } from "@/server/auth/session";
import { ENQUIRY_STATUSES } from "@/shared/constants";
import { formatDateTime } from "@/lib/format";
import Icon from "@/components/ui/Icon";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }) {
  await requireAuth("dashboard:read");
  const { denied } = await searchParams;
  const { thisWeek, thisMonth, recent, byCategory, unnotified, counts, categoryNames } =
    await enquiryService.getDashboard();

  return (
    <>
      {denied && (
        <div className="alert alert-warning">That section is only available to administrators.</div>
      )}
      <h1 className="mb-4">Dashboard</h1>

      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <Link href="/admin/enquiries?status=NEW" className="admin-stat d-block text-reset">
            <strong>{counts.NEW ?? 0}</strong>
            <span>New enquiries to respond to</span>
          </Link>
        </div>
        <div className="col-6 col-xl-3">
          <div className="admin-stat">
            <strong>{thisWeek}</strong>
            <span>Enquiries in the last 7 days</span>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="admin-stat">
            <strong>{thisMonth}</strong>
            <span>Enquiries in the last 30 days</span>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="admin-stat">
            <strong>{counts.WON ?? 0}</strong>
            <span>Won (all time)</span>
          </div>
        </div>
      </div>

      {unnotified > 0 && (
        <div className="alert alert-warning">
          {unnotified} enquir{unnotified === 1 ? "y has" : "ies have"} not been emailed to the sales
          team yet (email not configured or failed). Check them below.
        </div>
      )}

      <div className="row g-4">
        <div className="col-xl-8">
          <div className="admin-card p-0">
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
              <h2 className="mb-0">Latest enquiries</h2>
              <Link href="/admin/enquiries" className="link-arrow small">
                View all <Icon name="arrow-right" />
              </Link>
            </div>
            <div className="table-responsive">
              <table className="table admin-table">
                <thead>
                  <tr>
                    <th>Received</th>
                    <th>Name</th>
                    <th>Requirement</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-secondary">
                        No enquiries yet.
                      </td>
                    </tr>
                  )}
                  {recent.map((e) => (
                    <tr key={e.id}>
                      <td className="text-nowrap">{formatDateTime(e.createdAt)}</td>
                      <td>
                        <Link href={`/admin/enquiries/${e.id}`}>{e.name}</Link>
                        {e.company && <div className="small text-secondary">{e.company}</div>}
                      </td>
                      <td>{e.category?.name ?? e.requirement ?? "—"}</td>
                      <td>
                        <span className={`status-badge is-${e.status}`}>{e.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-xl-4">
          <div className="admin-card">
            <h2>Pipeline</h2>
            <ul className="list-unstyled mb-0">
              {ENQUIRY_STATUSES.map((s) => (
                <li key={s} className="d-flex justify-content-between py-2 border-bottom">
                  <Link href={`/admin/enquiries?status=${s}`}>
                    <span className={`status-badge is-${s}`}>{s}</span>
                  </Link>
                  <strong>{counts[s] ?? 0}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div className="admin-card">
            <h2>Top solutions (30 days)</h2>
            {byCategory.length === 0 ? (
              <p className="text-secondary mb-0">No data yet.</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {byCategory.slice(0, 6).map((r) => (
                  <li
                    key={r.categoryId ?? "none"}
                    className="d-flex justify-content-between py-2 border-bottom"
                  >
                    <span>
                      {r.categoryId ? categoryNames[r.categoryId] : "General / contact page"}
                    </span>
                    <strong>{r._count._all}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
