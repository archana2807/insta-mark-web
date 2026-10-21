import { requireAuth } from "@/server/auth/session";
import * as settingService from "@/server/modules/settings/setting.service";
import { saveSettings } from "@/server/modules/settings/setting.controller";
import ActionForm from "@/components/admin/ActionForm";
import SubmitButton from "@/components/admin/SubmitButton";

export const metadata = { title: "Site settings" };

function Input({ name, label, hint, ...rest }) {
  return (
    <div className="mb-3">
      <label htmlFor={name} className="form-label small fw-semibold">
        {label}
      </label>
      <input id={name} name={name} className="form-control" {...rest} />
      {hint && <div className="form-text">{hint}</div>}
    </div>
  );
}

export default async function SettingsPage() {
  await requireAuth("settings:write");
  const site = await settingService.getSite();
  const { contact, social } = site;

  return (
    <>
      <h1 className="mb-1">Site settings</h1>
      <p className="text-secondary mb-4">
        Empty fields are hidden on the website (no placeholder numbers are ever shown).
      </p>
      <ActionForm action={saveSettings}>
        <div className="admin-card">
          <h2>Contact</h2>
          <div className="row g-3">
            <div className="col-md-4">
              <Input
                name="phone"
                label="Phone"
                defaultValue={contact.phone ?? ""}
                placeholder="+91 98765 43210"
                hint="Shown in the footer and the floating call button."
              />
            </div>
            <div className="col-md-4">
              <Input
                name="whatsapp"
                label="WhatsApp number"
                defaultValue={contact.whatsapp ?? ""}
                placeholder="919876543210"
                hint="Digits only, with country code."
              />
            </div>
            <div className="col-md-4">
              <Input name="email" label="Email" type="email" defaultValue={contact.email ?? ""} />
            </div>
            <div className="col-md-6">
              <Input
                name="addressLine1"
                label="Address"
                defaultValue={contact.address?.line1 ?? ""}
              />
            </div>
            <div className="col-md-3">
              <Input name="city" label="City" defaultValue={contact.address?.city ?? ""} />
            </div>
            <div className="col-md-3">
              <Input name="state" label="State" defaultValue={contact.address?.state ?? ""} />
            </div>
            <div className="col-12">
              <Input
                name="mapEmbedUrl"
                label="Google Maps embed URL"
                defaultValue={contact.mapEmbedUrl ?? ""}
                hint="Google Maps → Share → Embed a map → copy the src URL (https://www.google.com/maps/embed?...)."
              />
            </div>
          </div>
        </div>
        <div className="admin-card">
          <h2>Company &amp; social</h2>
          <div className="row g-3">
            <div className="col-md-3">
              <Input
                name="establishedYear"
                label="Founded (year)"
                type="number"
                defaultValue={site.establishedYear ?? ""}
                hint="Drives the “years of expertise” badge."
              />
            </div>
            {["linkedin", "instagram", "facebook", "youtube"].map((k) => (
              <div className="col-md-6 col-lg-3" key={k}>
                <Input
                  name={k}
                  label={k[0].toUpperCase() + k.slice(1)}
                  defaultValue={social?.[k] ?? ""}
                  placeholder="https://"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <SubmitButton>Save settings</SubmitButton>
        </div>
      </ActionForm>
    </>
  );
}
