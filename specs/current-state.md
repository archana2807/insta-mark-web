# Insta Mark website — current state

Snapshot of what is built, as of commit `ff09d02` on `main` (20 Oct 2026).
Working tree clean. Live preview: https://insta-mark-web.vercel.app (Vercel
Hobby, auto-deploys from `main`, region `sin1`, Neon Postgres in Singapore).

Read with: [README.md](../README.md), [docs/architecture.md](../docs/architecture.md)
(ADR-1…21), [docs/database-design.md](../docs/database-design.md), [CLAUDE.md](../CLAUDE.md).

---

## 1. Stack at a glance

| Layer | What is used |
|---|---|
| Framework | Next.js 15.5.27 App Router, React 19.1.9, **plain JavaScript** (no TS) |
| UI | Bootstrap 5.3.3 (SCSS, selected modules only) + React-Bootstrap 2.10.10 (Dropdown, Offcanvas, Accordion) |
| Styles | Sass, 9 partials in `styles/` (~2,250 lines) |
| Fonts | Self-hosted variable fonts via `next/font/local`: Inter (body), Space Grotesk (headings, buttons) |
| Icons | No icon font. 65 inline SVGs generated from `bootstrap-icons` by `npm run icons` |
| Data | PostgreSQL (Neon) via Prisma 6.19.3, **or** static `/content` files when `DATABASE_URL` is unset |
| Validation | Zod 3 (server) + shared plain-JS rules (browser and server) |
| Email | Resend (optional) |
| Images | `next/image`; local files in `public/images/work/`; Cloudinary signed uploads from admin (optional) |
| Lightbox | `yet-another-react-lightbox` (loaded on first click) |
| Hosting | Vercel (`vercel.json`: build `npm run build:vercel`, daily cron) |

Integrations are all **optional and env-gated** (see `.env.example`): database,
Resend, Turnstile, GA4, Cloudinary, cron, admin auth.

---

## 2. Public pages

All public routes live in `app/(site)/` and share `app/(site)/layout.js`:
skip link → `Header` → `<main>` → `Footer` → `FloatingActions` → GA4 →
Organization/LocalBusiness JSON-LD.

| Route | Rendering | Sections (top → bottom) |
|---|---|---|
| `/` Home | Static, ISR 1 h + tags | `HomeHero` (vertical label, H1 tagline, text, 2 CTAs, photo, "10+ years" badge) → `AboutIntro` (title + 1-line summary + link) → product grid (`CategoryGrid`, 8 cards) → Working Process (4 steps) → Sectors (`IconGrid`, 12 industries) → executed-work `Gallery` (9 photos) + `LogoStrip` → `CtaPanel` |
| `/about` | Static | `InnerHero` → `StatementBadge` ("Signage that / guides." + rotating text badge + Who We Are) → `CounterColumns` (8 categories, 12 industries, 12 capabilities, 5 steps — counted from content) → photo collage + Vision/Mission + 2 buttons + `LogoStrip` → `OverlapFeature` (manufacturing, 12 capability tags, quality note) → `RowList` Why choose us → `RowList` Solutions (3) → Industries `IconGrid` → Process (5 steps) → `CtaPanel` |
| `/solutions` | Static | `InnerHero` → 8 service blocks (`ShowcaseRow`: number, group label, title, short text, features as two "+" lists, button, 8/4 photo pair) → `ExpertiseLists` (12 architectural + 9 road-safety items) → `CtaPanel` |
| `/solutions/[slug]` (8) | SSG + ISR | `InnerHero` (overview as lead, first executed photo, Get a quote / See our work) → Key features + Applications (text + tags) → Product range gallery (**only if catalogue images exist — none do yet**) → Executed work `Gallery` → `EnquirySection` (form pre-selects this category) → `FaqSection` (category FAQs, else global) → Related solutions (same group) |
| `/projects` | Static | `InnerHero` with jump-to-category tag nav + photo count → Featured projects (`ProjectCard`, only when projects exist in admin) → one gallery section per category with photos → `CtaPanel` |
| `/projects/[slug]` | SSG, `dynamicParams = true` | `PageHero` (old text-only hero) → cover + description + facts (client, city, year, sector) + "Solutions used" tags → project gallery → `EnquirySection` |
| `/contact` | Static | `InnerHero` → `EnquirySection` id `contact-form` (contact list hidden while phone/email/WhatsApp are unset) → Google Map iframe (only if `mapEmbedUrl` set) → `FaqSection` (home FAQs) |
| `/privacy-policy` | Static | `PageHero` + **draft** policy text (marked TODO for client/legal) |
| `/thank-you` | Static, `noindex` | Confirmation + fires GA4 `generate_lead` |
| any unknown URL | `[...missing]` catch-all → `notFound()` | `app/(site)/not-found.js`: 404 inside header/footer. `app/not-found.js` is the bare fallback (used for `/admin/*`) |
| `/sitemap.xml`, `/robots.txt`, `/icon.svg` | Generated | Sitemap = 6 pages + 8 categories + active projects; robots disallows `/admin`, `/api`, `/thank-you` |

**Navigation** (`content/site.js → mainNav`): Home · Solutions (mega menu in two
columns: Architectural Signage / Road Safety Solutions) · Projects · About ·
Contact, plus a "Get a Quote" button. Mobile: React-Bootstrap Offcanvas with
an expandable Solutions list. The header gets a shadow after 10 px of scroll.

**Footer:** logo, Projects-page CTA line, head office (Mumbai, Maharashtra),
phone/email (hidden while unset), Request a Quote, 8 solution links, company
links, copyright line.

**Floating actions:** WhatsApp/Call buttons, rendered only once those numbers are set.

### SEO
- `pageMetadata()` gives each page a title, description, canonical URL and OG data.
- JSON-LD types: Organization/LocalBusiness (layout), BreadcrumbList (heroes), Service (category pages), FAQPage (FAQ sections).
- The sitemap is revalidated when projects change.

### Enquiry form (`components/forms/EnquiryForm.jsx`)
- **Fields:** name, company, email, phone, project location, requirement (category dropdown + "Other"), message.
- **Hidden fields:** category slug, source page, UTM source/medium/campaign, honeypot `website`, `fillMs` (JS only).
- **Shared rules** in `lib/validation/enquiry-rules.js` (the browser checks on blur, the server checks again with Zod in `lib/validation/enquiry.js`):
  - name: letters in any script;
  - email: strict format, plus a typo suggestion such as gmial → gmail;
  - phone: normalised to E.164, dummy numbers rejected;
  - company and location: no links or HTML;
  - message: no HTML, at most 2 links;
  - requirement: must be a current category name.
- **Errors:** an error summary with links, focus moves to the first invalid field, plus a character counter.
- **Server action** `lib/actions/enquiry.js`, in order:
  1. Honeypot → fake success.
  2. Time trap (< 2.5 s → "submit again" error).
  3. Zod and the category check.
  4. Turnstile: block if rejected, accept if Cloudflare is unreachable.
  5. Rate limit: 5 per 10 min per IP hash.
  6. DB insert.
  7. Resend notification (`notifiedAt` is set on success).
  8. Redirect to `/thank-you`. In production it returns an error if the lead was neither stored nor emailed.
- **Without JS:** works as a native form post with server validation (verified).

---

## 3. Admin panel (`/admin`)

**Auth:** custom, with no third-party library.
- Passwords are scrypt hashes (minimum 10 characters).
- The session is a stateless HMAC-SHA256 cookie `im_admin_session`, valid for 8 h.
- `middleware.js` gates `/admin/*`, and `requireAdmin()` re-checks the user in the DB on every page and action.
- Changing a password signs out all other sessions (`pwv` fingerprint).
- 5 failed logins lock the account for 15 min. Login is also rate-limited to 10 attempts per 10 min per IP.
- No user enumeration and no open redirects.
- Roles: `ADMIN` (everything) and `EDITOR` (no settings, users or audit log).

| Page | What it does |
|---|---|
| `/admin/login` | Login form |
| `/admin` | Dashboard (counts, recent enquiries) |
| `/admin/enquiries` | List with search, status/category filters, pagination; **Export CSV** |
| `/admin/enquiries/[id]` | Detail; change status (NEW → CONTACTED → QUOTED → WON/LOST/SPAM), assign owner, add notes |
| `/admin/categories` | List of the 8 categories |
| `/admin/categories/[id]` | Edit name, short text, group, icon (curated dropdown), overview, features, applications, SEO title/description, order, active flag. **Photo manager:** signed direct upload to Cloudinary, type (Executed / Catalogue), alt text, reorder, set cover, remove |
| `/admin/projects`, `/new`, `/[id]` | Projects CRUD: title (auto slug, unique), client, city/state, year, sector, categories, featured, active, description, gallery with cover |
| `/admin/clients` | Client logos: upload, name, website, order, active, delete |
| `/admin/faqs` | FAQs: global or per category, "show on home", order, active |
| `/admin/settings` (ADMIN) | Phone, WhatsApp, email, address line/city/state, Google Maps embed URL, LinkedIn/Instagram/Facebook/YouTube, established year |
| `/admin/users` (ADMIN) | Create users, change role, deactivate, reset password (safety rules: can't remove the last admin or yourself) |
| `/admin/audit` (ADMIN) | Audit log of every write, login, logout and lockout |
| `/admin/account` | Change own password |

Every admin write calls `revalidateTag()` (`lib/admin/revalidate.js`), so the
public pages update without a redeploy.

---

## 4. Database (PostgreSQL via Prisma)

Two applied migrations: `20261013000000_init` and `20261013120000_category_group_icon`.
Conventions: cuid ids, snake_case tables and columns, `created_at`/`updated_at`.

| Table | Purpose / key columns |
|---|---|
| `admin_users` | name, email (unique), password_hash, role `AdminRole`, is_active, failed_login_count, locked_until, last_login_at |
| `audit_logs` | actor_id → admin_users (set null), action, entity, entity_id, changes JSON |
| `media_assets` | One row per image: public_id (unique), url, width, height, format, bytes, alt (required) |
| `categories` | slug, name, short_description, category_group `CategoryGroup`, icon, overview, features JSON[], applications, hero_image_id → media_assets, sort_order, is_active, seo_title, seo_description |
| `category_images` | category ↔ asset, type `ImageType` (CATALOGUE / EXECUTED), caption, sort_order; unique (category, asset) |
| `industries` | slug, name, icon, description, sort_order, is_active |
| `projects` | slug, title, client_name, city, state, year, description, industry_id, cover_image_id, is_featured, is_active, sort_order |
| `project_images` | project ↔ asset, caption, sort_order |
| `project_categories` | many-to-many project ↔ category |
| `client_logos` | name, website_url, logo_id → media_assets, sort_order, is_active |
| `faqs` | question, answer, category_id (null = global), show_on_home, sort_order, is_active |
| `enquiries` | name, company, email, phone (E.164), project_location, requirement, message, category_id, status `EnquiryStatus`, assigned_to_id, source_page, utm_*, ip_hash (no raw IP), user_agent, notified_at |
| `enquiry_notes` | enquiry_id, author_id, body |
| `site_settings` | key/value JSON: `contact.phone`, `contact.whatsapp`, `contact.email`, `contact.address`, `contact.mapEmbedUrl`, `social`, `company.establishedYear` |
| `rate_limits` | (key, window_start) → count; fixed-window limiter for enquiries and login |

**Seed** (`prisma/seed.js`, `npm run db:seed`): create-missing by default, so admin
edits survive (`SEED_OVERWRITE=true` forces content back).
- Seeds 8 categories, 78 executed photos, 12 industries, 5 global FAQs and the settings.
- Admin users come from `npm run admin:create` (password via env only).

**Retention** (daily cron):
- rate limits after 1 day;
- SPAM enquiries after 90 days;
- audit logs after 1 year;
- enquiries anonymised after 3 years.

The same cron retries failed notification emails.

### Data layer
Pages call only `lib/data/index.js`.
- **Data sources:** `db-source.js` (Prisma + `unstable_cache` with tags from `lib/data/tags.js`, 1 h safety expiry) is used when `DATABASE_URL` is set; otherwise `content-source.js` reads `/content`.
- **Always from `/content`:** long-form copy (home, about, process, page intros) is not stored in the DB.
- **Single gallery query:** all category galleries load in one cached query, which avoids a DB pool timeout during builds.

---

## 5. APIs and server endpoints

| Endpoint | Type | Auth | Purpose |
|---|---|---|---|
| `submitEnquiry` | Server action | Public | Enquiry form (see §2) |
| `login`, `logout`, `changeOwnPassword` | Server actions | Login / session | Admin auth |
| `updateCategory`, `getUploadSignature`, `attachUploadedImage`, `updateImage`, `moveImage`, `setCoverImage`, `removeImage` | Server actions | Admin | Categories and galleries (Cloudinary uploads verified server-side, formats jpg/png/webp/avif) |
| `createProject`, `updateProject`, `deleteProject` | Server actions | Admin | Projects |
| `getLogoUploadSignature`, `createClientLogo`, `updateClientLogo`, `deleteClientLogo` | Server actions | Admin | Client logos |
| `saveFaq`, `deleteFaq` | Server actions | Admin | FAQs |
| `updateEnquiry`, `addEnquiryNote` | Server actions | Admin | Lead pipeline |
| `saveSettings` | Server action | ADMIN role | Site settings |
| `createUser`, `updateUser`, `resetUserPassword` | Server actions | ADMIN role | Users |
| `GET /admin/enquiries/export` | Route handler | Session | CSV of filtered enquiries: BOM for Excel, formula-injection protection, capped at 10,000 rows, audit-logged |
| `GET /api/cron/maintenance` | Route handler | `Authorization: Bearer $CRON_SECRET` (timing-safe) | Daily 20:30 UTC: email retries + retention. 503 if the secret is unset, 401 if wrong |

**Security headers** (`next.config.mjs`, all routes):
- CSP: no `unsafe-eval` in production; allow-lists for Cloudflare, Google Tag Manager/Analytics, Cloudinary and Google Maps;
- `X-Frame-Options: DENY`;
- `nosniff`;
- strict referrer policy;
- a Permissions-Policy that blocks camera, microphone and geolocation.

---

## 6. How the premium theme is used

**Reference:** the Crafto HTML template, "Branding Agency" demo (home, about,
services pages). It is **recreated in our own code**: no theme CSS, JS or images
are copied (CLAUDE.md hard rule).

### Colours (`styles/_variables.scss`)
| Token | Value | Use |
|---|---|---|
| `$brand-orange` | `#b55f0b` | Gradient start (darkened from the theme's `#e99022` for WCAG AA) |
| `$brand-teal` | `#177375` | Bootstrap `$primary`, link hover, icons, gradient end |
| `$brand-gradient` | orange → teal, 90° | Primary hero button, badge text |
| `$ink` | `#1d1d1d` | Headings, dark buttons |
| `$charcoal` | `#232323` | Footer |
| `$body-text` | `#5f5e5e` | Body copy (6.4:1; the theme's `#7b7a7a` fails AA) |
| `$muted` | `#6e6d6d` | Secondary labels, breadcrumbs, form hints |
| `$line` / `$surface` | `#e4e4e4` / `#f7f7f7` | Rules, borders / alternate section background, image placeholders |
| Background | `#ffffff` | Client asked for white (the theme is cream) |

Accent colours are marked `TODO(client)` until the high-res logo arrives.

### Typography
- **Body:** Inter variable, 1rem, line-height 1.75.
- **Headings and buttons:** Space Grotesk variable, weight 600, line-height 1.1, tight letter-spacing on large display text.
- **Vertical labels:** uppercase and letter-spaced, in the theme's style.

### Shape and spacing
- All border radii are 0 (square, like the theme).
- Spacers go up to `8` (8rem).
- Container max width is 1240px (xxl).
- Buttons are large with generous padding.
- Sections use the `.section` / `.section-sm` paddings.

### Layout patterns taken from the theme
| Theme pattern | Our component |
|---|---|
| Split hero: vertical label + huge headline left, full-bleed photo right, stat badge | `HomeHero` |
| Inner-page hero with vertical label, breadcrumb, photo | `InnerHero` |
| Eyebrow (short rule + small caps) + large heading + lead | `Eyebrow`, `SectionHeading` |
| Statement with rotating circular text badge | `StatementBadge` |
| Counter columns with vertical rules | `CounterColumns` |
| Image left with heading on a white panel overlapping it | `OverlapFeature` |
| "We work with…" heading left, title/text rows right | `RowList` |
| Services blocks (big number, title, copy, + lists, 8/4 photos) | `ShowcaseRow` |
| Process steps with big numbers under a rule | `ProcessSteps` |
| Bordered icon tiles | `IconGrid` |
| Line accordion FAQ | `FaqSection` |
| Dark CTA panel with radial glow | `CtaPanel` |
| Product cards with number tag | `CategoryGrid` |
| Mega menu, sticky header, "Send a message" style button | `Header` |

### Motion (`styles/_motion.scss`, own code, no animation library)
- **Scroll entrances:** `<Reveal effect stagger delay>` with the theme's values: 600 ms, 30 px, ease-out-quad, 300 ms stagger. Effects: up / left / flip (3D tilt) / fade / wipe / wipe-rl / flip-y (rotateY 100°, 800 ms, 150 ms stagger). Only content below the fold is hidden first, and only after JS runs.
- **Hero load:** `load-stagger`, `load-wipe` and `<FancyText>` (letters blur in) are CSS only.
- **Scroll drift:** `<ScrollDrift>` uses one shared rAF scroll listener. Photo pairs move ±30 px in opposite directions; the About headline moves ±50 px on x; hero photos move ±40 px with a 1.08 zoom.
- **Other effects:**
  - rolling-digit counters (screen readers get the plain number);
  - the badge rotates every 18 s;
  - switch-text buttons (`<BtnText>`);
  - galleries are a square-tile grid that shows 9 photos plus "Show all".
- **Deliberately left out** (client brief): marquee, sliders/carousels, big parallax backgrounds.
- **Reduced motion:** `prefers-reduced-motion` turns all of it off.

### Accessibility and quality (last verified 14 Oct)
- **axe WCAG 2.1 AA:** 0 violations once animations settle.
- **No sideways scrolling** at 390 px.
- **Lighthouse (Phase 5):** Performance 93–95; Accessibility, Best Practices and SEO 100.

---

## 7. Half-done, broken or messy

### Broken / wrong behaviour
1. **Category "Set cover" does nothing on the public site.** The admin saves
   `categories.hero_image_id`, but `db-source.js` never selects it. Cards and heroes
   use the first executed photo by sort order (`getCategoryCoverImage`).
   Project covers work correctly.
2. **"10+ years" badge is based on an unconfirmed fact.** `establishedYear: 2016`
   is marked `TODO(client)` (it came from IndiaMART), yet the home hero shows it.
   This breaks the "never invent client facts" rule until it is confirmed.
3. **Bot submissions count as GA4 conversions.** The honeypot redirects to
   `/thank-you`, which fires `generate_lead`, so spam inflates the numbers.
4. **The About page shows the wrong "Why choose us" list.** It renders the home
   page's 6 items (`whyChooseUs`) instead of the About list from the client
   content (`about.whyChooseUs`: end-to-end project execution, in-house design
   and manufacturing, …), which is unused.

### Client content not shown / not built
5. **Client's updated content doc (15 Oct) is not implemented yet.**
   - **Banner images:** separate desktop and mobile images, uploaded from the admin, and the image sizes still need to be sent to the client's design team.
   - **Vertical label:** remove the vertical label from the hero.
   - **Home order conflict:** the doc's home order (banner → About with 2 paragraphs → Industries → Working Process → quote → Featured Projects/logos → Trusted by → CTA → FAQs) **has no product grid**. That conflicts with the meeting order, which CLAUDE.md fixes (products right after About). The client needs to decide.
   - **Industry names differ:** "Industrial Facilities" vs "Manufacturing Facilities".
6. **The quote is unused.** "We craft ideas into impactful signage experiences." (`home.quote`) appears on no page.
7. **The customer auto-reply email was never built.** Only the internal sales
   notification exists, although `docs/architecture.md` §10.1 shows an auto-reply.
8. **Catalogue / product-range images:** none exist (the client's catalogue PDF
   was never received), so the "Product range" section never renders.
9. **Braille Signs and Emergency Lights have no photos.** They show icon placeholders.
10. **No client logos yet.** `LogoStrip` stays hidden (client: "pick logos from the website").
11. **Contact details are all unset.** Phone, email, WhatsApp, street address and map are
    `null`, so the Contact page offers only the form. The footer shows only "Mumbai, Maharashtra".
12. **Social links are never shown visibly.** They're editable in settings but used only in JSON-LD `sameAs`.
13. **Fire & Safety overview is a placeholder.** It was written by us from the
    applications text, because the client's copy repeats the applications list
    (still the case in the 15 Oct doc). Marked `TODO(client)`.
14. **Privacy policy is a draft** awaiting client/legal approval.
15. **Logo is a placeholder.** The official SVG has not been received (`BrandLogo` TODO).

### Admin gaps
16. **No admin screen for industries.** They're seeded only.
17. **No admin for long-form copy.** Home, About, process and page intros live in `/content` and need a code change.
18. **Categories can't be created or deleted.** They can only be edited, hidden or reordered.
19. **No banner management.** This is needed for item 5.

### Inconsistent / dead code
20. **Two hero systems.** `/projects/[slug]` and `/privacy-policy` still use the old
    text-only `PageHero`; every other inner page uses `InnerHero`.
21. **Unused component:** `components/sections/StatsLine.jsx`.
22. **Dead CSS:** `.statement-band`, `.quote-band`, `.showcase-row` (renamed to
    `.service-block`) and `.stats-line` (only used by StatsLine).
23. **Stale comments:**
    - `prisma/seed.js` ("created in Phase 4 together with Auth.js"; auth is custom);
    - `content/site.js` ("In Phase 3 these move to `site_settings`"; already done);
    - `lib/db.js` ("optional until Phase 3");
    - `scripts/build-icons.js` header vs the actual icon list (65 server icons).
25. **Docs disagree on the UI stack.** `docs/meeting-summary.md` (Tailwind + shadcn) and
    `docs/chat-history.md` contradict ADR-5 (Bootstrap).
26. **README status** has grown into a long running log. Several "verified"
    statements predate later UI changes.

### Engineering hygiene
27. **No automated tests in the repo.** The browser e2e suites (form 16 checks,
    admin 43 checks, axe/links/SEO crawl, overflow) and the PGlite test-DB scripts
    live only in a local scratch folder, so they're not reproducible by others or in CI.
28. **No ESLint config.** `next build` skips linting. No CI pipeline.
29. **Local runs can touch production.** `next start` auto-loads `.env.production.local`
    (the live Neon DB). Local test runs must export a quoted test `DATABASE_URL`;
    on 13 Oct test leads reached production this way (cleaned up and marked SPAM).
    There is no code-level guard.
30. **Cross-browser testing:** Firefox and WebKit not tested (Playwright downloads failed).
    Real-device and PageSpeed field data are pending.

### Launch blockers (ops, not code)
- **Hosting:** Vercel Hobby is non-commercial, so the site needs Pro before the public launch.
- **Integrations not configured:** Resend, Turnstile, GA4 and Cloudinary keys; uploads in admin won't work until Cloudinary is set.
- **Domain:** the client's own domain is not connected.
- **Credentials pasted in chat earlier:** the Vercel token and Neon DB password should be rotated. The admin password was also set to a simple value shared in chat; change it before launch.
