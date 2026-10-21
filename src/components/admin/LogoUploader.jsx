"use client";

import { useEffect, useRef, useState } from "react";
import { getLogoUploadSignature } from "@/server/modules/client-logos/client-logo.controller";
import { resultMessage } from "@/shared/errors";

/**
 * Uploads one logo straight to Cloudinary and puts the (server-verifiable)
 * upload response into a hidden `upload` field of the surrounding form.
 */
export default function LogoUploader() {
  const [upload, setUpload] = useState(null);
  const [status, setStatus] = useState("");
  const inputRef = useRef(null);

  // Clear the previous upload when the surrounding form resets after saving.
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const onReset = () => {
      setUpload(null);
      setStatus("");
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  async function onChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setStatus("Choose a PNG, JPG or WebP image under 5 MB.");
      return;
    }
    setStatus("Uploading…");
    try {
      const sig = await getLogoUploadSignature();
      if (sig.ok === false) throw new Error(resultMessage(sig));
      const form = new FormData();
      form.append("file", file);
      for (const k of ["timestamp", "folder", "allowed_formats", "signature"])
        form.append(k, String(sig[k]));
      form.append("api_key", sig.apiKey);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Upload failed");
      setUpload(data);
      setStatus("Uploaded ✓");
    } catch (err) {
      setStatus(err.message);
      setUpload(null);
    }
  }

  return (
    <div>
      <label htmlFor="logo-file" className="form-label small fw-semibold">
        Logo image *
      </label>
      <input
        ref={inputRef}
        id="logo-file"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="form-control"
        onChange={onChange}
      />
      <input type="hidden" name="upload" value={upload ? JSON.stringify(upload) : ""} />
      {status && (
        <div className="form-text" aria-live="polite">
          {status}
        </div>
      )}
    </div>
  );
}
