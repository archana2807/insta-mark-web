"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  addBannerSlide,
  getBannerUploadSignature,
  moveBannerSlide,
  removeBannerImage,
  removeBannerSlide,
  saveBannerAlt,
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
    title: "Desktop photo",
    where: `Shown on screens ${BANNER.breakpoint} px and wider.`,
  },
  {
    slot: "mobile",
    title: "Mobile photo",
    where: `Shown on phones and tablets (narrower than ${BANNER.breakpoint} px). Without it, the desktop photo is used.`,
  },
];

/**
 * One photo of one slide: preview, upload (direct to Cloudinary, signed and verified by the
 * server) and remove.
 * @param {{ slide: number, slot: "desktop" | "mobile", title: string, where: string, image: { src: string, width: number, height: number, alt: string } | null, uploadsEnabled: boolean }} props
 */
function Slot({ slide, slot, title, where, image, uploadsEnabled }) {
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
      const res = await saveBannerImage({ slide, slot, upload });
      if (res.ok === false) throw new Error(resultMessage(res));
      setStatus("");
      router.refresh();
    } catch (err) {
      setStatus("");
      setError(err.message);
    }
  }

  return (
    <div data-banner-slot={slot}>
      <h3 className="h6">{title}</h3>
      <p className="text-secondary small">
        {where} Recommended {size.width} × {size.height} px (minimum {size.minWidth} ×{" "}
        {size.minHeight} px).
      </p>
      {image ? (
        <div className="position-relative bg-light mb-3" style={{ maxWidth: 320 }}>
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes="320px"
            style={{ width: "100%", height: "auto" }}
          />
        </div>
      ) : (
        <p className="text-secondary mb-3">
          No {slot} banner yet —{" "}
          {slot === "mobile"
            ? "phones use the desktop photo."
            : "this slide is skipped on the website until it has a photo."}
        </p>
      )}
      <div aria-live="polite">
        {status && <div className="alert alert-secondary py-2">{status}</div>}
        {error && <div className="alert alert-danger py-2">{error}</div>}
      </div>
      <div className="d-flex flex-wrap align-items-center gap-3">
        {uploadsEnabled && (
          <div>
            <label htmlFor={`banner-${slide}-${slot}`} className="form-label small fw-semibold">
              {image ? "Replace photo" : "Upload photo"}
            </label>
            <input
              id={`banner-${slide}-${slot}`}
              type="file"
              accept="image/jpeg,image/webp,image/png"
              className="form-control form-control-sm"
              onChange={onChange}
            />
          </div>
        )}
        {image && (
          <ActionForm action={removeBannerImage}>
            <input type="hidden" name="slide" value={slide} />
            <input type="hidden" name="slot" value={slot} />
            <SubmitButton
              className="btn btn-outline-ink btn-sm"
              confirm={`Remove the ${slot} photo of slide ${slide + 1}?`}
            >
              Remove {slot} photo
            </SubmitButton>
          </ActionForm>
        )}
      </div>
    </div>
  );
}

/**
 * One slide card: order buttons, remove, the two photos and the alt text.
 * @param {{ index: number, total: number, slide: { desktop: object | null, mobile: object | null, alt: string }, uploadsEnabled: boolean }} props
 */
function SlideCard({ index, total, slide, uploadsEnabled }) {
  return (
    <section className="admin-card" data-slide={index} aria-label={`Slide ${index + 1}`}>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h2 className="mb-0">Slide {index + 1}</h2>
        <div className="d-flex flex-wrap gap-2">
          {index > 0 && (
            <ActionForm action={moveBannerSlide}>
              <input type="hidden" name="slide" value={index} />
              <input type="hidden" name="direction" value="up" />
              <SubmitButton className="btn btn-outline-ink btn-sm">Move earlier</SubmitButton>
            </ActionForm>
          )}
          {index < total - 1 && (
            <ActionForm action={moveBannerSlide}>
              <input type="hidden" name="slide" value={index} />
              <input type="hidden" name="direction" value="down" />
              <SubmitButton className="btn btn-outline-ink btn-sm">Move later</SubmitButton>
            </ActionForm>
          )}
          <ActionForm action={removeBannerSlide}>
            <input type="hidden" name="slide" value={index} />
            <SubmitButton
              className="btn btn-outline-ink btn-sm"
              confirm={`Remove slide ${index + 1} and its photos?`}
            >
              Remove slide
            </SubmitButton>
          </ActionForm>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {SLOTS.map((s) => (
          <div className="col-xl-6" key={s.slot}>
            <Slot
              {...s}
              slide={index}
              image={s.slot === "desktop" ? slide.desktop : slide.mobile}
              uploadsEnabled={uploadsEnabled}
            />
          </div>
        ))}
      </div>

      <ActionForm action={saveBannerAlt}>
        <input type="hidden" name="slide" value={index} />
        <label htmlFor={`banner-alt-${index}`} className="form-label small fw-semibold">
          Describe this slide’s photo (read out by screen readers)
        </label>
        <input
          id={`banner-alt-${index}`}
          name="alt"
          className="form-control mb-2"
          defaultValue={slide.alt}
          maxLength={255}
          required
        />
        <SubmitButton className="btn btn-dark btn-sm">Save alt text</SubmitButton>
      </ActionForm>
    </section>
  );
}

/**
 * The home banner slider for /admin/banner: 1–3 slides, each with a desktop and a mobile
 * photo, in a changeable order. With one slide the website shows a plain photo (no slider).
 * @param {{ slides: { desktop: object | null, mobile: object | null, alt: string }[], uploadsEnabled: boolean }} props
 */
export default function BannerManager({ slides, uploadsEnabled }) {
  return (
    <>
      {!uploadsEnabled && (
        <div className="alert alert-info">
          Banner uploads need Cloudinary (CLOUDINARY_* settings). Until then the website shows its
          three current photos.
        </div>
      )}
      {slides.length === 0 && (
        <p className="text-secondary">
          No slides yet: the website shows its three current photos as a slider. Add a slide to
          replace them with your own.
        </p>
      )}
      <div className="d-grid gap-4 mb-4">
        {slides.map((slide, i) => (
          <SlideCard
            index={i}
            total={slides.length}
            slide={slide}
            uploadsEnabled={uploadsEnabled}
            key={i}
          />
        ))}
      </div>
      {slides.length < BANNER.maxSlides && (
        <ActionForm action={addBannerSlide}>
          <SubmitButton className="btn btn-dark">Add a slide</SubmitButton>
          <span className="text-secondary small ms-3">
            {slides.length} of {BANNER.maxSlides} slides. With one slide the website shows a plain
            photo; with two or three it becomes a slider.
          </span>
        </ActionForm>
      )}
    </>
  );
}
