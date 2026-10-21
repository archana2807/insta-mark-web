# Spec — Task 07 `07-client-changes` (part 1: what is possible before the client answers)

Website looks different: **yes**, but only once an admin uploads a banner. Until then the home page looks exactly as today.

## In this part

### 07a Banner (R-3.1, R-3.2, R-8.1; design.md §4.1, §5.1)

- New admin page `/admin/banner` (Editor and Admin, `content:write`; uploads need `media:upload`). It has:
  - two upload slots, desktop and mobile;
  - one alt-text field;
  - a preview of each image;
  - "Remove" per slot;
  - the sizes for the client's design team: desktop **1920 × 1720 px**, mobile **1080 × 1080 px**, with safe areas.
- Uploads use the existing signed Cloudinary flow (folder `insta-mark/banner/<slot>`). The server verifies the upload and rejects images below the minimum (desktop 1600 × 1400, mobile 900 × 900).
  - A replaced or removed image is deleted when nothing else uses it.
  - Every change is audit-logged and refreshes the home page.
- Storage: `site_settings` key `home.banner` = `{ desktopAssetId, mobileAssetId, alt }` (no new table).
- Home page: a `<picture>`. The desktop image shows from 992 px up, the mobile image below (falling back to the desktop image). The current photo (`featured.hero`) stays the fallback until a banner is uploaded. With no banner, the markup is unchanged.
- Without Cloudinary keys the page explains that uploads need Cloudinary (as the galleries do).

### 07c Auto-reply (R-7.8)

- After an accepted enquiry, the visitor gets a short confirmation email (Resend):
  - the existing thank-you wording,
  - a copy of what they sent,
  - Reply-To set to the sales inbox.
  - No new promises or client facts (R-1.5).
- It is sent **after** the response (Next.js `after()`), so a slow or failed email never blocks or delays the thank-you page. Failures are logged.
- Needs `RESEND_API_KEY` and `ENQUIRY_FROM_EMAIL` (a Resend-verified domain); off otherwise.

### GA4: honeypot hits are not conversions

- Only an accepted enquiry gets a one-time cookie (`im_lead`, 2 minutes, path `/`). The `generate_lead` event fires only when that cookie is there, and then deletes it.
- Honeypot bots, direct visits and reloads of `/thank-you` no longer count.

## Not in this part (needs the client)

- Home section order, About text, quote, FAQs placement (07b; questions 1–2).
- The real banner images, and the Cloudinary and Resend keys in Vercel.

## Done when

1. Editors and Admins can open `/admin/banner`; it shows both sizes and both slots. Uploads verify size; the home page shows the right image per screen width; with nothing uploaded, the old photo shows (e2e: a stored banner through the admin form, both widths, remove → fallback).
2. The banner sizes appear on the admin page and in `docs/admin-guide.md` for the client.
3. A visitor gets the auto-reply; when the email service fails, the thank-you page still appears (e2e with a local mock email server).
4. A honeypot submission reaches the thank-you page but fires no `generate_lead`; a real one fires exactly one (e2e).
5. Lint, unit, build, full e2e green; no visual change on pages without a banner.
