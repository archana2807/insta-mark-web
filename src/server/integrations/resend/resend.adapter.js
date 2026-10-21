// Enquiry emails (Resend): the sales notification and the visitor's auto-reply.
// Both are optional until keys are configured.
import "server-only";
import { getEnv } from "@/server/config/env";

const escapeHtml = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

/**
 * Label / value rows as a simple HTML table (values escaped, line breaks kept).
 * @param {[string, unknown][]} rows
 * @returns {string}
 */
function detailsTable(rows) {
  return `
    <table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">
      ${rows
        .filter(([, v]) => v)
        .map(
          ([k, v]) =>
            `<tr><td style="color:#666;vertical-align:top"><b>${escapeHtml(k)}</b></td><td>${escapeHtml(v).replace(/\n/g, "<br>")}</td></tr>`,
        )
        .join("")}
    </table>`;
}

/** @returns {string[]} the sales inbox addresses */
function salesInboxes() {
  return (getEnv().ENQUIRY_NOTIFY_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** @returns {boolean} the sales notification can be sent */
export function isEmailConfigured() {
  const env = getEnv();
  return Boolean(env.RESEND_API_KEY && env.ENQUIRY_NOTIFY_EMAILS);
}

export async function sendEnquiryNotification(enquiry) {
  const { Resend } = await import("resend");
  const env = getEnv();
  const resend = new Resend(env.RESEND_API_KEY);

  const rows = [
    ["Name", enquiry.name],
    ["Company", enquiry.company],
    ["Email", enquiry.email],
    ["Phone", enquiry.phone],
    ["Project location", enquiry.projectLocation],
    ["Requirement", enquiry.requirement],
    ["Message", enquiry.message],
    ["Source page", enquiry.sourcePage],
    [
      "UTM",
      [enquiry.utmSource, enquiry.utmMedium, enquiry.utmCampaign].filter(Boolean).join(" / "),
    ],
  ];

  const html = `
    <h2 style="font-family:Arial,sans-serif">New website enquiry</h2>
    ${detailsTable(rows)}`;

  const { error } = await resend.emails.send({
    from: env.ENQUIRY_FROM_EMAIL || "Insta Mark Website <onboarding@resend.dev>",
    to: salesInboxes(),
    replyTo: enquiry.email,
    subject: `New enquiry: ${enquiry.name}${enquiry.company ? ` (${enquiry.company})` : ""}`,
    html,
  });
  if (error) throw new Error(error.message);
}

/**
 * The visitor's auto-reply needs a sender on a Resend-verified domain: Resend's test
 * sender only delivers to the account owner (R-7.8).
 * @returns {boolean}
 */
export function isAutoReplyConfigured() {
  const env = getEnv();
  return Boolean(env.RESEND_API_KEY && env.ENQUIRY_FROM_EMAIL);
}

/**
 * Auto-reply content. Same wording as the thank-you page; no new promises (R-1.5).
 * @param {{ name: string, company?: string, phone?: string, projectLocation?: string, requirement?: string, message?: string }} enquiry
 * @returns {{ subject: string, html: string, text: string }}
 */
export function buildAutoReply(enquiry) {
  const intro =
    "Thank you for contacting Insta Mark. We have received your enquiry, and our team will review your requirement and get back to you shortly.";
  const rows = [
    ["Company", enquiry.company],
    ["Phone", enquiry.phone],
    ["Project location", enquiry.projectLocation],
    ["Requirement", enquiry.requirement],
    ["Message", enquiry.message],
  ];
  const html = `
    <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222">
      <p>Hello ${escapeHtml(enquiry.name)},</p>
      <p>${escapeHtml(intro)}</p>
      <p>For your reference, this is what you sent us:</p>
      ${detailsTable(rows)}
      <p>Insta Mark</p>
      <p style="color:#666;font-size:13px">This is an automatic confirmation. You can reply to this email.</p>
    </div>`;
  const text = [
    `Hello ${enquiry.name},`,
    "",
    intro,
    "",
    "For your reference, this is what you sent us:",
    ...rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
    "",
    "Insta Mark",
    "This is an automatic confirmation. You can reply to this email.",
  ].join("\n");
  return { subject: "We have received your enquiry — Insta Mark", html, text };
}

/**
 * Sends the auto-reply to the visitor. Replies go to the sales inbox.
 * @param {{ name: string, email: string }} enquiry
 * @returns {Promise<void>}
 */
export async function sendEnquiryAutoReply(enquiry) {
  const { Resend } = await import("resend");
  const env = getEnv();
  const resend = new Resend(env.RESEND_API_KEY);
  const [replyTo] = salesInboxes();
  const { error } = await resend.emails.send({
    from: env.ENQUIRY_FROM_EMAIL,
    to: [enquiry.email],
    ...(replyTo && { replyTo }),
    ...buildAutoReply(enquiry),
  });
  if (error) throw new Error(error.message);
}
