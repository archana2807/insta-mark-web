import Link from "next/link";
import { notFound } from "next/navigation";
import * as categoryService from "@/server/modules/categories/category.service";
import { requireAdmin } from "@/server/auth/session";
import * as mediaService from "@/server/modules/media/media.service";
import { updateCategory } from "@/server/modules/categories/category.controller";
import ActionForm from "@/components/admin/ActionForm";
import SubmitButton from "@/components/admin/SubmitButton";
import ImageManager from "@/components/admin/ImageManager";
import Icon from "@/components/ui/Icon";
import { CHOOSABLE_ICONS } from "@/components/ui/icons.generated";

export const metadata = { title: "Edit category" };

function Field({ label, hint, children, id }) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label small fw-semibold">
        {label}
      </label>
      {children}
      {hint && <div className="form-text">{hint}</div>}
    </div>
  );
}

export default async function EditCategoryPage({ params }) {
  await requireAdmin();
  const { id } = await params;
  const c = await categoryService.getForEdit(id);
  if (!c) notFound();

  const images = c.images.map((i) => ({
    id: i.id,
    assetId: i.assetId,
    type: i.type,
    src: i.asset.url,
    alt: i.asset.alt,
  }));

  return (
    <>
      <Link href="/admin/categories" className="small">
        <Icon name="arrow-left" className="me-1" /> All categories
      </Link>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 my-3">
        <h1 className="mb-0">{c.name}</h1>
        <a href={`/solutions/${c.slug}`} target="_blank" className="btn btn-outline-ink btn-sm">
          View page <Icon name="box-arrow-up-right" className="ms-1" />
        </a>
      </div>

      <div className="admin-card">
        <h2>Photos</h2>
        <ImageManager
          kind="category"
          ownerId={c.id}
          ownerName={c.name}
          images={images}
          coverAssetId={c.heroImageId}
          uploadsEnabled={mediaService.isUploadEnabled()}
        />
      </div>

      <div className="admin-card">
        <h2>Page content</h2>
        <ActionForm action={updateCategory}>
          <input type="hidden" name="id" value={c.id} />
          <div className="row g-3">
            <div className="col-md-6">
              <Field id="name" label="Name">
                <input
                  id="name"
                  name="name"
                  className="form-control"
                  defaultValue={c.name}
                  required
                  maxLength={100}
                />
              </Field>
            </div>
            <div className="col-md-6">
              <Field
                id="slug"
                label="URL"
                hint="Fixed — changing it would break links and Google rankings."
              >
                <input
                  id="slug"
                  className="form-control"
                  value={`/solutions/${c.slug}`}
                  readOnly
                  disabled
                />
              </Field>
            </div>
            <div className="col-md-4">
              <Field id="group" label="Menu group">
                <select id="group" name="group" className="form-select" defaultValue={c.group}>
                  <option value="ARCHITECTURAL">Architectural Signage</option>
                  <option value="ROAD_SAFETY">Road Safety Solutions</option>
                </select>
              </Field>
            </div>
            <div className="col-md-4">
              <Field
                id="icon"
                label={
                  <>
                    Icon <Icon name={c.icon ?? "signpost"} className="ms-1 text-primary" />
                  </>
                }
                hint="Shown in the menu and when a category has no photo."
              >
                <select id="icon" name="icon" className="form-select" defaultValue={c.icon ?? ""}>
                  <option value="">Default (signpost)</option>
                  {CHOOSABLE_ICONS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="col-6 col-md-2">
              <Field id="sortOrder" label="Order">
                <input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  min={0}
                  className="form-control"
                  defaultValue={c.sortOrder}
                />
              </Field>
            </div>
            <div className="col-6 col-md-2 d-flex align-items-center">
              <div className="form-check mt-3">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  className="form-check-input"
                  defaultChecked={c.isActive}
                />
                <label htmlFor="isActive" className="form-check-label">
                  Visible
                </label>
              </div>
            </div>
          </div>
          <Field
            id="shortDescription"
            label="Card text"
            hint="One line shown on the home page grid (max 300)."
          >
            <textarea
              id="shortDescription"
              name="shortDescription"
              rows={2}
              maxLength={300}
              className="form-control"
              defaultValue={c.shortDescription}
              required
            />
          </Field>
          <Field id="overview" label="Overview">
            <textarea
              id="overview"
              name="overview"
              rows={5}
              className="form-control"
              defaultValue={c.overview}
              required
            />
          </Field>
          <div className="row g-3">
            <div className="col-md-6">
              <Field id="features" label="Key features" hint="One per line.">
                <textarea
                  id="features"
                  name="features"
                  rows={6}
                  className="form-control"
                  defaultValue={(Array.isArray(c.features) ? c.features : []).join("\n")}
                  required
                />
              </Field>
            </div>
            <div className="col-md-6">
              <Field id="applications" label="Applications">
                <textarea
                  id="applications"
                  name="applications"
                  rows={6}
                  className="form-control"
                  defaultValue={c.applications}
                  required
                />
              </Field>
            </div>
          </div>
          <h3 className="h6 mt-2">Search engines (optional)</h3>
          <div className="row g-3">
            <div className="col-md-6">
              <Field id="seoTitle" label="SEO title" hint="Max 70 characters. Empty = automatic.">
                <input
                  id="seoTitle"
                  name="seoTitle"
                  maxLength={70}
                  className="form-control"
                  defaultValue={c.seoTitle ?? ""}
                />
              </Field>
            </div>
            <div className="col-md-6">
              <Field
                id="seoDescription"
                label="SEO description"
                hint="Max 160 characters. Empty = card text."
              >
                <input
                  id="seoDescription"
                  name="seoDescription"
                  maxLength={160}
                  className="form-control"
                  defaultValue={c.seoDescription ?? ""}
                />
              </Field>
            </div>
          </div>
          <SubmitButton>Save changes</SubmitButton>
        </ActionForm>
      </div>
    </>
  );
}
