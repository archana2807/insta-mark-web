// Client logos for the home page "Trusted by" strip. Without a database there are none.
import "server-only";
import { toImage } from "@/lib/image";
import { TAGS, cached, revalidateClients, revalidatePage } from "@/server/cache";
import { isDatabaseConfigured } from "@/server/config/env";
import * as auditService from "@/server/modules/audit/audit.service";
import * as mediaService from "@/server/modules/media/media.service";
import * as clientLogoRepository from "./client-logo.repository";

const loadClientLogos = cached(
  async () =>
    (await clientLogoRepository.findActive()).map((r) => ({
      name: r.name,
      websiteUrl: r.websiteUrl,
      logo: toImage(r.logo),
    })),
  ["clients"],
  [TAGS.clients],
);

/** @param {string} [message] */
function done(message) {
  revalidateClients();
  revalidatePage("/admin/clients");
  return { ok: true, message };
}

/** Active logos for the public site. */
export async function listClientLogos() {
  return isDatabaseConfigured() ? loadClientLogos() : [];
}

export async function listForAdmin() {
  return clientLogoRepository.findAllWithLogo();
}

/** @returns {boolean} whether logo uploads are possible (Cloudinary set up) */
export function isUploadEnabled() {
  return mediaService.isUploadEnabled();
}

/** Signed params for a logo upload. */
export async function getUploadSignature() {
  return mediaService.getLogoUploadSignature();
}

/**
 * @param {import("@/shared/schemas/client-logo.schema").ClientLogoInput} fields
 * @param {import("@/shared/schemas/media.schema").CloudinaryUpload} upload
 * @param {{ id: string }} actor
 */
export async function createClientLogo(fields, upload, actor) {
  if (!mediaService.isGenuineUpload(upload)) return { error: "Upload could not be verified." };
  const asset = await mediaService.saveAsset(upload, `${fields.name} logo`);
  const logo = await clientLogoRepository.create({ ...fields, logoId: asset.id });
  await auditService.log(actor, "CREATE", "ClientLogo", logo.id, { name: [null, logo.name] });
  return { ...done("Logo added."), reset: Date.now() };
}

/**
 * @param {string} id
 * @param {import("@/shared/schemas/client-logo.schema").ClientLogoInput} fields
 * @param {{ id: string }} actor
 */
export async function updateClientLogo(id, fields, actor) {
  const before = await clientLogoRepository.findById(id);
  if (!before) return { error: "Logo not found." };
  await clientLogoRepository.update(id, fields);
  await mediaService.updateAlt(before.logoId, `${fields.name} logo`);
  await auditService.log(actor, "UPDATE", "ClientLogo", id, auditService.diff(before, fields));
  return done("Saved.");
}

/**
 * @param {string} id
 * @param {{ id: string }} actor
 * @returns {Promise<void>}
 */
export async function deleteClientLogo(id, actor) {
  const logo = await clientLogoRepository.findById(id);
  if (!logo) return;
  await clientLogoRepository.remove(id);
  await mediaService.deleteAssetsIfUnused([logo.logoId]);
  await auditService.log(actor, "DELETE", "ClientLogo", id, { name: [logo.name, null] });
  done();
}
