"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  attachUploadedImage,
  getUploadSignature,
  moveImage,
  removeImage,
  setCoverImage,
  updateImage,
} from "@/server/modules/media/media.controller";
import ActionForm from "./ActionForm";
import SubmitButton from "./SubmitButton";
import ClientIcon from "@/components/ui/ClientIcon";

const MAX_BYTES = 10 * 1024 * 1024;

async function uploadToCloudinary(file, sig) {
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("folder", sig.folder);
  form.append("allowed_formats", sig.allowed_formats);
  form.append("signature", sig.signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? `Upload failed (${res.status})`);
  return data;
}

/**
 * Gallery editor for a category or project: upload (direct to Cloudinary,
 * signed by the server), alt text, type, order, cover and remove.
 */
export default function ImageManager({
  kind,
  ownerId,
  ownerName,
  images,
  coverAssetId,
  uploadsEnabled,
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [uploadType, setUploadType] = useState("EXECUTED");

  async function onFiles(e) {
    const files = [...e.target.files];
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    setError("");
    try {
      for (const [i, file] of files.entries()) {
        if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image.`);
        if (file.size > MAX_BYTES) throw new Error(`${file.name} is larger than 10 MB.`);
        setProgress(`Uploading ${i + 1} of ${files.length}: ${file.name}`);
        const sig = await getUploadSignature({ kind, ownerId, type: uploadType });
        if (sig.error) throw new Error(sig.error);
        const upload = await uploadToCloudinary(file, sig);
        const res = await attachUploadedImage({
          kind,
          ownerId,
          type: uploadType,
          alt: `${ownerName} — ${file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")}`,
          upload,
        });
        if (res.error) throw new Error(res.error);
      }
      setProgress("");
      router.refresh();
    } catch (err) {
      setError(err.message);
      setProgress("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
        {uploadsEnabled ? (
          <>
            {kind === "category" && (
              <select
                className="form-select form-select-sm w-auto"
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                aria-label="Type of photos to upload"
              >
                <option value="EXECUTED">Executed site photos</option>
                <option value="CATALOGUE">Catalogue / product images</option>
              </select>
            )}
            <label className={`btn btn-dark btn-sm mb-0 ${busy ? "disabled" : ""}`}>
              <ClientIcon name="upload" className="me-1" /> Upload photos
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                hidden
                disabled={busy}
                onChange={onFiles}
              />
            </label>
            <small className="text-secondary">JPG, PNG, WebP or AVIF · max 10 MB each</small>
          </>
        ) : (
          <div className="alert alert-info py-2 mb-0">
            Photo uploads need Cloudinary (CLOUDINARY_* settings). Existing photos can still be
            edited, reordered and removed.
          </div>
        )}
      </div>
      <div aria-live="polite">
        {progress && <div className="alert alert-secondary py-2">{progress}</div>}
        {error && <div className="alert alert-danger py-2">{error}</div>}
      </div>

      {images.length === 0 ? (
        <p className="text-secondary">No photos yet.</p>
      ) : (
        <ul className="image-manager list-unstyled mb-0">
          {images.map((img, i) => (
            <li key={img.id} className="image-manager__item">
              <div className="thumb">
                <Image src={img.src} alt="" fill sizes="240px" />
                {img.assetId === coverAssetId && (
                  <span className="badge bg-dark position-absolute top-0 start-0 m-2">Cover</span>
                )}
                {img.type === "CATALOGUE" && (
                  <span className="badge bg-secondary position-absolute top-0 end-0 m-2">
                    Catalogue
                  </span>
                )}
              </div>
              <div className="body">
                <ActionForm action={updateImage}>
                  <input type="hidden" name="kind" value={kind} />
                  <input type="hidden" name="id" value={img.id} />
                  <label className="form-label small mb-1" htmlFor={`alt-${img.id}`}>
                    Alt text (describe the photo)
                  </label>
                  <textarea
                    id={`alt-${img.id}`}
                    name="alt"
                    rows={2}
                    maxLength={255}
                    className="form-control form-control-sm mb-2"
                    defaultValue={img.alt}
                  />
                  {kind === "category" && (
                    <select
                      name="type"
                      className="form-select form-select-sm mb-2"
                      defaultValue={img.type}
                      aria-label="Photo type"
                    >
                      <option value="EXECUTED">Executed site photo</option>
                      <option value="CATALOGUE">Catalogue image</option>
                    </select>
                  )}
                  <SubmitButton className="btn btn-outline-ink btn-sm w-100">Save</SubmitButton>
                </ActionForm>
                <div className="d-flex gap-1">
                  {[
                    ["up", "arrow-up", i === 0],
                    ["down", "arrow-down", i === images.length - 1],
                  ].map(([direction, icon, disabled]) => (
                    <form action={moveImage} key={direction}>
                      <input type="hidden" name="kind" value={kind} />
                      <input type="hidden" name="id" value={img.id} />
                      <input type="hidden" name="direction" value={direction} />
                      <SubmitButton
                        className="btn btn-light btn-sm"
                        disabled={disabled}
                        aria-label={`Move ${direction}`}
                      >
                        <ClientIcon name={icon} />
                      </SubmitButton>
                    </form>
                  ))}
                  {img.assetId !== coverAssetId && (
                    <form action={setCoverImage}>
                      <input type="hidden" name="kind" value={kind} />
                      <input type="hidden" name="id" value={img.id} />
                      <SubmitButton className="btn btn-light btn-sm">Set cover</SubmitButton>
                    </form>
                  )}
                  <form action={removeImage} className="ms-auto">
                    <input type="hidden" name="kind" value={kind} />
                    <input type="hidden" name="id" value={img.id} />
                    <SubmitButton
                      className="btn btn-light btn-sm text-danger"
                      confirm="Remove this photo from the gallery?"
                      aria-label="Remove photo"
                    >
                      <ClientIcon name="trash" />
                    </SubmitButton>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
