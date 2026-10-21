// FAQs: public lists (home, general, per category) and admin CRUD.
import "server-only";
import { faqs as contentFaqs } from "@/content/company";
import { TAGS, cached, revalidateFaqs, revalidatePage } from "@/server/cache";
import { isDatabaseConfigured } from "@/server/config/env";
import * as auditService from "@/server/modules/audit/audit.service";
import * as categoryService from "@/server/modules/categories/category.service";
import * as faqRepository from "./faq.repository";

/** @param {string | null | undefined} scope */
const loadFaqs = (scope) =>
  cached(
    () => faqRepository.findPublic(scope),
    ["faqs", scope ?? "global"],
    [TAGS.faqs, ...(scope && scope !== "home" ? [TAGS.category(scope)] : [])],
  )();

/**
 * categorySlug → that page's FAQs; "home" → general FAQs ticked for the home page; else general.
 * @param {string} [scope]
 * @returns {Promise<{ question: string, answer: string }[]>}
 */
export async function listFaqs(scope) {
  if (!isDatabaseConfigured()) return scope && scope !== "home" ? [] : contentFaqs;
  return loadFaqs(scope);
}

/** Every FAQ with its category name, for the admin page. */
export async function listForAdmin() {
  return faqRepository.findAllWithCategory();
}

/**
 * Creates (no id) or updates an FAQ.
 * @param {string} id empty for a new FAQ
 * @param {import("@/shared/schemas/faq.schema").FaqInput} data
 * @param {{ id: string }} actor
 */
export async function saveFaq(id, data, actor) {
  if (id) {
    const before = await faqRepository.findById(id);
    if (!before) return { error: "FAQ not found." };
    await faqRepository.update(id, data);
    await auditService.log(actor, "UPDATE", "Faq", id, auditService.diff(before, data));
    revalidateFaqs(await categoryService.findSlugById(before.categoryId));
  } else {
    const faq = await faqRepository.create(data);
    await auditService.log(actor, "CREATE", "Faq", faq.id, { question: [null, faq.question] });
  }
  revalidateFaqs(await categoryService.findSlugById(data.categoryId));
  revalidatePage("/admin/faqs");
  return { ok: true, message: id ? "Saved." : "FAQ added.", reset: id ? undefined : Date.now() };
}

/**
 * @param {string} id
 * @param {{ id: string }} actor
 * @returns {Promise<void>}
 */
export async function deleteFaq(id, actor) {
  const faq = await faqRepository.findById(id);
  if (!faq) return;
  await faqRepository.remove(id);
  await auditService.log(actor, "DELETE", "Faq", id, { question: [faq.question, null] });
  revalidateFaqs(await categoryService.findSlugById(faq.categoryId));
  revalidatePage("/admin/faqs");
}
