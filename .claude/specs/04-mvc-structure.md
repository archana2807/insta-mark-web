# Spec — Task 04 `04-mvc-structure`

## Why

- Today code is grouped by file type (`app/`, `lib/`, `components/`), and server actions and admin pages call Prisma directly. Business rules, queries and input handling are mixed in one file.
- Tasks 05 (JWT + permissions) and 06 (error catalog, env) need one clear place for each job: controller, service, repository (2-ARCHITECTURE §3, R-11.1–R-11.6).

## What changes

1. All app code moves under `src/` (`app/`, `components/`, `lib/`, `styles/`, `middleware.js`). `content/` stays at the root (D5). `@/…` points to `src/`; `@/content/…` still points to `/content`.
2. Server code lives in `src/server/`:
   - `modules/<module>/` with `<singular>.controller.js` (`'use server'`), `.service.js`, `.repository.js` for: enquiries, categories, projects, client-logos, faqs, industries, settings, media, users, auth, audit, rate-limits, page-sections.
   - `page-sections` has a service only: it serves the page copy from `/content` (D5: the `page_sections` table comes later).
   - `integrations/` (resend, cloudinary, turnstile), `auth/` (password, token, session), `db.js`, `cache.js`, `request.js`, `config/env.js` (only `isDatabaseConfigured` for now; task 06 completes it).
3. Prisma is imported only in `*.repository.js` and `src/server/db.js`. ESLint `no-restricted-imports` fails lint (and so `next build`) otherwise, and also when a module imports another module's repository, or a page/component imports a repository.
4. Controllers: auth check → parse with a shared schema → ONE service call → same return shape as today. Route handlers (CSV export, cron) do the same.
   - Auth runs before parsing, as today, so a logged-out request never sees validation details.
5. Services hold the rules (validate → store → notify, audit, revalidate, "last admin" check…). They call other modules only through their services.
6. Shared Zod schemas in `src/shared/schemas/` (enquiry + its rules, login/password, user, category, project, faq, client-logo, settings, media, enquiry-admin). Shared constants in `src/shared/constants.js`. The enquiry rules are used by the browser form and the server.
7. Admin pages and public pages read only through services. Pages, components and their output stay the same.
8. `docs/2-ARCHITECTURE.md` §5: "File today" column updated to the new controller paths (AGENTS: update §5 before changing actions).

## Done when

1. Code lives in `src/` module folders with `<module>.controller.js`, `.service.js`, `.repository.js`.
2. `@prisma/client` and `src/server/db.js` are imported only in `*.repository.js` and `src/server/db.js`; a unit test proves ESLint reports an error for a violating file, and `npm run lint` passes.
3. Every controller does auth → parse → ONE service call; services reach other modules only through their services (lint blocks cross-module repository imports).
4. Shared Zod schemas live in `src/shared/schemas/`; the browser enquiry form and the server use the same rules (unit tests).
5. Everything behaves as before: all e2e tests green (form, admin 42/42, crawl, overflow), and the 42 local screenshots (public + admin, 1440 px and 390 px) match the baseline.
6. `npm run lint`, `npm test`, `npm run check:content`, `npm run build` (no warnings) pass.

## NOT in this task

- No new features, no visual changes, no change to messages or return shapes.
- `/content` is not removed (D5). No JWT / permissions (task 05). No error catalog / env validation (task 06).
- No new npm packages.
