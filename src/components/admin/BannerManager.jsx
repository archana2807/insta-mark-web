"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  getBannerUploadSignature,
  removeBannerImage,
  saveBannerImage,
} from "@/server/modules/banner/banner.controller";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { BANNER } from "@/shared/constants";
import { resultMessage } from "@/shared/errors";
import ActionForm from "./ActionForm";
import SubmitButton from "./SubmitButton";

const MAX_BYTES = 10 * 1024 * 1024;

const SLOTS = [
  {
    slot: "desktop",
    title: "Desktop banner",
    where: `Shown on screens ${BANNER.breakpoint} px and wider.`,
  },
  {
    slot: "mobile",
    title: "Mobile banner",
    where: `Shown on phones and tablets (narrower than ${BANNER.breakpoint} px). Without it, the desktop banner is used.`,
  },
];

/**
 * One banner slot: preview, upload (direct to Cloudinary, signed and verified by the
 * server) and remove.
 * @param {{ slot: "desktop" | "mobile", title: string, where: string, image: { src: string, width: number, height: number, alt: string } | null, uploadsEnabled: boolean }} props
 */
function Slot({ slot, title, where, image, uploadsEnabled }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const size = BANNER[slot];

  async function onChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) return setError(`${file.name} is not an image.`);
    if (file.size > MAX_BYTES) return setError(`${file.name} is larger than 10 MB.`);
    try {
      setStatus(`Uploading ${file.name}…`);
      const sig = await getBannerUploadSignature({ slot });
      if (sig.ok === false) throw new Error(resultMessage(sig));
      const upload = await uploadToCloudinary(file, sig);
      setStatus("Checking and saving…");
      const res = await saveBannerImage({ slot, upload });
      if (res.ok === false) throw new Error(resultMessage(res));
      setStatus("");
      router.refresh();
    } catch (err) {
      setStatus("");
      setError(err.message);
    }
  }

  return (
    <div className="admin-card" data-banner-slot={slot}>
      <h2>{title}</h2>
      <p className="text-secondary small">
        {where} Recommended {size.width} × {size.height} px (minimum {size.minWidth} ×{" "}
        {size.minHeight} px).
      </p>
      {image ? (
        <div className="position-relative bg-light mb-3" style={{ maxWidth: 360 }}>
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes="360px"
            style={{ width: "100%", height: "auto" }}
          />
        </div>
      ) : (
        <p className="text-secondary mb-3">
          No {slot} banner yet — the website shows the current photo.
        </p>
      )}
      <div aria-live="polite">
        {status && <div className="alert alert-secondary py-2">{status}</div>}
        {error && <div className="alert alert-danger py-2">{error}</div>}
      </div>
      <div className="d-flex flex-wrap align-items-center gap-3">
        {uploadsEnabled && (
          <div>
            <label htmlFor={`banner-${slot}`} className="form-label small fw-semibold">
              {image ? "Replace image" : "Upload image"}
            </label>
            <input
              id={`banner-${slot}`}
              type="file"
              accept="image/jpeg,image/webp,image/png"
              className="form-control form-control-sm"
              onChange={onChange}
            />
          </div>
        )}
        {image && (
          <ActionForm action={removeBannerImage}>
            <input type="hidden" name="slot" value={slot} />
            <SubmitButton
              className="btn btn-outline-ink btn-sm"
              confirm={`Remove the ${slot} banner? The website goes back to the previous photo.`}
            >
              Remove {slot} banner
            </SubmitButton>
          </ActionForm>
        )}
      </div>
    </div>
  );
}

/**
 * Desktop + mobile banner slots for /admin/banner.
 * @param {{ desktop: object | null, mobile: object | null, uploadsEnabled: boolean }} props
 */
export default function BannerManager({ desktop, mobile, uploadsEnabled }) {
  return (
    <>
      {!uploadsEnabled && (
        <div className="alert alert-info">
          Banner uploads need Cloudinary (CLOUDINARY_* settings). Until then the website shows the
          current photo.
        </div>
      )}
      <div className="row g-4">
        {SLOTS.map((s) => (
          <div className="col-xl-6" key={s.slot}>
            <Slot
              {...s}
              image={s.slot === "desktop" ? desktop : mobile}
              uploadsEnabled={uploadsEnabled}
            />
          </div>
        ))}
      </div>
    </>
  );
}
