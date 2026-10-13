// Audit trail for admin actions (`audit_logs`). Never throws — a failed audit
// write must not break the action the admin performed.

import { getPrisma } from "@/lib/db";

/** Returns { field: [before, after] } for fields that changed. */
export function diff(before, after) {
  const changes = {};
  for (const key of Object.keys(after ?? {})) {
    const a = before?.[key];
    const b = after[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) changes[key] = [a ?? null, b ?? null];
  }
  return changes;
}

export async function logAudit(actor, action, entity, entityId, changes) {
  try {
    const prisma = await getPrisma();
    await prisma.auditLog.create({
      data: {
        actorId: actor?.id ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        changes: changes && Object.keys(changes).length ? changes : undefined,
      },
    });
  } catch (err) {
    console.error("[audit] write failed", action, entity, entityId, err);
  }
}
