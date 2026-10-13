"use server";

import { redirect } from "next/navigation";
import { enquirySchema, enquiryFields } from "@/lib/validation/enquiry";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { isEmailConfigured, sendEnquiryNotification } from "@/lib/email/enquiry";
import { isTurnstileEnabled, verifyTurnstile } from "@/lib/security/turnstile";
import { isRateLimited, requestMeta } from "@/lib/security/rate-limit";

const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 }; // 5 submissions / 10 min / IP

function pickValues(formData) {
  return Object.fromEntries(enquiryFields.map((f) => [f, String(formData.get(f) ?? "")]));
}

/**
 * Server action for every enquiry form (contact page + category pages).
 * Order of operations guarantees a lead is never lost: validate → save to DB
 * → then email. Email failure leaves `notified_at` NULL for a retry job.
 */
export async function submitEnquiry(_prevState, formData) {
  // Honeypot: real users never see this field. Pretend success for bots.
  if (formData.get("website")) redirect("/thank-you");

  const raw = Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string"));
  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: pickValues(formData),
    };
  }

  const { category: categorySlug, ...data } = parsed.data;
  const { ip, ipHash, userAgent } = await requestMeta();

  if (isTurnstileEnabled()) {
    const verdict = await verifyTurnstile(formData.get("cf-turnstile-response"), ip);
    if (verdict === "unavailable") {
      console.warn("[enquiry] accepted without Turnstile check (Cloudflare unreachable)");
    }
    if (verdict === "invalid") {
      return {
        status: "error",
        message: "We couldn't verify you're human. Please wait a moment and submit again.",
        values: pickValues(formData),
      };
    }
  }

  let saved = null;

  if (isDatabaseConfigured()) {
    try {
      const prisma = await getPrisma();
      if (ipHash && (await isRateLimited(prisma, `enquiry:${ipHash}`, RATE_LIMIT))) {
        return {
          status: "error",
          message: "Too many enquiries from your network. Please try again in a few minutes.",
          values: pickValues(formData),
        };
      }
      const category = categorySlug
        ? await prisma.category.findUnique({ where: { slug: categorySlug }, select: { id: true } })
        : null;
      saved = await prisma.enquiry.create({
        data: { ...data, categoryId: category?.id, ipHash, userAgent },
      });
    } catch (err) {
      console.error("[enquiry] database save failed", err);
    }
  }

  let emailed = false;
  if (isEmailConfigured()) {
    try {
      await sendEnquiryNotification(data);
      emailed = true;
      if (saved) {
        const prisma = await getPrisma();
        await prisma.enquiry.update({ where: { id: saved.id }, data: { notifiedAt: new Date() } });
      }
    } catch (err) {
      console.error("[enquiry] notification email failed", saved?.id ?? "(not saved)", err);
    }
  }

  if (!saved && !emailed) {
    if (process.env.NODE_ENV === "production") {
      // Never pretend success in production if the lead went nowhere.
      return {
        status: "error",
        message:
          "Sorry, we couldn't submit your enquiry right now. Please try again shortly or contact us directly.",
        values: pickValues(formData),
      };
    }
    console.warn(
      "[enquiry] DATABASE_URL and RESEND_API_KEY are not configured — enquiry logged only (dev):",
      { ...data, category: categorySlug },
    );
  }

  redirect("/thank-you");
}
