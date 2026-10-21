// Browser helper: uploads one file straight to Cloudinary with server-signed params
// (from a controller's get…UploadSignature action). Returns Cloudinary's response,
// which the server verifies before using it.

/**
 * @param {File} file
 * @param {{ cloudName: string, apiKey: string, timestamp: number, folder: string, allowed_formats: string, signature: string }} sig
 * @returns {Promise<object>} Cloudinary upload response
 */
export async function uploadToCloudinary(file, sig) {
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
