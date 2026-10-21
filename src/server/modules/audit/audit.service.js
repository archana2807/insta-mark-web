// Audit trail for admin actions. log() never throws — a failed audit write must
// not break the action the admin performed.
import "server-only";
import { logger } from "@/server/logger";
import { AUDIT_PAGE_SIZE } from "@/shared/constants";
import * as auditRepository from "./audit.repository";

/**
 * Fields that changed between two objects.
 * @param {Record<string, unknown> | null | undefined} before
 * @param {Record<string, unknown> | null | undefined} after
 * @returns {Record<string, [unknown, unknown]>} { field: [before, after] }
 */
export function diff(before, after) {
  const changes = {};
  for (const key of Object.keys(after ?? {})) {
    const a = before?.[key];
    const b = after[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) changes[key] = [a ?? null, b ?? null];
  }
  return changes;
}

/**
 * @param {{ id: string } | null | undefined} actor
 * @param {string} action
 * @param {string} entity
 * @param {string | null | undefined} [entityId]
 * @param {Record<string, unknown>} [changes]
 * @returns {Promise<void>}
 */
export async function log(actor, action, entity, entityId, changes) {
  try {
    await auditRepository.create({
      actorId: actor?.id ?? null,
      action,
      entity,
      entityId: entityId ?? null,
      changes: changes && Object.keys(changes).length ? changes : undefined,
    });
  } catch (err) {
    logger.error({ err, action, entity, entityId }, "audit write failed");
  }
}

/**
 * @param {string | number | undefined} pageParam page from the URL
 */
export async function listPage(pageParam) {
  const page = Math.max(1, Number.parseInt(String(pageParam), 10) || 1);
  const { rows, total } = await auditRepository.findPage({
    skip: (page - 1) * AUDIT_PAGE_SIZE,
    take: AUDIT_PAGE_SIZE,
  });
  return { rows, page, pages: Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE)) };
}

/**
 * Retention: delete entries older than `before`.
 * @param {Date} before
 * @returns {Promise<number>}
 */
export async function purgeOlderThan(before) {
  return auditRepository.removeOlderThan(before);
}
