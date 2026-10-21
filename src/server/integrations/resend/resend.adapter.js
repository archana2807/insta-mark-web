// Enquiry notification email (Resend). Optional until keys are configured.
import "server-only";

const escapeHtml = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.ENQUIRY_NOTIFY_EMAILS);
}

export async function sendEnquiryNotification(enquiry) {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const to = process.env.ENQUIRY_NOTIFY_EMAILS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

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
  ].filter(([, v]) => v);

  const html = `
    <h2 style="font-family:Arial,sans-serif">New website enquiry</h2>
    <table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="color:#666;vertical-align:top"><b>${escapeHtml(k)}</b></td><td>${escapeHtml(v).replace(/\n/g, "<br>")}</td></tr>`,
        )
        .join("")}
    </table>`;

  const { error } = await resend.emails.send({
    from: process.env.ENQUIRY_FROM_EMAIL || "Insta Mark Website <onboarding@resend.dev>",
    to,
    replyTo: enquiry.email,
    subject: `New enquiry: ${enquiry.name}${enquiry.company ? ` (${enquiry.company})` : ""}`,
    html,
  });
  if (error) throw new Error(error.message);
}
