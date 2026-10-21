import Link from "next/link";
import { notFound } from "next/navigation";
import * as enquiryService from "@/server/modules/enquiries/enquiry.service";
import * as userService from "@/server/modules/users/user.service";
import { requireAdmin } from "@/server/auth/session";
import { ENQUIRY_STATUSES } from "@/shared/constants";
import { addEnquiryNote, updateEnquiry } from "@/server/modules/enquiries/enquiry.controller";
import ActionForm from "@/components/admin/ActionForm";
import SubmitButton from "@/components/admin/SubmitButton";
import { formatDateTime, telHref, whatsappHref } from "@/lib/format";
import Icon from "@/components/ui/Icon";

export const metadata = { title: "Enquiry" };

export default async function EnquiryDetailPage({ params }) {
  await requireAdmin();
  const { id } = await params;
  const [e, users] = await Promise.all([
    enquiryService.getEnquiry(id),
    userService.listAssignable(),
  ]);
  if (!e) notFound();

  const rows = [
    ["Email", e.email && <a href={`mailto:${e.email}`}>{e.email}</a>],
    [
      "Phone",
      e.phone && (
        <>
          <a href={telHref(e.phone)}>{e.phone}</a>{" "}
          <a
            href={whatsappHref(e.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="ms-2 small"
          >
            <Icon name="whatsapp" /> WhatsApp
          </a>
        </>
      ),
    ],
    ["Company", e.company],
    ["Project location", e.projectLocation],
    ["Requirement", e.requirement],
    ["Solution page", e.category?.name],
    ["Submitted from", e.sourcePage],
    ["Campaign", [e.utmSource, e.utmMedium, e.utmCampaign].filter(Boolean).join(" / ") || "direct"],
    ["Received", formatDateTime(e.createdAt)],
    ["Emailed to sales", e.notifiedAt ? formatDateTime(e.notifiedAt) : "Not yet"],
  ];

  return (
    <>
      <Link href="/admin/enquiries" className="small">
        <Icon name="arrow-left" className="me-1" /> All enquiries
      </Link>
      <div className="d-flex flex-wrap align-items-center gap-3 my-3">
        <h1 className="mb-0">{e.name}</h1>
        <span className={`status-badge is-${e.status}`}>{e.status}</span>
      </div>

      <div className="row g-4">
        <div className="col-xl-7">
          <div className="admin-card">
            <dl className="row mb-0">
              {rows.map(([k, v]) => (
                <div className="col-12 d-flex border-bottom py-2" key={k}>
                  <dt className="col-4 fw-semibold small text-secondary">{k}</dt>
                  <dd className="col-8 mb-0">{v || "—"}</dd>
                </div>
              ))}
            </dl>
            {e.message && (
              <>
                <h2 className="mt-4">Message</h2>
                <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
                  {e.message}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="col-xl-5">
          <div className="admin-card">
            <h2>Follow-up</h2>
            <ActionForm action={updateEnquiry}>
              <input type="hidden" name="id" value={e.id} />
              <div className="mb-3">
                <label htmlFor="status" className="form-label small">
                  Status
                </label>
                <select id="status" name="status" className="form-select" defaultValue={e.status}>
                  {ENQUIRY_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="assignedToId" className="form-label small">
                  Owner
                </label>
                <select
                  id="assignedToId"
                  name="assignedToId"
                  className="form-select"
                  defaultValue={e.assignedToId ?? ""}
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <SubmitButton>Save</SubmitButton>
            </ActionForm>
          </div>

          <div className="admin-card">
            <h2>Notes</h2>
            <ActionForm action={addEnquiryNote} resetOnSuccess>
              <input type="hidden" name="enquiryId" value={e.id} />
              <label htmlFor="body" className="visually-hidden">
                New note
              </label>
              <textarea
                id="body"
                name="body"
                rows={3}
                maxLength={2000}
                className="form-control mb-2"
                placeholder="Called, sent quotation, site visit planned…"
                required
              />
              <SubmitButton className="btn btn-outline-ink btn-sm">Add note</SubmitButton>
            </ActionForm>
            <ul className="list-unstyled mt-3 mb-0">
              {e.notes.map((n) => (
                <li key={n.id} className="border-top pt-2 mt-2">
                  <div className="small text-secondary">
                    {n.author?.name ?? "Former user"} · {formatDateTime(n.createdAt)}
                  </div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{n.body}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
