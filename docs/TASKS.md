# TASKS.md — tasks

> One task at a time, in this order (see `docs/insta-mark-steps.md` for the cycle).
> Status: [ ] todo · [~] in progress · [x] done
> Every task also ends with: `npm run check:content`, a clean `npm run build`, browser check at
> desktop and 390 px (no sideways scroll, no console errors), tests green (from task 02 on).

- [x] **01 `01-kit-setup`** — kit docs and rules (no code)

- [~] **02 `02-tests-ci`** (M) — safety net before any refactor. Website looks different: **no**
  - Done when: the Playwright suites (enquiry form, admin, a11y/links/SEO crawl, 390 px overflow) live in `tests/e2e/` and run with one npm command.
  - Done when: the test runner starts PGlite on 127.0.0.1:5433 and **refuses to run** if `DATABASE_URL` points anywhere else (R-13.4).
  - Done when: ESLint is set up (`eslint.config.mjs`, `next/core-web-vitals`) and `npm run lint` passes without disabling rules.
  - Done when: a GitHub Action runs install → lint → `check:content` → build → e2e on every push and PR, and it is green.
  - Done when: `docs/3-INFRA.md` states the rule: Vercel `DATABASE_URL` / `DIRECT_URL` are set for Production only; previews never get a database (D14). No Neon preview branch.
  - Done when: all existing checks still pass (form 16/16, admin 42/42, axe 0 violations, no overflow).
  - Not in this task: Husky, lint-staged, commitlint, `checkJs` (D4, D7).

- [ ] **03 `03-quick-client-fixes`** (S) — Website looks different: **yes** (show the client)
  - Done when: the home banner has no vertical side label (R-3.4; inner pages per question 7).
  - Done when: the "10+ years" badge is hidden until the founding year is confirmed (R-1.5).
  - Done when: About "Why Choose Us" shows the six items from the client's About text (R-5.3).
  - Done when: the category cover chosen in admin is the photo shown on the category hero, product grid and Solutions page (R-8.2).
  - Done when: the e2e tests cover these four changes.

- [ ] **04 `04-mvc-structure`** (L — split into 04a enquiries, 04b content, 04c admin if too big) — Website looks different: **no**
  - Done when: code lives in `src/` module folders with `<module>.controller.js`, `.service.js`, `.repository.js` (2-ARCHITECTURE §3).
  - Done when: Prisma is imported only in `*.repository.js` and `src/server/db.js`, and an ESLint rule fails the build otherwise (R-11.2).
  - Done when: controllers do parse → auth → ONE service call; services call other modules only through their services (R-11.1, R-11.4).
  - Done when: shared Zod schemas live in `src/shared/schemas/` and are used by browser and server (R-11.6).
  - Done when: every page, form and admin action behaves exactly as before: all e2e tests green, screenshots unchanged at desktop and 390 px.
  - Not in this task: new features, visual changes, removing `/content` (D5).

- [ ] **05 `05-jwt-login-roles`** (M) — Website looks different: **no** (admins log in once again)
  - Done when: login issues ONE `jose` JWT in an HttpOnly, Secure, SameSite=Lax cookie, valid 8 hours; no token in localStorage (R-12.1, D3).
  - Done when: `admin_users.token_version` exists (migration); password change, role change, deactivation and "log out everywhere" make old tokens fail at once (R-12.5).
  - Done when: `src/server/auth/permissions.js` is the only role map; middleware checks the route, every controller calls `requireAuth(permission)`, the UI hides what the user can't use (R-12.3, R-12.4).
  - Done when: an Editor gets "forbidden" on settings, users and audit, also when calling the action directly.
  - Done when: logout clears the cookie; lockout, rate limit, no enumeration, no open redirect and audit logging still work (R-12.6, R-12.7).
  - Done when: e2e tests cover login, expiry, logout, role blocks and a deactivated user being kicked out.
  - Not in this task: refresh tokens (D3).

- [ ] **06 `06-errors-env`** (M) — Website looks different: **no**
  - Done when: one error catalog (`src/shared/errors.js`) holds every code and user message (2-ARCHITECTURE §9); users see safe messages, full details only in server logs (R-11.7).
  - Done when: `src/server/config/env.js` validates all env variables with Zod at start-up; required ones missing → the app refuses to start; optional integrations stay optional (R-11.8).
  - Done when: admin sections have loading and error screens; empty lists show an empty state.
  - Done when: enquiries, projects and audit lists are paginated on the server (D8, R-13.3).
  - Done when: e2e tests cover one error message, one empty state and pagination.
  - Not in this task: pino and Sentry (D6, task 08).

- [ ] **07 `07-client-changes`** (L — split into 07a banner, 07b home order + content, 07c auto-reply) — Website looks different: **yes**
  - Done when: Editors and Admins upload a desktop and a mobile banner in `/admin/banner`; the site shows the right one per screen width, with the old photo as fallback (R-3.1, R-8.1).
  - Done when: the banner sizes are sent to the client: desktop 1920 × 1720 px, mobile 1080 × 1080 px (R-3.2).
  - Done when: the home page follows the order the client confirms (R-3.0, question 1), with the agreed About text (R-3.5), the quote (R-3.9) and the FAQs (R-3.13).
  - Done when: the visitor gets an auto-reply email after an enquiry; a failure never blocks the thank-you page (R-7.8).
  - Done when: honeypot hits no longer count as a GA4 conversion.
  - Blocked by: client answers (questions 1–2), Cloudinary and Resend keys.

- [ ] **08 `08-go-live`** (M) — Website looks different: no
  - Done when: every item in the `docs/3-INFRA.md` go-live checklist is ticked (Vercel Pro, domain, rotated secrets, Resend, backups, Sentry, uptime, privacy policy, client facts, Lighthouse).
  - Done when: pino JSON logs and Sentry are on (D6).
  - Done when: backups run: Neon's built-in restore is on, and a daily GitHub Actions job saves a `pg_dump` as an artifact kept 30 days (private repo) (D15).
  - Done when: a restore from backup has been tested and dated in `3-INFRA.md`.
  - Blocked by: client (domain, Pro plan, privacy approval, facts).
