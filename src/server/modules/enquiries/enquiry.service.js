// Enquiries: the public form (validate → store → email), the admin follow-up,
// the CSV export, dashboard numbers and the daily maintenance job.
import "server-only";
import { logger } from "@/server/logger";
import { after } from "next/server";
import { AppError } from "@/server/errors/app-error";
import { ENQUIRY_PAGE_SIZE } from "@/shared/constants";
import { MIN_FILL_MS, cleanField, validateField } from "@/shared/schemas/enquiry-rules";
import { revalidatePage } from "@/server/cache";
import { getEnv, isDatabaseConfigured } from "@/server/config/env";
import {
  isAutoReplyConfigured,
  isEmailConfigured,
  sendEnquiryAutoReply,
  sendEnquiryNotification,
} from "@/server/integrations/resend/resend.adapter";
import {
  isTurnstileEnabled,
  verifyTurnstile,
} from "@/server/integrations/turnstile/turnstile.adapter";
import * as auditService from "@/server/modules/audit/audit.service";
import * as categoryService from "@/server/modules/categories/category.service";
import * as rateLimitService from "@/server/modules/rate-limits/rate-limit.service";
import * as enquiryRepository from "./enquiry.repository";

const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 }; // 5 submissions / 10 min / IP
const DAY = 24 * 60 * 60 * 1000;
const ago = (ms) => new Date(Date.now() - ms);

const RETENTION = {
  rateLimits: 1 * DAY,
  spamEnquiries: 90 * DAY,
  auditLogs: 365 * DAY,
  enquiriesBeforeAnonymise: 3 * 365 * DAY,
};

const EXPORT_MAX_ROWS = 10000;

/**
 * Counts this submission; a failing limiter never blocks a lead (as before).
 * @param {string} ipHash
 * @returns {Promise<boolean>}
 */
async function isRateLimited(ipHash) {
  try {
    return await rateLimitService.isRateLimited(`enquiry:${ipHash}`, RATE_LIMIT);
  } catch (err) {
    logger.error({ err }, "enquiry rate limit check failed");
    return false;
  }
}

/**
 * @typedef {object} EnquirySubmission
 * @property {string} honeypot hidden "website" field (bots fill it)
 * @property {string | null} fillMs ms the form was open (null without JS)
 * @property {Record<string, string>} raw string fields as submitted
 * @property {import("zod").SafeParseReturnType<unknown, import("@/shared/schemas/enquiry.schema").EnquiryInput>} parsed
 * @property {string | null} turnstileToken
 * @property {{ ip: string | null, ipHash: string | undefined, userAgent: string | undefined }} meta
 */

/**
 * Every enquiry form (contact page + category pages). Order guarantees a lead is never
 * lost: validate → save to DB → then email. Email failure leaves `notified_at` NULL for
 * the retry job.
 * @param {EnquirySubmission} s
 * @returns {Promise<{ redirectTo: string, lead: boolean }>} lead: a real, accepted enquiry
 *   (false for honeypot hits, so they never count as a GA4 conversion)
 * @throws {AppError} ENQUIRY_TOO_FAST, VALIDATION_FAILED, CAPTCHA_FAILED, ENQUIRY_RATE_LIMITED, ENQUIRY_NOT_SAVED
 */
export async function submitEnquiry({ honeypot, fillMs, raw, parsed, turnstileToken, meta }) {
  // Honeypot: real users never see this field. Pretend success for bots.
  if (honeypot) return { redirectTo: "/thank-you", lead: false };

  // Time trap: with JS the form sends how long it was open (measured in the
  // browser, so clock skew doesn't matter). Faster than a human can type → ask
  // to resubmit; never a fake success. Without JS the field is absent.
  if (fillMs !== null && !(Number(fillMs) >= MIN_FILL_MS)) throw new AppError("ENQUIRY_TOO_FAST");

  const fieldErrors = parsed.success ? {} : parsed.error.flatten().fieldErrors;

  // The requirement must be one of the dropdown options (current category names).
  const requirement = cleanField("requirement", raw.requirement);
  if (requirement && !fieldErrors.requirement) {
    const options = (await categoryService.listCategories()).map((c) => c.name);
    const message = validateField("requirement", requirement, { requirementOptions: options });
    if (message) fieldErrors.requirement = [message];
  }

  if (Object.keys(fieldErrors).length > 0) throw new AppError("VALIDATION_FAILED", { fieldErrors });

  const { category: categorySlug, ...data } = parsed.data;
  const { ip, ipHash, userAgent } = meta;

  if (isTurnstileEnabled()) {
    const verdict = await verifyTurnstile(turnstileToken, ip);
    if (verdict === "unavailable") {
      logger.warn("enquiry accepted without Turnstile check (Cloudflare unreachable)");
    }
    if (verdict === "invalid") throw new AppError("CAPTCHA_FAILED");
  }

  let saved = null;

  if (isDatabaseConfigured()) {
    if (ipHash && (await isRateLimited(ipHash))) throw new AppError("ENQUIRY_RATE_LIMITED");
    try {
      const categoryId = categorySlug ? await categoryService.findIdBySlug(categorySlug) : null;
      saved = await enquiryRepository.create({
        ...data,
        categoryId: categoryId ?? undefined,
        ipHash,
        userAgent,
      });
    } catch (err) {
      logger.error({ err }, "enquiry database save failed");
    }
  }

  let emailed = false;
  if (isEmailConfigured()) {
    try {
      await sendEnquiryNotification(data);
      emailed = true;
      if (saved) await enquiryRepository.markNotified(saved.id);
    } catch (err) {
      logger.error({ err, enquiryId: saved?.id ?? null }, "enquiry notification email failed");
    }
  }

  if (!saved && !emailed) {
    // Never pretend success in production if the lead went nowhere.
    if (getEnv().NODE_ENV === "production") throw new AppError("ENQUIRY_NOT_SAVED");
    logger.warn(
      { requirement: data.requirement ?? null, category: categorySlug ?? null },
      "enquiry not stored: DATABASE_URL and RESEND_API_KEY are not configured (dev only)",
    );
  }

  // Auto-reply to the visitor (R-7.8), sent after the response: a slow or failed email
  // never delays or blocks the thank-you page.
  if (isAutoReplyConfigured()) {
    after(async () => {
      try {
        await sendEnquiryAutoReply(data);
      } catch (err) {
        logger.error({ err, enquiryId: saved?.id ?? null }, "enquiry auto-reply email failed");
      }
    });
  }

  return { redirectTo: "/thank-you", lead: true };
}

// ── Admin ─────────────────────────────────────────────────────────────

/**
 * Filtered, paginated admin list.
 * @param {{ status?: string, category?: string, q?: string, page?: string }} [params]
 */
export async function listEnquiries(params = {}) {
  const page = Math.max(1, Number.parseInt(params.page, 10) || 1);
  const { rows, total } = await enquiryRepository.findPage(params, {
    skip: (page - 1) * ENQUIRY_PAGE_SIZE,
    take: ENQUIRY_PAGE_SIZE,
  });
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / ENQUIRY_PAGE_SIZE)) };
}

/** @param {string} id */
export async function getEnquiry(id) {
  return enquiryRepository.findDetail(id);
}

/**
 * Status and owner.
 * @param {import("@/shared/schemas/enquiry.schema").EnquiryUpdateInput} input
 * @param {{ id: string }} actor
 */
export async function updateEnquiry({ id, ...data }, actor) {
  const before = await enquiryRepository.findFollowUp(id);
  if (!before) throw new AppError("ENQUIRY_NOT_FOUND");

  await enquiryRepository.update(id, data);
  await auditService.log(actor, "UPDATE", "Enquiry", id, auditService.diff(before, data));
  revalidatePage(`/admin/enquiries/${id}`);
  revalidatePage("/admin/enquiries");
  return { ok: true, message: "Saved." };
}

/**
 * @param {{ enquiryId: string, body: string }} input
 * @param {{ id: string }} actor
 */
export async function addNote({ enquiryId, body }, actor) {
  await enquiryRepository.createNote({ enquiryId, body, authorId: actor.id });
  await auditService.log(actor, "CREATE", "EnquiryNote", enquiryId);
  revalidatePage(`/admin/enquiries/${enquiryId}`);
  return { ok: true, reset: Date.now() };
}

/** Numbers and lists for the admin dashboard. */
export async function getDashboard() {
  const stats = await enquiryRepository.findDashboardStats({
    weekAgo: new Date(Date.now() - 7 * 864e5),
    monthAgo: new Date(Date.now() - 30 * 864e5),
  });
  const counts = Object.fromEntries(stats.byStatus.map((r) => [r.status, r._count._all]));
  const categoryNames = await categoryService.getNamesById();
  return { ...stats, counts, categoryNames };
}

// ── CSV export ────────────────────────────────────────────────────────

const COLUMNS = [
  ["Received", (e) => e.createdAt],
  ["Status", (e) => e.status],
  ["Name", (e) => e.name],
  ["Company", (e) => e.company],
  ["Email", (e) => e.email],
  ["Phone", (e) => e.phone],
  ["Project location", (e) => e.projectLocation],
  ["Requirement", (e) => e.requirement],
  ["Solution page", (e) => e.category?.name],
  ["Message", (e) => e.message],
  ["Owner", (e) => e.assignedTo?.name],
  ["Source page", (e) => e.sourcePage],
  ["UTM source", (e) => e.utmSource],
  ["UTM medium", (e) => e.utmMedium],
  ["UTM campaign", (e) => e.utmCampaign],
];

/**
 * CSV cell: quoted, and neutralised against spreadsheet formula injection.
 * @param {unknown} value
 * @returns {string}
 */
export function csvCell(value) {
  let s = value == null ? "" : value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * CSV of the filtered list (same filters as the list page), audit-logged.
 * @param {Record<string, string>} params
 * @param {{ id: string }} actor
 * @returns {Promise<{ csv: string, filename: string }>}
 */
export async function exportCsv(params, actor) {
  const rows = await enquiryRepository.findForExport(params, EXPORT_MAX_ROWS);
  const lines = [
    COLUMNS.map(([h]) => csvCell(h)).join(","),
    ...rows.map((e) => COLUMNS.map(([, get]) => csvCell(get(e))).join(",")),
  ];
  await auditService.log(actor, "EXPORT", "Enquiry", null, {
    rows: [null, rows.length],
    filters: [null, params],
  });
  const date = new Date().toISOString().slice(0, 10);
  // BOM so Excel opens UTF-8 (names in Hindi etc.) correctly.
  return {
    csv: "﻿" + lines.join("\r\n"),
    filename: `insta-mark-enquiries-${date}.csv`,
  };
}

// ── Daily maintenance (docs/database-design.md §9) ────────────────────

/** Re-send notification emails that failed (notified_at IS NULL). */
async function retryNotifications() {
  if (!isEmailConfigured()) return { skipped: "email not configured" };
  const pending = await enquiryRepository.findUnnotified({
    before: ago(5 * 60 * 1000), // give the live send a chance
    after: ago(7 * DAY),
    take: 25,
  });
  let sent = 0;
  for (const enquiry of pending) {
    try {
      await sendEnquiryNotification(enquiry);
      await enquiryRepository.markNotified(enquiry.id);
      sent++;
    } catch (err) {
      logger.error({ err, enquiryId: enquiry.id }, "notification retry failed");
    }
  }
  return { pending: pending.length, sent };
}

async function applyRetention() {
  const rateLimitsDeleted = await rateLimitService.purgeOlderThan(ago(RETENTION.rateLimits));
  const spamDeleted = await enquiryRepository.removeSpamOlderThan(ago(RETENTION.spamEnquiries));
  const auditLogsDeleted = await auditService.purgeOlderThan(ago(RETENTION.auditLogs));

  // Anonymise old leads but keep them for reporting (category, status, dates, UTM).
  const old = await enquiryRepository.findIdsToAnonymise(
    ago(RETENTION.enquiriesBeforeAnonymise),
    500,
  );
  for (const { id } of old) await enquiryRepository.anonymise(id);

  return { rateLimitsDeleted, spamDeleted, auditLogsDeleted, enquiriesAnonymised: old.length };
}

/**
 * Notification retries + data retention. Skipped without a database.
 * @returns {Promise<{ skipped: string } | { notifications: object, retention: object }>}
 */
export async function runMaintenance() {
  if (!isDatabaseConfigured()) return { skipped: "database not configured" };
  const notifications = await retryNotifications();
  const retention = await applyRetention();
  return { notifications, retention };
}
