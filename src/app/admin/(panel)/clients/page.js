import Image from "next/image";
import * as clientLogoService from "@/server/modules/client-logos/client-logo.service";
import { requireAuth } from "@/server/auth/session";
import {
  createClientLogo,
  deleteClientLogo,
  updateClientLogo,
} from "@/server/modules/client-logos/client-logo.controller";
import ActionForm from "@/components/admin/ActionForm";
import SubmitButton from "@/components/admin/SubmitButton";
import LogoUploader from "@/components/admin/LogoUploader";
import Icon from "@/components/ui/Icon";
import EmptyState from "@/components/shared/EmptyState";

export const metadata = { title: "Client logos" };

export default async function ClientsPage() {
  await requireAuth("content:write");
  const logos = await clientLogoService.listForAdmin();
  const uploads = clientLogoService.isUploadEnabled();

  return (
    <>
      <h1 className="mb-1">Client logos</h1>
      <p className="text-secondary mb-4">
        Shown in the “Trusted by” strip on the home page. Only add brands the client has permission
        to display.
      </p>

      <div className="admin-card">
        <h2>Add a logo</h2>
        {uploads ? (
          <ActionForm action={createClientLogo} resetOnSuccess>
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <LogoUploader />
              </div>
              <div className="col-md-3">
                <label htmlFor="new-name" className="form-label small fw-semibold">
                  Company name *
                </label>
                <input
                  id="new-name"
                  name="name"
                  className="form-control"
                  required
                  maxLength={150}
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="new-url" className="form-label small fw-semibold">
                  Website
                </label>
                <input
                  id="new-url"
                  name="websiteUrl"
                  className="form-control"
                  placeholder="https://"
                />
              </div>
              <div className="col-md-2">
                <input type="hidden" name="isActive" value="on" />
                <SubmitButton className="btn btn-dark w-100">Add</SubmitButton>
              </div>
            </div>
          </ActionForm>
        ) : (
          <div className="alert alert-info mb-0">
            Adding logos needs Cloudinary (CLOUDINARY_* settings).
          </div>
        )}
      </div>

      <div className="admin-card">
        <h2>Logos ({logos.length})</h2>
        {logos.length === 0 && (
          <EmptyState>No logos yet — the strip is hidden on the website.</EmptyState>
        )}
        <ul className="list-unstyled mb-0">
          {logos.map((l) => (
            <li key={l.id} className="d-flex flex-wrap align-items-center gap-3 border-top py-3">
              <div className="position-relative bg-light" style={{ width: 120, height: 60 }}>
                <Image
                  src={l.logo.url}
                  alt={l.logo.alt}
                  fill
                  sizes="120px"
                  style={{ objectFit: "contain" }}
                />
              </div>
              <ActionForm action={updateClientLogo} className="flex-grow-1">
                <input type="hidden" name="id" value={l.id} />
                <div className="row g-2 align-items-center">
                  <div className="col-md-4">
                    <input
                      name="name"
                      className="form-control form-control-sm"
                      defaultValue={l.name}
                      aria-label="Company name"
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      name="websiteUrl"
                      className="form-control form-control-sm"
                      defaultValue={l.websiteUrl ?? ""}
                      aria-label="Website"
                    />
                  </div>
                  <div className="col-4 col-md-1">
                    <input
                      name="sortOrder"
                      type="number"
                      min={0}
                      className="form-control form-control-sm"
                      defaultValue={l.sortOrder}
                      aria-label="Order"
                    />
                  </div>
                  <div className="col-4 col-md-1">
                    <div className="form-check">
                      <input
                        id={`act-${l.id}`}
                        name="isActive"
                        type="checkbox"
                        className="form-check-input"
                        defaultChecked={l.isActive}
                      />
                      <label htmlFor={`act-${l.id}`} className="form-check-label small">
                        On
                      </label>
                    </div>
                  </div>
                  <div className="col-4 col-md-2">
                    <SubmitButton className="btn btn-outline-ink btn-sm w-100">Save</SubmitButton>
                  </div>
                </div>
              </ActionForm>
              <form action={deleteClientLogo}>
                <input type="hidden" name="id" value={l.id} />
                <SubmitButton
                  className="btn btn-light btn-sm text-danger"
                  confirm={`Remove ${l.name}?`}
                  aria-label={`Remove ${l.name}`}
                >
                  <Icon name="trash" />
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
