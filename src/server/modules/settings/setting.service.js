// Site settings: contact details, socials, founding year. Without a database the
// /content defaults are used.
import "server-only";
import { site as siteDefaults } from "@/content/site";
import { TAGS, cached, revalidatePage, revalidateSettings } from "@/server/cache";
import { isDatabaseConfigured } from "@/server/config/env";
import * as auditService from "@/server/modules/audit/audit.service";
import * as settingRepository from "./setting.repository";

const loadSettings = cached(() => settingRepository.findAllAsMap(), ["settings"], [TAGS.settings]);

/**
 * Site settings from `site_settings`, falling back to /content defaults.
 * @returns {Promise<typeof siteDefaults>}
 */
export async function getSite() {
  if (!isDatabaseConfigured()) return siteDefaults;
  const s = await loadSettings();
  const pick = (key, fallback) => ((s[key] ?? null) !== null ? s[key] : fallback);
  const d = siteDefaults;
  return {
    ...d,
    establishedYear: pick("company.establishedYear", d.establishedYear),
    contact: {
      phone: pick("contact.phone", d.contact.phone),
      whatsapp: pick("contact.whatsapp", d.contact.whatsapp),
      email: pick("contact.email", d.contact.email),
      address: { ...d.contact.address, ...(pick("contact.address", {}) ?? {}) },
      mapEmbedUrl: pick("contact.mapEmbedUrl", d.contact.mapEmbedUrl),
    },
    social: { ...d.social, ...(pick("social", {}) ?? {}) },
  };
}

/**
 * @param {import("@/shared/schemas/setting.schema").SettingsInput} s
 * @param {{ id: string }} actor
 */
export async function saveSettings(s, actor) {
  const values = {
    "contact.phone": s.phone,
    "contact.whatsapp": s.whatsapp,
    "contact.email": s.email,
    "contact.address": { line1: s.addressLine1, city: s.city, state: s.state, country: "India" },
    "contact.mapEmbedUrl": s.mapEmbedUrl,
    social: {
      linkedin: s.linkedin,
      instagram: s.instagram,
      facebook: s.facebook,
      youtube: s.youtube,
    },
    "company.establishedYear": s.establishedYear,
  };

  const before = await settingRepository.findAllAsMap();
  await settingRepository.upsertMany(values);
  const changes = {};
  for (const [k, v] of Object.entries(values)) {
    if (JSON.stringify(before[k] ?? null) !== JSON.stringify(v ?? null))
      changes[k] = [before[k] ?? null, v];
  }
  await auditService.log(actor, "UPDATE", "SiteSetting", null, changes);
  revalidateSettings();
  revalidatePage("/admin/settings");
  return { ok: true, message: "Settings saved. The website updates within a few seconds." };
}
