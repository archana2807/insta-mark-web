# Insta Mark website — spec update: MVC architecture, JWT auth, scalability

**Date:** 20 Oct 2026 · **v2** (aligned with the Medium Project Kit) · **Based on:** current-state.md (commit `ff09d02`), requirements.md, design.md
**How to use this file:** follow `kit-adoption-plan.md`. Part A goes into `docs/1-PROJECT.md`,
Part B into `docs/2-ARCHITECTURE.md`, Part C into `AGENTS.md` (project rules).

> **v2 changes (only these):** §2.1 stack note, §2.2 layer table, §2.3 folder structure (by
> module, as in kit STANDARDS §2B), §2.4 naming, §2.5 request flow, Part C, D1. Everything
> else is the same as v1.

---

## Key decision: refactor, do not rebuild

The current code is good in the areas that are hardest to get right: security headers,
form validation, spam protection, accessibility (axe 0 violations), Lighthouse 93–95, audit
log. A rebuild from scratch would throw that away and add 2–3 weeks of risk.

**Plan:** keep the stack (Next.js 15, Prisma, Postgres, Bootstrap, the theme work) and
reorganise the code into clear MVC layers, replace the custom session cookie with
JWT-in-cookie auth, add role-based permissions, and add tests/CI **before** moving code,
so we can prove nothing breaks.

---

# PART A — add to `requirements.md`

> Insert as new sections **§11, §12, §13**. Renumber the current "§11 Open questions"
> to **§14**. In §10, change the status of **R-10.6** to: "⬜ long-form copy → moves to DB (R-11.5)".

## 11. Architecture and code quality

| Id | Requirement | Source | Status |
|---|---|---|---|
| R-11.1 | Code follows a layered **MVC** structure: **Model** (data access), **Service** (business rules), **Controller** (input, auth, permission, response), **View** (pages and components). | Team (20 Oct) | ⬜ |
| R-11.2 | Layers only call downward: View → Controller → Service → Model → database. Only Model files may import Prisma. | Team | ⬜ |
| R-11.3 | One clear folder and file naming convention, documented in CLAUDE.md and design.md §2. | Team | ⬜ |
| R-11.4 | Each feature is a module (model + service + controller + validator + views). Adding a feature must not require editing unrelated modules. | Team | ⬜ |
| R-11.5 | **One source of truth for data: the database.** The `/content` fallback is retired; `/content` becomes seed data only. Long-form page copy moves to the DB. | Team | ⬜ |
| R-11.6 | Shared input rules (Zod) live in one place and are reused by browser and server. | Team | 🟡 exists for enquiry only |
| R-11.7 | Central error handling: users see safe messages; full details go to server logs only. | Team | ⬜ |
| R-11.8 | All environment variables are validated at startup; the app refuses to start with missing or invalid required values. | Team | ⬜ |

## 12. Authentication and access control

| Id | Requirement | Source | Status |
|---|---|---|---|
| R-12.1 | Admin login with email + password issues a **JWT access token** stored in an **HttpOnly, Secure, SameSite cookie**. Tokens are never stored in localStorage or readable by JavaScript. | Team | ⬜ (today: custom HMAC cookie) |
| R-12.2 | Short-lived access token (15 min) plus a **refresh token** (cookie) that is rotated on every use, stored hashed in the DB, and can be revoked. Reuse of an old refresh token logs out that whole session family. | Team | ⬜ |
| R-12.3 | **Role-based access control** from one permission map. Roles today: ADMIN, EDITOR. Adding a role (e.g. SALES) means editing one file. | Team | 🟡 2 roles hard-coded |
| R-12.4 | Permissions are checked in three places: middleware (route level), every controller (action level), and the UI (hide what the user can't use). The controller check is the one that counts. | Team | 🟡 |
| R-12.5 | Password change, role change or deactivation invalidates all of that user's tokens immediately. | Team | ✅ (keep: `pwv` → `token_version`) |
| R-12.6 | Keep existing protections: scrypt hashing, 10-char minimum, lockout after 5 fails, login rate limit, no user enumeration, no open redirects, audit log of logins/logouts/lockouts. | S5 | ✅ keep |
| R-12.7 | Logout clears both cookies and revokes the refresh token. "Log out all devices" option on the account page. | Team | ⬜ |

## 13. Scalability and operations

| Id | Requirement | Source | Status |
|---|---|---|---|
| R-13.1 | The app is stateless (no in-memory sessions), so it can run on many servers at once. | Team | ✅ after R-12 |
| R-13.2 | Database uses a pooled connection at runtime and a direct connection for migrations; indexes exist for every list filter and sort used in admin. | Team | 🟡 |
| R-13.3 | Every admin list is paginated on the server. | Team | 🟡 enquiries only |
| R-13.4 | Separate environments: local (test DB), staging, production. Local runs can never reach the production DB. | Team | ⬜ (incident 13 Oct) |
| R-13.5 | Automated tests (unit + end-to-end) and a CI pipeline (lint, build, tests) on every push. | Team | ⬜ |
| R-13.6 | Structured server logs; error tracking (e.g. Sentry) ready to switch on with a key. | Team | ⬜ |

---

# PART B — changes to `design.md`

> **Replace** §2 "Architecture (unchanged)" with the new §2 below.
> **Replace** §7 "Quality and tooling" with the new §7 below.
> **Replace** §8 "Delivery order" with the new §8 below.
> §1, §3–§6 stay as they are, except: in §5.4, references to `/content` now mean the
> `page_sections` table (see §2.6).

## 2. Architecture (change)

### 2.1 Stack
Unchanged: Next.js 15 App Router, React 19, plain JavaScript (ES modules, JSDoc types
checked by `checkJs` — kit STANDARDS §0A), Prisma 6 + PostgreSQL (Neon), Bootstrap 5 + Sass,
Zod, Resend, Cloudinary, Vercel. **Shape:** single Next.js app (kit STANDARDS §2B).
**New:** `jose` (JWT, works in Edge middleware), `server-only`, pino (logs), Vitest (unit),
Playwright (e2e), ESLint + Prettier + Husky + lint-staged + commitlint.

### 2.2 How MVC maps to Next.js

Code is grouped **by business module** (kit STANDARDS §1: "organise by module, not by file
type"). Inside each module, the files are the MVC layers:

| Layer | File | Job | May call |
|---|---|---|---|
| **View** | `src/app/**` (routes), `src/components/**` | Render pages; server components read data through a module's **service**; forms call the module's **controller** | Services (read only), controllers |
| **Controller** | `src/server/modules/<module>/<module>.controller.js` (`'use server'`) | Parse input (shared Zod schema), `requireAuth(permission)`, call **ONE** service function, return `{ ok, code, fieldErrors }` or redirect | Its own service, `server/auth` |
| **Service** | `<module>.service.js` | Business rules: "validate → store → notify", ownership checks, transactions, audit log, cache revalidation. Throws `AppError` with a catalog code | Its own repository, **other modules' services**, integrations |
| **Model** | `<module>.repository.js` | All Prisma queries for this module. The **only** place Prisma is imported | `src/server/db.js` |

Rules (enforced by ESLint `no-restricted-imports` / `import/no-restricted-paths`):
- `@prisma/client` and `src/server/db.js` only inside `*.repository.js`.
- A module never imports another module's repository — only its service.
- Everything in `src/server/` starts with `import 'server-only'` (except shared schemas),
  so it can never end up in the browser bundle.
- Route handlers (`src/app/api/**/route.js`) are controllers too: parse → auth → one service call → response.

### 2.3 Folder structure

```
insta-mark-web/
├─ AGENTS.md  CLAUDE.md  .claude/settings.json  .github/  .editorconfig  .env.example
├─ docs/                    kit docs: STANDARDS, PROMPTS, 1-PROJECT, 2-ARCHITECTURE, 3-INFRA, TASKS,
│                           DESIGN.md, CURRENT-STATE.md, changes/CR-01.md, api/openapi.yaml
├─ prisma/
│  ├─ schema.prisma  migrations/  seed.js
│  └─ seed-data/            ← was /content (copy, categories, FAQs, industries)
├─ public/
├─ src/
│  ├─ app/                  ← VIEW: routes only, thin
│  │  ├─ (site)/            public pages
│  │  ├─ admin/             admin pages + loading.jsx / error.jsx per section
│  │  ├─ api/
│  │  │  ├─ auth/refresh/route.js   auth/logout/route.js
│  │  │  ├─ admin/enquiries/export/route.js
│  │  │  ├─ cron/maintenance/route.js
│  │  │  └─ health/route.js   ready/route.js
│  │  ├─ error.jsx  global-error.jsx  not-found.jsx
│  │  └─ sitemap.js  robots.js
│  ├─ components/           ← VIEW building blocks (Bootstrap + theme)
│  │  ├─ ui/                Button, Eyebrow, Reveal, BtnText, Spinner, Skeleton …
│  │  ├─ shared/            EmptyState, ErrorState, ConfirmDialog, DataTable, Pagination, Toast
│  │  ├─ layout/            Header, Footer, FloatingActions, AdminShell
│  │  ├─ sections/          HomeHero, InnerHero, CategoryGrid, Gallery …
│  │  └─ forms/             EnquiryForm, FormField …
│  ├─ server/               ← server-only code
│  │  ├─ modules/
│  │  │  ├─ enquiries/      enquiry.controller.js · enquiry.service.js · enquiry.repository.js · enquiry.test.js
│  │  │  ├─ categories/     category.controller.js · category.service.js · category.repository.js
│  │  │  ├─ projects/  client-logos/  faqs/  industries/  settings/  banner/
│  │  │  ├─ page-sections/  media/  users/  auth/  audit/  rate-limits/
│  │  ├─ integrations/      resend/resend.adapter.js · cloudinary/cloudinary.adapter.js · turnstile/turnstile.adapter.js
│  │  ├─ auth/              jwt.js · cookies.js · password.js · session.js (requireAuth) · permissions.js
│  │  ├─ errors/            app-error.js (AppError + subclasses)
│  │  ├─ config/env.js      Zod-validated env — the only place that reads process.env
│  │  ├─ db.js              Prisma singleton
│  │  ├─ cache.js           cache tags + revalidate helpers
│  │  └─ logger.js          pino JSON logs
│  ├─ shared/               ← used by browser AND server
│  │  ├─ schemas/           enquiry.schema.js, project.schema.js … (Zod + JSDoc typedefs)
│  │  ├─ errors.js          error catalog: codes + user messages (kit STANDARDS §10)
│  │  └─ constants.js
│  ├─ lib/                  small browser-safe helpers (getErrorMessage, utils)
│  ├─ config/site.js        nav, public constants
│  ├─ styles/               Sass partials (unchanged)
│  └─ middleware.js
└─ tests/
   ├─ unit/                 Vitest: schemas, permissions, jwt, refresh rotation, services
   └─ e2e/                  Playwright: form, admin, auth, a11y, links, SEO, overflow (+ db.sh for PGlite)
```

### 2.4 Naming conventions (kit STANDARDS §14)

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
| Branches / commits | `feat/<task-id>-<name>`, Conventional Commits | `feat(enquiries): move to module` |

### 2.5 Request flow (example: admin updates a project)

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

### 2.6 Data: one source of truth (change)
- The dual data source (`db-source.js` / `content-source.js`) is removed. Pages read through services, services through models, models from Postgres only.
- `/content` moves to `prisma/seed-data/` and is used only by `npm run db:seed` (create-missing by default, as today).
- **New table `page_sections`** for long-form copy (home, about, process, page intros):
  `id, page (text), key (text), content (JSON), sort_order, updated_at`, unique `(page, key)`.
  Seeded from the current content files. Admin editing screen comes in a later round (§8 step 9); until then copy changes are a seed/DB update, not a code change.
- Local development and tests use a local Postgres/PGlite seeded with the same data.
- Caching: unchanged idea — services wrap reads in `unstable_cache` with tags; every write calls `revalidate(tag)` from `src/server/cache.js`.

### 2.7 Authentication: JWT in cookies (change)

| Item | Design |
|---|---|
| Access token | JWT, HS256, signed with `JWT_ACCESS_SECRET` (≥ 32 random bytes). Claims: `sub` (user id), `role`, `tv` (token version), `iss`, `aud`, `iat`, `exp`. Life: **15 min** |
| Access cookie | `im_at` — HttpOnly, Secure (prod), SameSite=Lax, Path=/ |
| Refresh token | Random 256-bit opaque string (not a JWT). Stored as SHA-256 hash in new table `refresh_tokens`. Life: **8 h** idle, **7 days** absolute |
| Refresh cookie | `im_rt` — HttpOnly, Secure, SameSite=Strict, Path=`/api/auth` |
| Rotation | Every refresh issues a new refresh token and revokes the old one. Using a revoked token revokes the whole `family_id` and logs it in the audit log |
| Login | `authController.login` → rate limit → lockout check → password verify → issue both cookies → audit → redirect (safe `next` only) |
| Middleware | On `/admin/*`: verify `im_at` with `jose`. Valid → continue. Expired/missing but `im_rt` present → redirect to `/api/auth/refresh?next=…`. Neither → `/admin/login`. Also checks the route-level permission from `permissions.js` |
| Controller check | `requireAuth(permission)` verifies the JWT again, loads the user, checks `is_active`, `locked_until` and `token_version === tv`, then `can(user, permission)`. Throws `ForbiddenError` otherwise |
| Revocation | `admin_users.token_version` (int) increases on password change, role change, deactivation or "log out all devices" → all existing access tokens fail at the controller check; all refresh tokens for the user are revoked |
| CSRF | Server actions: Next.js built-in origin check. Route handlers that change data: POST only + `Origin` header must match the site |
| Migration | Existing `im_admin_session` cookie stops working at deploy; admins log in once again |

New table `refresh_tokens`: `id, user_id → admin_users (cascade), token_hash (unique), family_id, expires_at, revoked_at, replaced_by_id, user_agent, ip_hash, created_at`. Index on `(user_id)`, `(family_id)`. Expired rows deleted by the daily cron.
Change to `admin_users`: add `token_version int default 0` (replaces the `pwv` fingerprint).

### 2.8 Access control (RBAC)

`src/auth/permissions.js` is the single source:

| Permission | ADMIN | EDITOR |
|---|:-:|:-:|
| `dashboard:read` | ✅ | ✅ |
| `enquiry:read`, `enquiry:update` | ✅ | ✅ |
| `enquiry:export` | ✅ | ✅ |
| `content:write` (categories, projects, FAQs, logos, banner, page sections) | ✅ | ✅ |
| `media:upload` | ✅ | ✅ |
| `settings:write` | ✅ | — |
| `user:manage` | ✅ | — |
| `audit:read` | ✅ | — |

Route map in the same file (e.g. `/admin/settings` → `settings:write`). The UI uses
`can(user, perm)` to hide links and buttons. Existing safety rules stay: you can't remove
the last admin or yourself.

### 2.9 Scalability and operations
- **Stateless servers:** JWT + DB-backed refresh tokens; no in-memory state → safe on multiple Vercel instances.
- **Database:** `DATABASE_URL` = Neon **pooled** URL (runtime); `DIRECT_URL` = direct URL (migrations). Prisma client singleton. Add indexes: `enquiries(status, created_at)`, `enquiries(category_id)`, `projects(is_active, sort_order)`, `category_images(category_id, type, sort_order)`, `refresh_tokens(user_id)`.
- **Pagination:** every admin list (enquiries, projects, logos, FAQs, users, audit) paginated server-side, 25 per page.
- **Rate limiting:** stays in Postgres for now; `rate-limit.repository.js` hides the storage so it can move to Redis (e.g. Upstash) later without touching controllers.
- **Env config:** `src/server/config/env.js` validates all variables with Zod at startup; optional integrations stay optional (as today).
- **Errors:** controllers catch errors in one helper (`handleError`) → safe message to the user, full detail to `logger`. Sentry hook ready behind `SENTRY_DSN`.
- **Environments:** local (PGlite/local Postgres), staging (Vercel preview + Neon branch), production. `env.js` refuses to run tests or `next start` locally against a URL that matches the production DB host.
- **Media:** Cloudinary + `next/image` (unchanged); originals never served raw.
- **Future public API:** if ever needed, under `/api/v1/`, reusing the same controllers.

## 7. Quality and tooling (change)

| Item | Design |
|---|---|
| Unit tests | Vitest in `tests/unit/`: validators, permissions, jwt sign/verify/expiry, refresh rotation + reuse detection, enquiry service |
| E2E tests | Move the local Playwright suites into `tests/e2e/` (form 16, admin 43, a11y/links/SEO crawl, overflow). Add auth tests: login, expiry → refresh, logout, editor blocked from settings, deactivated user kicked out |
| Test DB guard | `tests/e2e/db.sh` starts PGlite on 127.0.0.1:5433; runner refuses to start unless `DATABASE_URL` points there |
| Lint | `eslint.config.mjs` (`next/core-web-vitals` + layer import rule from §2.2); `npm run lint` |
| CI | GitHub Action on every push/PR: install → lint → `check:content` → build → unit → e2e (PGlite) |
| Clean-up | Delete `StatsLine.jsx` and dead CSS; retire `PageHero`; fix stale comments; mark Tailwind references in old docs as superseded; shorten README status into a changelog |

## 8. Delivery order (change)

Each step ends with: lint, unit + e2e tests green, clean build, browser check at desktop
and 390 px, commit. **No visual change** is allowed in steps 2–4.

| # | Work | Requirements | Blocked by |
|---|---|---|---|
| 1 | **Safety net first:** tests into repo, test-DB guard, ESLint, CI | R-13.4, R-13.5 | — |
| 2 | **Restructure** into `src/` MVC folders (models, services, controllers, validators, views); thin `actions.js`; ESLint layer rule. Behaviour identical | R-11.1–11.4, 11.6, 11.7 | 1 |
| 3 | **Single data source:** remove content fallback, `page_sections` table + seed, env validation | R-11.5, R-11.8 | 2 |
| 4 | **JWT auth + RBAC:** `jose`, refresh tokens table, rotation, `token_version`, permission map, middleware + controller checks, logout-all | R-12.x, R-13.1 | 2 |
| 5 | Indexes, pooled/direct URLs, pagination everywhere, logger + Sentry hook | R-13.2, 13.3, 13.6 | 3 |
| 6 | Client fixes: remove banner vertical label, hide founding-year badge, About "Why Choose Us", category cover fix, one hero system | R-3.4, R-1.5, R-5.3, R-8.2 | 2 |
| 7 | Banner (desktop + mobile, admin page); send sizes to client | R-3.1, R-3.2, R-8.1 | 4, Cloudinary keys |
| 8 | Home order, About paragraphs, quote band, FAQs; auto-reply email; GA honeypot fix | R-3.0, 3.5, 3.9, 3.13, R-7.8 | Q1, Q2, Resend keys |
| 9 | Admin editor for `page_sections` and industries | R-10.6 | 3 |
| 10 | Content swaps as client supplies them | R-2.2, 2.3, 4.2, 4.3, 4.6, 7.7 | Q3–Q6 |
| 11 | Launch: Vercel Pro, domain, rotate all credentials (Vercel token, Neon password, admin password, new JWT secret), privacy approval | R-10.5, R-10.7 | Client |

> If the client needs visible progress urgently, step 6 can be done before step 2 — it
> is small. Everything else should follow the order above.

---

# PART C — `AGENTS.md` project-specific rules (v2: was CLAUDE.md)

The kit allows 0–5 project rules at the bottom of `AGENTS.md`. Use these five; the general
rules (layers, tokens only in HttpOnly cookies, env only via `config/env.js`, tests before
commit) are already in the kit's AGENTS.md and STANDARDS.md.

1. **Look and feel:** UI is Bootstrap 5 + Sass recreating the Crafto "Branding Agency" demo in our own code. Never add Tailwind or shadcn, never copy theme files, and never change the look in a refactor task.
2. **Client facts:** never invent client facts (phone, address, clients, stats, founding year, promises). Unconfirmed values stay `null` and hidden.
3. **Production data:** never run the app, tests or seeds against the production database. Tests use PGlite on 127.0.0.1:5433 only.
4. **Single Next.js app** (2-ARCHITECTURE overrides STANDARDS §0): controllers are `<module>.controller.js` (`'use server'`): parse → `requireAuth(permission)` → ONE service call. Prisma only in `*.repository.js`.
5. **Quality bar on every page:** WCAG 2.1 AA (axe 0 violations), no sideways scroll at 390 px, Lighthouse ≥ 90, works with reduced motion, enquiry form works without JS.

---

# Open decisions for our team

| # | Decision | Recommendation |
|---|---|---|
| D1 | TypeScript now or later? | Stay on JavaScript (kit default). Turn on `checkJs` for `src/server` and `src/shared` first, then the rest folder by folder |
| D2 | Do client fixes (step 6) before the refactor? | Only if the client deadline is this week |
| D3 | Add a `SALES` role (enquiries only)? | Yes if the client's sales team will log in; it's one entry in `permissions.js` |
