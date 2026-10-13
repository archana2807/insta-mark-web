// Daily maintenance: notification retries + data retention
// (docs/database-design.md §9). Called by /api/cron/maintenance.

import { getPrisma } from "@/lib/db";
import { isEmailConfigured, sendEnquiryNotification } from "@/lib/email/enquiry";

const DAY = 24 * 60 * 60 * 1000;
const ago = (ms) => new Date(Date.now() - ms);

const RETENTION = {
  rateLimits: 1 * DAY,
  spamEnquiries: 90 * DAY,
  auditLogs: 365 * DAY,
  enquiriesBeforeAnonymise: 3 * 365 * DAY,
};

/** Re-send notification emails that failed (notified_at IS NULL). */
async function retryNotifications(prisma) {
  if (!isEmailConfigured()) return { skipped: "email not configured" };
  const pending = await prisma.enquiry.findMany({
    where: {
      notifiedAt: null,
      status: { not: "SPAM" },
      createdAt: { lt: ago(5 * 60 * 1000), gt: ago(7 * DAY) }, // give the live send a chance
    },
    orderBy: { createdAt: "asc" },
    take: 25,
  });
  let sent = 0;
  for (const enquiry of pending) {
    try {
      await sendEnquiryNotification(enquiry);
      await prisma.enquiry.update({ where: { id: enquiry.id }, data: { notifiedAt: new Date() } });
      sent++;
    } catch (err) {
      console.error("[maintenance] retry failed", enquiry.id, err);
    }
  }
  return { pending: pending.length, sent };
}

async function applyRetention(prisma) {
  const [rateLimits, spam, audit] = await prisma.$transaction([
    prisma.rateLimit.deleteMany({ where: { windowStart: { lt: ago(RETENTION.rateLimits) } } }),
    prisma.enquiry.deleteMany({
      where: { status: "SPAM", createdAt: { lt: ago(RETENTION.spamEnquiries) } },
    }),
    prisma.auditLog.deleteMany({ where: { createdAt: { lt: ago(RETENTION.auditLogs) } } }),
  ]);

  // Anonymise old leads but keep them for reporting (category, status, dates, UTM).
  const old = await prisma.enquiry.findMany({
    where: {
      createdAt: { lt: ago(RETENTION.enquiriesBeforeAnonymise) },
      NOT: { name: "Anonymised" },
    },
    select: { id: true },
    take: 500,
  });
  for (const { id } of old) {
    await prisma.enquiry.update({
      where: { id },
      data: {
        name: "Anonymised",
        company: null,
        email: `anonymised+${id}@invalid.local`,
        phone: "",
        projectLocation: null,
        message: null,
        ipHash: null,
        userAgent: null,
      },
    });
  }

  return {
    rateLimitsDeleted: rateLimits.count,
    spamDeleted: spam.count,
    auditLogsDeleted: audit.count,
    enquiriesAnonymised: old.length,
  };
}

export async function runMaintenance() {
  const prisma = await getPrisma();
  const notifications = await retryNotifications(prisma);
  const retention = await applyRetention(prisma);
  return { notifications, retention };
}
