# 2-ARCHITECTURE.md — HOW we build THIS project

> Filled 21 Oct 2026 from `docs/spec-update-architecture.md`, `specs/*` and `docs/OLD-CLAUDE.md`,
> with the team's decisions of 21 Oct (§10). Choices here win over `docs/STANDARDS.md`.
> "Today" = commit `ff09d02`. "Target" = after tasks 04–06.

## 1. Shape
- **Chosen:** single Next.js app (App Router: pages, server actions, route handlers).
- **Why:** one website plus its admin; no mobile app or outside API users; 15 tables.
- **Language:** JavaScript (ES modules, `.js` / `.jsx`). **Why:** team default. No TypeScript, no `.ts` files.

## 2. Stack (differences from STANDARDS §0)
| Part | Choice | Why |
|---|---|---|
| Shape | Single Next.js 15 app, not monorepo + Express | One web app, no separate API clients |
| UI | **Bootstrap 5.3 + React-Bootstrap + Sass**, not Tailwind / shadcn | Recreates the Crafto "Branding Agency" premium theme (Bootstrap based) |
| Icons | Generated inline SVGs from `bootstrap-icons` (`npm run icons`), not lucide | No icon font; 65 icons, small bundle |
| Fonts | Merriweather (headings) + Lato (body, interface), self-hosted (`next/font/local`, Fontsource; client choice 24 Oct 2026) | Builds never depend on Google Fonts |
| Forms | React 19 `useActionState` + server actions + Zod, not React Hook Form | Works without JS; shared rules for browser and server |
| Frontend data | Server components read through services; no RTK Query, no Redux | Content site; no client cache needed |
| Auth | **`jose` JWT in an HttpOnly cookie, not Auth.js** | Works in Edge middleware; we keep our own login rules (lockout, audit) |
| Images | Cloudinary (signed direct uploads) + `next/image`, not S3 | Already built; free tier; image CDN |
| Email | Resend | Already built |
| Logging | Vercel logs now; pino + Sentry at go-live (task 08) | Keep it lean until launch |
| Tooling | ESLint + Prettier; **no** Husky, lint-staged, commitlint or `checkJs` for now | Keep it lean |
| Testing | Playwright e2e against PGlite (+ Vitest unit where useful) | Suites already exist; move into repo in task 02 |
| Hosting | Vercel + Neon Postgres | See `3-INFRA.md` |

## 3. Modules

### 3.1 Code layout — target (MVC by module, spec-update §2.2–2.5)
Code is grouped **by business module**. Inside each module, files are the MVC layers.

| Layer | File | Job | May call |
|---|---|---|---|
| **View** | `src/app/**` (routes), `src/components/**` | Render pages; server components read data through a module's **service**; forms call the module's **controller** | Services (read only), controllers |
| **Controller** | `src/server/modules/<module>/<module>.controller.js` (`'use server'`) | Parse input (shared Zod schema), `requireAuth(permission)`, call **ONE** service function, return `{ ok, code, fieldErrors }` or redirect | Its own service, `server/auth` |
| **Service** | `<module>.service.js` | Business rules: "validate → store → notify", ownership checks, transactions, audit log, cache revalidation. Throws `AppError` with a catalog code | Its own repository, **other modules' services**, integrations |
| **Model** | `<module>.repository.js` | All Prisma queries for this module. The **only** place Prisma is imported | `src/server/db.js` |

Rules (enforced by ESLint `no-restricted-imports` / `import/no-restricted-paths`):
- `@prisma/client` and `src/server/db.js` only inside `*.repository.js`.
- A module never imports another module's repository — only its service.
- Everything in `src/server/` starts with `import 'server-only'` (except shared schemas), so it can never end up in the browser bundle.
- Route handlers (`src/app/api/**/route.js`) are controllers too: parse → auth → one service call → response.

Folders (lean version of spec-update §2.3):
```
src/
├─ app/            VIEW: routes only — (site)/, admin/, api/, sitemap.js, robots.js, error.jsx, not-found.jsx
├─ components/     VIEW: ui/, shared/, layout/, sections/, forms/  (Bootstrap + theme)
├─ server/
│  ├─ modules/     enquiries/ categories/ client-logos/ faqs/ industries/
│  │               settings/ banner/ media/ users/ auth/ audit/ rate-limits/
│  │               page-sections/ (service only until the page_sections table, D5)
│  ├─ integrations/ resend/ cloudinary/ turnstile/
│  ├─ auth/        jwt.js · cookies.js · password.js · session.js (requireAuth) · permissions.js
│  ├─ errors/      app-error.js
│  ├─ config/env.js   the only place that reads process.env (task 06)
│  ├─ db.js · cache.js
├─ shared/         schemas/ (Zod, browser + server), errors.js (catalog), constants.js
├─ lib/            small browser-safe helpers
├─ config/site.js  nav, public constants
├─ styles/         Sass partials (unchanged)
└─ middleware.js
content/           stays as is for now (§10, D5)
prisma/ · public/ · tests/unit · tests/e2e
```
**Since task 04** the code follows this layout. Page copy from `/content` (D5) is served by a service-only module, `modules/page-sections/`, until the `page_sections` table exists.

### 3.2 Naming (spec-update §2.4)
| Thing | Convention | Example |
|---|---|---|
| Module folder | kebab-case, plural | `client-logos/` |
| Layer files | `<singular>.<layer>.js` | `client-logo.controller.js`, `client-logo.service.js`, `client-logo.repository.js` |
| Shared schemas | `<singular>.schema.js` | `enquiry.schema.js` |
| React components | PascalCase `.jsx` | `InnerHero.jsx` |
| Other files | kebab-case | `app-error.js` |
| Functions / variables | camelCase, verb first; booleans `is/has/can` | `createProject`, `isActive` |
| Constants and error codes | UPPER_SNAKE_CASE | `ACCESS_TOKEN_TTL`, `ENQUIRY_RATE_LIMITED` |
| DB tables / columns | snake_case plural tables (unchanged) | `project_images.sort_order` |
| Permissions | `resource:action` | `enquiry:export` |
| Repository functions | `findById`, `findMany`, `create`, `update`, `remove` | `categoryRepository.findBySlug()` |
| Branches / commits | `feature/<NN>-<name>`, Conventional Commits | `feat(enquiries): move to module` |

### 3.3 Request flow (example: admin updates a project)
The Projects module was removed on 24 Oct 2026; the example still shows the pattern every module follows (e.g. categories, FAQs).
```
ProjectForm (View, client component)
  → updateProject(prev, formData)            projects/project.controller.js  ('use server')
      requireAuth('content:write')            verify JWT + user active + token_version
      projectSchema.safeParse(input)          src/shared/schemas/project.schema.js
      → projectService.update(id, data, user)
          projectRepository.update()          Prisma
          auditService.log()                  other module → through its SERVICE
          revalidate(TAGS.projects)
  ← { ok: true }  or  { ok: false, code: 'VALIDATION_FAILED', fieldErrors }  (message from the catalog)
```

### 3.4 Modules
| Module | Owns (data) | Main jobs | Talks to |
|---|---|---|---|
| auth | — (uses `admin_users`) | login, logout, lockout, rate limit, JWT cookie, `requireAuth` | users, audit, rate-limits |
| users | `admin_users` | create, role, deactivate, reset password, own password | audit |
| enquiries | `enquiries`, `enquiry_notes` | submit (validate → store → email), list, filter, status, owner, notes, CSV | categories, rate-limits, resend, turnstile, audit |
| categories | `categories`, `category_images` | read for pages, edit text, gallery order, cover | media, audit |
| ~~projects~~ | `projects`, `project_images`, `project_categories` (kept, unused) | removed at the client's request, 24 Oct 2026 (no module, no pages) | — |
| client-logos | `client_logos` | CRUD, order | media, audit |
| faqs | `faqs` | CRUD, home / category FAQs | audit |
| industries | `industries` | read for pages (admin later) | — |
| settings | `site_settings` | contact, socials, founding year | audit |
| banner (new) | `site_settings` key `home.banner` | 1–3 slides, each with a desktop + mobile photo (the older single banner is read as slide 1) | media, audit |
| media | `media_assets` | Cloudinary signing, verify upload, delete unused | cloudinary |
| audit | `audit_logs` | write and list the log | — |
| rate-limits | `rate_limits` | fixed-window limiter | — |
| page-sections | — (reads `/content`, D5) | page copy for Home, About, Contact, category pages; nav | categories, faqs, industries, client-logos |

## 4. Data model
Full schema: `prisma/schema.prisma` (PostgreSQL, Prisma 6). Conventions: cuid ids, snake_case tables and columns, `created_at` / `updated_at`.

| Table | Main fields |
|---|---|
| `admin_users` | name, email (unique), password_hash, role (ADMIN / EDITOR), is_active, failed_login_count, locked_until, last_login_at, **token_version (new, task 05)** |
| `audit_logs` | actor_id, action, entity, entity_id, changes (JSON) |
| `media_assets` | public_id (unique), url, width, height, format, bytes, alt (required) |
| `categories` | slug, name, short_description, category_group, icon, overview, features (JSON), applications, hero_image_id, sort_order, is_active, seo_title, seo_description |
| `category_images` | category_id, asset_id, type (CATALOGUE / EXECUTED), caption, sort_order |
| `industries` | slug, name, icon, description, sort_order, is_active |
| `projects` | slug, title, client_name, city, state, year, description, industry_id, cover_image_id, is_featured, is_active, sort_order |
| `project_images` | project_id, asset_id, caption, sort_order |
| `project_categories` | project_id + category_id |
| `client_logos` | name, website_url, logo_id, sort_order, is_active |
| `faqs` | question, answer, category_id (null = global), show_on_home, sort_order, is_active |
| `enquiries` | name, company, email, phone (E.164), project_location, requirement, message, category_id, status, assigned_to_id, source_page, utm_*, ip_hash, user_agent, notified_at |
| `enquiry_notes` | enquiry_id, author_id, body |
| `site_settings` | key → JSON value (contact, social, founding year; `home.banner` new) |
| `rate_limits` | key + window_start → count |

Notes:
- Never edit an applied migration. Add one with `npm run db:migrate -- --name <change>` and update `docs/database-design.md`.
- No refresh-token table (decision D3). No `page_sections` table for now (D5).
- Seed (`npm run db:seed`) is create-missing: admin edits survive a re-seed.

## 5. API list
No public REST API and **no `docs/api/openapi.yaml`** (decision D12). This list is the contract:
update it **before** adding or changing any server action or route handler.
Since task 04 every action lives in `src/server/modules/<module>/<singular>.controller.js`.

### 5.1 Server actions (`'use server'`)
| Action | File | Who can call | Purpose | Feature |
|---|---|---|---|---|
| `submitEnquiry` | `enquiries/enquiry.controller.js` | Public | Enquiry form: validate → store → email → `/thank-you` | F5 |
| `login` | `auth/auth.controller.js` | Public | Admin login (rate limit, lockout, audit) | F6 |
| `logout` | `auth/auth.controller.js` | Editor, Admin | Log out (audit) | F6 |
| `changeOwnPassword` | `auth/auth.controller.js` | Editor, Admin | Change own password; signs out other sessions | F6 |
| `logoutEverywhere` | `auth/auth.controller.js` | Editor, Admin | Sign out on every device (`token_version` + 1, audit `LOGOUT_ALL`) | F6 |
| `updateCategory` | `categories/category.controller.js` | Editor, Admin | Edit category text, group, icon, SEO, order, active | F7 |
| `getUploadSignature` | `media/media.controller.js` | Editor, Admin | Signed Cloudinary params for a gallery upload | F7 |
| `attachUploadedImage` | `media/media.controller.js` | Editor, Admin | Verify upload, save asset, add to category gallery | F7 |
| `updateImage` | `media/media.controller.js` | Editor, Admin | Alt text, caption, type (catalogue / executed) | F7 |
| `moveImage` | `media/media.controller.js` | Editor, Admin | Reorder gallery | F7 |
| `setCoverImage` | `media/media.controller.js` | Editor, Admin | Set category cover | F7 |
| `removeImage` | `media/media.controller.js` | Editor, Admin | Remove from gallery; delete asset if unused | F7 |
| `getLogoUploadSignature` | `client-logos/client-logo.controller.js` | Editor, Admin | Signed Cloudinary params for a logo | F7 |
| `createClientLogo`, `updateClientLogo`, `deleteClientLogo` | `client-logos/client-logo.controller.js` | Editor, Admin | Client logos | F7 |
| `saveFaq`, `deleteFaq` | `faqs/faq.controller.js` | Editor, Admin | FAQs | F7 |
| `getBannerUploadSignature` | `banner/banner.controller.js` | Editor, Admin | Signed Cloudinary params for a desktop / mobile banner | F7 |
| `saveBannerImage`, `removeBannerImage`, `saveBannerAlt` | `banner/banner.controller.js` | Editor, Admin | Home banner slide (task 10h: 1–3 slides, each with a `slide` index): verify upload + minimum size, store in `site_settings` `home.banner` = `{ slides: [...] }`, remove a photo, alt text | F7 |
| `addBannerSlide`, `removeBannerSlide`, `moveBannerSlide` | `banner/banner.controller.js` | Editor, Admin | Add an empty slide (max 3), remove a slide and its unused photos, move a slide earlier/later | F7 |
| `updateEnquiry` | `enquiries/enquiry.controller.js` | Editor, Admin | Status and owner | F8 |
| `addEnquiryNote` | `enquiries/enquiry.controller.js` | Editor, Admin | Internal note | F8 |
| `saveSettings` | `settings/setting.controller.js` | Admin | Contact, socials, founding year | F9 |
| `createUser`, `updateUser`, `resetUserPassword` | `users/user.controller.js` | Admin | Users and roles | F6 |

### 5.2 Route handlers
| Method | Path | File | Who can call | Purpose | Feature |
|---|---|---|---|---|---|
| GET | `/admin/enquiries/export` | `src/app/admin/enquiries/export/route.js` | Editor, Admin (session) | CSV of filtered enquiries (BOM, formula-injection safe, max 10,000 rows, audit-logged) | F8 |
| GET | `/api/cron/maintenance` | `src/app/api/cron/maintenance/route.js` | Vercel cron (`Authorization: Bearer $CRON_SECRET`) | Email retries + data retention | F8 |
| GET | `/sitemap.xml` | `src/app/sitemap.js` | Public | Sitemap | F10 |
| GET | `/robots.txt` | `src/app/robots.js` | Public | Robots rules | F10 |

## 6. Auth and permissions
- **Method:** one **JWT access token** signed with `jose` (HS256), stored in an **HttpOnly, Secure (prod), SameSite=Lax** cookie. Valid **8 hours**. Never in localStorage. No refresh token (D3).
- **Claims:** `sub` (user id), `role`, `tv` (token version), `iat`, `exp`.
- **Instant logout:** `admin_users.token_version` increases on password change, role change, deactivation and logout-everywhere; any token with an old `tv` is rejected. (Replaces today's `pwv` password fingerprint.)
- **Checks:** middleware verifies the JWT on `/admin/*` (fast check); every controller calls `requireAuth(permission)`, which re-checks the user in the DB (active, not locked, `tv` matches) — this is the check that counts. The UI hides what the user can't use.
- **Roles:** Admin, Editor. One permission map: `src/server/auth/permissions.js` (D2).

| Permission | Admin | Editor |
|---|:-:|:-:|
| `dashboard:read` | ✅ | ✅ |
| `enquiry:read`, `enquiry:update`, `enquiry:export` | ✅ | ✅ |
| `content:write` (categories, projects, FAQs, logos, banner) | ✅ | ✅ |
| `media:upload` | ✅ | ✅ |
| `settings:write` | ✅ | — |
| `user:manage` | ✅ | — |
| `audit:read` | ✅ | — |

- **Keep from today:** scrypt hashes, 10-character minimum, lockout after 5 fails for 15 min, login rate limit (10 per 10 min per IP), no user enumeration, no open redirects, audit log of logins / logouts / lockouts, cannot remove the last admin or yourself.
- **Migration:** the old `im_admin_session` cookie stops working at deploy; admins log in once again.

## 7. Frontend
- **Layouts:** public site (header, footer, floating actions) and admin (sidebar shell).
- **Rendering:** server components by default; `"use client"` only for interactive leaves (Header, Gallery, FaqSection, EnquiryForm, Reveal, ScrollDrift, admin forms).
- **State:** no Redux, no RTK Query, no Context needed. Forms use `useActionState`; admin forms submit via `onSubmit` + `startTransition` (React 19 resets forms on every action).
- **Styles:** tokens in `styles/_variables.scss`; components in `_components.scss`, layout in `_layout.scss`, sections in `_sections.scss`, motion in `_motion.scss`.
- **Icons:** server components use `<Icon name="…" />`, client components `<ClientIcon />`. New icon: add to `scripts/build-icons.js`, run `npm run icons`, commit the generated files. CSS icons use the `css-icon` mixin.
- **Design and motion:** see `docs/DESIGN.md`.

## 8. Integrations
All optional and switched on by env variables; the site works without them.

| Provider | Adapter (target) | Timeout / retry | Failure shown to user as |
|---|---|---|---|
| Resend | `integrations/resend` | Daily cron retries failed sales emails (7 days) | Nothing — the lead is already stored |
| Cloudflare Turnstile | `integrations/turnstile` | One retry | Rejected: "We couldn't verify you're human…"; Cloudflare down: lead accepted and logged |
| Cloudinary | `integrations/cloudinary` | — | Admin error message on upload |
| Google Analytics 4 | client script | — | Nothing |

## 9. Error codes for this project
Messages are the ones the app shows today; `FORBIDDEN` and `NOT_FOUND` use the wording in `docs/STANDARDS.md` §10. The full catalog (`src/shared/errors.js`) is built in task 06.

| Code | Status | Message to user |
|---|---|---|
| `VALIDATION_FAILED` | 422 | Please correct the highlighted fields. |
| `ENQUIRY_TOO_FAST` | 422 | That was very quick! Please check your details and submit again. |
| `CAPTCHA_FAILED` | 422 | We couldn't verify you're human. Please wait a moment and submit again. |
| `ENQUIRY_RATE_LIMITED` | 429 | Too many enquiries from your network. Please try again in a few minutes. |
| `ENQUIRY_NOT_SAVED` | 503 | Sorry, we couldn't submit your enquiry right now. Please try again shortly or contact us directly. |
| `AUTH_INVALID_CREDENTIALS` | 401 | Invalid email or password. |
| `AUTH_RATE_LIMITED` | 429 | Too many attempts. Please wait a few minutes and try again. |
| `AUTH_LOCKED` | 423 | This account is temporarily locked. Try again in 15 minutes. |
| `FORBIDDEN` | 403 | You don't have access to this. |
| `NOT_FOUND` | 404 | We couldn't find what you were looking for. |

## 10. Decisions
| # | Decision | Why | Date |
|---|---|---|---|
| D1 | Keep the stack; refactor into MVC modules, do not rebuild | Security, validation, accessibility and performance work is already done | 20 Oct |
| D2 | Auth uses **`jose` JWTs, not Auth.js** (overrides STANDARDS §0). Permission map at `src/server/auth/permissions.js` | Edge-compatible; we keep our own login rules | 21 Oct |
| D3 | **One** JWT access token in an HttpOnly cookie, valid **8 hours**, plus `token_version` for instant logout. **No refresh-token table** for now | Lean; staff sessions are one working day | 21 Oct |
| D4 | Stay on JavaScript; no `checkJs` for now | Lean | 21 Oct |
| D5 | Keep `/content` as it is for now. `page_sections` table only later, if the client wants to edit text | Lean; copy rarely changes | 21 Oct |
| D6 | pino logger and Sentry only at go-live (task 08) | Lean | 21 Oct |
| D7 | No Husky, lint-staged or commitlint for now | Lean | 21 Oct |
| D8 | Server pagination only where lists grow: enquiries, projects, audit log | Other lists stay small | 21 Oct |
| D9 | Environments: local (PGlite test DB) and production; staging = Vercel preview links | Lean | 21 Oct |
| D10 | Bootstrap + Sass recreating the Crafto theme in our own code; never Tailwind / shadcn; never copy theme files | Client approved the theme look | Oct |
| D11 | Never run the app, tests or seeds against the production DB; tests use PGlite on 127.0.0.1:5433 | Test leads reached production on 13 Oct | 13 Oct |
| D12 | No OpenAPI file; §5 lists every server action and route handler and is updated before any change | No public REST API | 21 Oct |
| D13 | JSDoc (`@param`, `@returns`) required on new and moved code only | No `checkJs` yet (D4) | 21 Oct |
| D14 | Vercel previews never use a database: `DATABASE_URL` / `DIRECT_URL` are set for Production only; previews run on `/content`. No Neon preview branch for now | Previews are public links and must not touch live data | 21 Oct |
| D15 | Backups: Neon's built-in restore + a daily `pg_dump` saved as a GitHub Actions artifact (private repo, kept 30 days), set up in task 08 | No extra storage service needed | 21 Oct |

## 11. Rules kept from `docs/OLD-CLAUDE.md`
- Never use `export const dynamicParams = false` on ISR pages: after `revalidateTag()` Next.js 15 throws NoFallbackError and serves 404. Use `notFound()` for unknown slugs.
- Every database write from the admin must call `revalidateTag()` with the matching tags, or static pages keep old data.
- Integrations stay optional and env-gated. Turnstile: block a rejected token, accept on Cloudflare outage (ADR-10).
- Leads: validate → save to DB → email. Never report success in production if the lead was not stored or sent.
- Database changes: edit `prisma/schema.prisma`, run `npm run db:migrate -- --name <change>`, never edit an applied migration, update `docs/database-design.md`.
- WCAG AA: body text `#5f5e5e`, secondary text `$muted` (never lighter greys), darker gradient stops.
- Images: files under `public/images/work/<category>/`, registered in `content/gallery.js` with real width/height and descriptive alt, then `npm run check:content`.
- Motion: own code in `styles/_motion.scss`, no animation library; content never hidden without JS; `prefers-reduced-motion` turns it all off; sections with sideways drift need `overflow-x: clip`.
- Galleries: even grid of square tiles, 9 + "Show all", lightbox shows the full photo.
- Before finishing a change: `npm run check:content`, `npm run build` with no warnings, browser check at desktop and 390 px (no sideways scroll, no console errors).

## 12. Conflicts and questions
- **Home order:** OLD-CLAUDE.md fixes the product grid right after About; the client's 15 Oct doc removes it. The old rule stays until the client answers (1-PROJECT §11, question 1).
- **AGENTS.md rule 4** (Prisma only in repositories) applies to new and moved code now, and to all code after task 04.
- **Resolved 21 Oct:** OpenAPI → D12; JSDoc → D13; `FORBIDDEN` / `NOT_FOUND` wording → §9; preview database → D14 (no database on previews); backups → D15.
