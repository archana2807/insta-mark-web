import { requireAuth } from "@/server/auth/session";
import * as bannerService from "@/server/modules/banner/banner.service";
import { saveBannerAlt } from "@/server/modules/banner/banner.controller";
import { BANNER } from "@/shared/constants";
import ActionForm from "@/components/admin/ActionForm";
import BannerManager from "@/components/admin/BannerManager";
import SubmitButton from "@/components/admin/SubmitButton";

export const metadata = { title: "Home banner" };

const SIZE_ROWS = [
  ["Desktop", BANNER.desktop, "≈ 10:9"],
  ["Mobile", BANNER.mobile, "1:1 (square)"],
];

export default async function BannerPage() {
  await requireAuth("content:write");
  const banner = await bannerService.getForAdmin();

  return (
    <>
      <h1 className="mb-1">Home banner</h1>
      <p className="text-secondary mb-4">
        The large image next to the home page headline. Upload one for wide screens and one for
        phones; until then the website shows the current photo.
      </p>

      <div className="admin-card p-0">
        <div className="p-3 border-bottom">
          <h2 className="mb-0">Sizes for the design team</h2>
        </div>
        <div className="table-responsive">
          <table className="table admin-table">
            <thead>
              <tr>
                <th>Banner</th>
                <th>Upload size</th>
                <th>Shape</th>
                <th>Safe area (keep text and logos inside)</th>
                <th>Format</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_ROWS.map(([label, s, shape]) => (
                <tr key={label}>
                  <td className="fw-semibold">{label}</td>
                  <td>
                    {s.width} × {s.height} px
                  </td>
                  <td>{shape}</td>
                  <td>centre {s.safeArea}</td>
                  <td>JPG or WebP, ≤ {s.maxKb} KB</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <BannerManager
        desktop={banner.desktop}
        mobile={banner.mobile}
        uploadsEnabled={bannerService.isUploadEnabled()}
      />

      <div className="admin-card" style={{ maxWidth: 720 }}>
        <h2>Alt text</h2>
        <ActionForm action={saveBannerAlt}>
          <label htmlFor="banner-alt" className="form-label small fw-semibold">
            Describe the banner image (read out by screen readers)
          </label>
          <input
            id="banner-alt"
            name="alt"
            className="form-control mb-2"
            defaultValue={banner.alt}
            maxLength={255}
            required
          />
          <SubmitButton className="btn btn-dark btn-sm">Save alt text</SubmitButton>
        </ActionForm>
      </div>
    </>
  );
}
