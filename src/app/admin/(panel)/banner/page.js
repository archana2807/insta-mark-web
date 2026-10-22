import { requireAuth } from "@/server/auth/session";
import * as bannerService from "@/server/modules/banner/banner.service";
import { BANNER } from "@/shared/constants";
import BannerManager from "@/components/admin/BannerManager";

export const metadata = { title: "Home banner" };

const SIZE_ROWS = [
  ["Desktop", BANNER.desktop, "≈ 10:9"],
  ["Mobile", BANNER.mobile, "1:1 (square)"],
];

export default async function BannerPage() {
  await requireAuth("content:write");
  const slides = await bannerService.getForAdmin();

  return (
    <>
      <h1 className="mb-1">Home banner</h1>
      <p className="text-secondary mb-4">
        The large photo next to the home page headline. Add up to three slides, each with a photo
        for wide screens and one for phones, and put them in the order you want. With one slide the
        website shows a plain photo; with two or three it becomes a slider with a pause button.
        Until you add a slide, the website shows its three current photos.
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

      <div className="mt-4">
        <BannerManager slides={slides} uploadsEnabled={bannerService.isUploadEnabled()} />
      </div>
    </>
  );
}
