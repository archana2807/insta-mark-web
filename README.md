# Insta Mark — Website

Company website for **Insta Mark Private Limited** (Mumbai): architectural signage, wayfinding and road safety solutions. Catalogue-style site whose job is to generate enquiries.

- **Design:** recreated in our own code from the Crafto “Branding Agency” HTML demo (Option A — no theme code or assets copied), white theme, picture-heavy, minimal animation (client brief).
- **Content:** copy from the client’s `Website_Content_Insta_Mark.pdf`; photos are the client’s executed-site images from Google Drive.

| Doc                                                  | What it covers                                          |
| ---------------------------------------------------- | ------------------------------------------------------- |
| [docs/architecture.md](docs/architecture.md)         | System design, routes, rendering, security, SEO, phases |
| [docs/database-design.md](docs/database-design.md)   | Prisma schema, ER diagram, indexes, seed, migrations    |
| [docs/meeting-summary.md](docs/meeting-summary.md)   | Client requirements from the kick-off meeting           |
| [docs/qa-report.md](docs/qa-report.md)               | Phase 5 QA results                                      |
| [docs/launch-checklist.md](docs/launch-checklist.md) | Going live: accounts, env vars, deploy, DNS, Google     |
| [docs/admin-guide.md](docs/admin-guide.md)           | Admin panel guide for the Insta Mark team               |
| [CLAUDE.md](CLAUDE.md)                               | Rules for AI-assisted development in this repo          |

## Tech stack

Next.js 15 (App Router, **JavaScript — no TypeScript**) · React 19 · Bootstrap 5.3 + React-Bootstrap + Sass · Bootstrap Icons (inline SVG subset) · PostgreSQL (Neon) + Prisma 6 · Zod · Resend · yet-another-react-lightbox · Vercel.

## Getting started

Requirements: Node.js 20+ (see `.nvmrc`).

```bash
npm install            # also runs `prisma generate`
cp .env.example .env.local
npm run dev            # http://localhost:3000
```

The site runs **without a database**: all pages read static content from `/content`. Enquiry forms work in development without a database or email (the lead is logged to the server console). In production a submission needs `DATABASE_URL` and/or `RESEND_API_KEY` — otherwise the form shows an error rather than silently losing the lead.

### With a database (Neon)

```bash
# set DATABASE_URL (pooled, with &pgbouncer=true) and DIRECT_URL in .env.local
npm run db:deploy      # apply migrations
npm run db:seed        # load categories, photos, industries, FAQs
npm run images:migrate -- --dry-run   # preview, then without --dry-run to upload to Cloudinary
```

The seed only creates missing rows, so edits made later in the admin panel survive a re-seed (`SEED_OVERWRITE=true` forces the `/content` copy back).

### Admin panel (`/admin`)

Needs the database plus `AUTH_SECRET` (32+ random characters). Create the first administrator:

```bash
SEED_ADMIN_EMAIL=owner@example.com SEED_ADMIN_PASSWORD='a-long-password' npm run admin:create
```

Further users are added in **Admin → Users**. Roles: **Admin** (everything) and **Editor** (enquiries + website content; no users, settings or audit log).

## Configuration

Every integration switches on when its env vars are set (see `.env.example`) and is simply off otherwise.

| Feature                    | Env vars                                                               | When off                                                              |
| -------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Database (content source)  | `DATABASE_URL`, `DIRECT_URL`                                           | Pages read `/content`                                                 |
| Admin panel                | `AUTH_SECRET` (+ database)                                             | `/admin` login shows an error                                         |
| Photo/logo uploads (admin) | `CLOUDINARY_*`                                                         | Upload buttons disabled with a notice; existing photos still editable |
| Enquiry emails             | `RESEND_API_KEY`, `ENQUIRY_NOTIFY_EMAILS`, `ENQUIRY_FROM_EMAIL`        | Leads only stored in DB                                               |
| Spam protection            | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`               | Honeypot + rate limit only                                            |
| Analytics                  | `NEXT_PUBLIC_GA_ID`                                                    | No tracking script                                                    |
| Daily maintenance cron     | `CRON_SECRET`                                                          | Endpoint returns 503                                                  |
| Cloudinary image migration | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Images served from `/public`                                          |

`NEXT_PUBLIC_*` values are inlined at build time — redeploy after changing them.

**Turnstile policy:** a token Cloudflare rejects blocks the submission; if Cloudflare is unreachable the enquiry is accepted with a warning in the logs (a lost lead costs more than one spam message).

**Cron** (`vercel.json`, 02:00 IST daily): retries failed enquiry emails, deletes rate-limit rows > 1 day, spam > 90 days, audit logs > 1 year, and anonymises enquiries older than 3 years.

## Scripts

| Script                            | Purpose                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------- |
| `npm run dev` / `build` / `start` | Next.js                                                                           |
| `npm run check:content`           | Verifies every gallery image exists, sizes match, alt text present, no duplicates |
| `npm run format` / `format:check` | Prettier                                                                          |
| `npm run db:migrate`              | Create a new migration (local dev)                                                |
| `npm run db:deploy`               | Apply migrations (CI / production)                                                |
| `npm run db:seed`                 | Seed from `/content`                                                              |
| `npm run db:studio`               | Prisma Studio                                                                     |
| `npm run images:migrate`          | Upload local images to Cloudinary and update the DB (`-- --dry-run` to preview)   |
| `npm run build:vercel`            | Vercel build: applies migrations when a DB is configured, then `next build`       |
| `npm run admin:create`            | Create an admin user or reset its password (reads `SEED_ADMIN_*`)                 |
| `npm run icons`                   | Regenerate the inline SVG icon subset after adding an icon name                   |

## Project structure

```
app/
  (site)/              public website (shared header/footer layout)
    page.js            home
    solutions/         all solutions + [slug] category template (8 static pages)
    projects/          projects list + [slug] project pages (from admin)
    about/ contact/ thank-you/ privacy-policy/
  admin/
    login/             sign-in page
    (panel)/           authenticated shell: dashboard, enquiries, categories, projects,
                       clients, faqs, settings, users, account, audit
    enquiries/export/  CSV export route
  api/cron/maintenance daily retention + email retry job
  layout.js            self-hosted fonts, global styles, default metadata
middleware.js          fast signature check for /admin/*
  sitemap.js robots.js icon.svg not-found.js
components/
  layout/              Header (mega menu + mobile offcanvas), Footer, FloatingActions
  sections/            Hero, AboutIntro, StatsLine, CategoryGrid, ShowcaseRow, ProcessSteps,
                       IconGrid, Gallery (lightbox), FaqSection, CtaPanel, PageHero, EnquirySection
  forms/               EnquiryForm, Turnstile
  analytics/           GoogleAnalytics, TrackLead (generate_lead conversion)
  admin/               AdminNav, ActionForm, SubmitButton, ImageManager, LogoUploader, …
  ui/                  Eyebrow, SectionHeading, Reveal, BrandLogo
content/               site settings, categories, company copy, gallery manifest
lib/
  data/                data access layer — ONLY place pages get data from
                       (index.js picks db-source.js or content-source.js; tags.js = cache tags)
  actions/enquiry.js   server action: validate → Turnstile → rate-limit → save → email → redirect
  auth/                password.js (scrypt), session.js (HMAC-signed cookie), index.js (requireAdmin)
  admin/               admin server actions (actions/*), audit log, cache revalidation, CSV
  security/            turnstile.js, rate-limit.js
  cloudinary.js maintenance.js validation/ email/ seo.js format.js db.js
prisma/                schema, migrations, seed
styles/                _variables (design tokens) + Bootstrap partial import + section styles
public/images/work/    optimised client photos by category
scripts/               check-content, migrate-images-to-cloudinary, migrate-if-configured
vercel.json            build command + cron schedule
```

## Status (13 Oct 2026)

**Done — Phases 0–2 + part of 3**

- Project setup, security headers (CSP etc.), patched dependencies (`npm audit`: 0 vulnerabilities)
- Design system and all public pages: Home, Solutions, 8 category pages, Projects, About, Contact, Thank-you, Privacy (draft), 404
- 78 client photos optimised, categorised and alt-texted
- Enquiry form end-to-end (validation, E.164 phone normalisation, honeypot, rate limit, UTM capture, DB save, email)
- SEO: per-page metadata, canonical URLs, sitemap, robots, JSON-LD (LocalBusiness, Service, FAQPage, BreadcrumbList)
- Prisma schema + initial migration + idempotent seed (verified against PostgreSQL)

**Verified:** production build passes (21 static pages, ≤121 kB first-load JS); browser tests for form errors, successful submit, honeypot, mobile layout (no horizontal scroll), mega menu; no console errors.

**Done — Phase 3 (13 Oct 2026)**

- Data layer reads PostgreSQL when `DATABASE_URL` is set (cached with tags + 1 h ISR safety net), static `/content` otherwise; site settings (phone, email…) editable in DB
- Migration 2: `category_group` enum + `icon` on categories; seed now preserves admin edits
- Cloudflare Turnstile (with outage policy), GA4 + `generate_lead` conversion, daily maintenance cron, Cloudinary migration script, migration-safe Vercel build
- Fonts self-hosted (`@fontsource-variable`) — builds no longer depend on Google Fonts

**Verified (against a real PostgreSQL wire server):** both migrations apply; seed idempotent and keeps admin edits; DB-mode build renders DB data (settings, 8 categories, 12 industries, 78 photos); enquiries saved with category/UTM/IP hash; rate limit blocks the 6th submission in 10 min; Turnstile outcomes unit-tested (valid / rejected / unreachable + retry); cron: 401 without secret, retention + anonymisation correct, second run no-op; Cloudinary signature matches Cloudinary's documented example; migration dry-run maps all 78 images. **Not yet verified with real accounts:** Resend email delivery and retry, Cloudinary upload, GA4 events, Neon.

**Done — Phase 4: admin panel (13 Oct 2026)**

- Auth without third-party libs: scrypt password hashes, HMAC-signed HttpOnly session cookie, middleware gate + per-request DB check, 8 h sessions, password change signs out other sessions, 5-failure lockout (15 min), login rate limit, no user enumeration, no open redirects
- Dashboard; enquiries (search/filter/pagination, status pipeline, owner, notes, CSV export with formula-injection protection); categories (text, features, SEO, visibility) with photo manager (signed direct Cloudinary upload verified server-side, alt text, type, order, cover, remove); projects CRUD with galleries; client logos; FAQs; site settings; users & roles; own password; audit log
- Every edit revalidates only the affected public pages (no redeploy); public site gained project pages, featured projects, client logo strip and projects in the sitemap

**Verified:** 43/43 end-to-end browser checks against a real PostgreSQL wire server — auth (redirects, generic errors, lockout, cookie flags, open-redirect, forged cookie, session invalidation on password change, logout), roles, enquiries flow + CSV, every content edit appearing on the public site, validation messages, project slugs/404 after delete; no JS errors. Unit tests: 14 auth, 6 Cloudinary. Found and fixed during testing: `dynamicParams=false` made category pages 404 after an admin edit (Next.js NoFallbackError); React 19 form auto-reset wiped admin input on validation errors. **Not verified with a real account:** Cloudinary uploads (signing/verification unit-tested only).

**Done — Phase 5: QA (13 Oct 2026)** — full report: [docs/qa-report.md](docs/qa-report.md)

- Lighthouse (mobile): Performance **93–95**, Accessibility / Best Practices / SEO **100** on every measured page (was 53–84 performance — icon font replaced by generated inline SVGs)
- axe WCAG 2.1 AA: 0 violations on 15 public + 12 admin pages (contrast fixes); 0 broken links; SEO checks clean; no mobile overflow; Chromium cross-browser smoke 13/13
- Pending: Firefox/WebKit run (browser download failed on the network), real devices, PageSpeed field data after launch

**UI polish + form validation (13 Oct 2026)**

- About page rebuilt in the Crafto "Branding Agency – About" layout (hero with vertical label, statement + badge, real-count counters, collage + vision/mission, manufacturing overlap feature, why-choose and solutions row lists, industries, process, CTA); Solutions, Projects and Contact use the same photo hero
- Home now covers the full content brief: all 6 "Why choose" points, both "Our expertise" lists (12 architectural + 9 road safety), CTA with "Get a Free Consultation" + "Contact Our Team"
- 404 for unknown public URLs now keeps the header and footer
- Enquiry form: shared client/server rules, inline errors on blur, error summary with links, focus management, email typo suggestion, dummy-phone rejection, link/HTML spam rules, character counter, time trap, server-side sanitisation, requirement checked against real categories
- Fixed: 12 px horizontal scroll at 390 px (large Bootstrap gutters on mobile)

**Verified:** build clean; 16/16 form browser checks + no-JS server path against a local PostgreSQL wire server; no horizontal scroll at 390 px on 7 pages; no console errors.

**Client-flow fixes (14 Oct 2026)** — after re-checking the meeting recording

- Home follows the meeting order exactly: banner → 1–2 line about → product grid → working process → sectors → executed-work pictures → CTA (why choose → About, expertise lists → Solutions, FAQs → Contact)
- Category pages: client write-up with a project photo → product range (when catalogue images arrive) → executed work → enquiry form on the same page
- Motion rebuilt like the Crafto Branding Agency demo (own CSS, no library): staggered fade-ups, 3D flip on tile grids, image wipes, blur-in vertical label, rolling counters, rotating badge, switch-text buttons; no parallax/marquee/sliders; off for reduced-motion users
- Solutions page rebuilt like the theme's Services page, with its scroll effects: photo pairs drifting in opposite directions, left/right image wipes, feature lists swinging in; hero photos zoom-drift, About headline drifts sideways
- Galleries: even grid of square tiles, 9 shown + "Show all N photos", lightbox for the full image; product grid 2-up on phones (picture + name)

**Phase 6 — preview live (13 Oct 2026):** https://insta-mark-web.vercel.app (Vercel Hobby + Neon Singapore, auto-deploys from `main`). Live checks passed: pages, security headers, enquiry → Neon → admin, admin login, cron, mobile. Still to do before the public launch: Vercel Pro (commercial use), Resend email, Turnstile, GA4, Cloudinary, client domain and content.

**Remaining launch steps** — step-by-step: [docs/launch-checklist.md](docs/launch-checklist.md); client handover: [docs/admin-guide.md](docs/admin-guide.md)

**Waiting on the client**

- Official logo (SVG) and brand colours → `src/styles/_variables.scss`, `src/components/ui/BrandLogo.jsx`
- Phone, WhatsApp, email, address, map → `content/site.js` (hidden on the site until set)
- Photos for Braille Signs and Emergency Lights; catalogue product images; client logos
- Confirm: founding year (2016?), “Manufacturing” vs “Industrial Facilities”, Fire & Safety overview text
- Privacy policy review

Search the code for `TODO(client` to find every open item.
