# Plan — Task 04 `04-mvc-structure`

Spec: `.claude/specs/04-mvc-structure.md`. Pure refactor: no change to look, messages or behaviour.

## Baseline (before any change)

- `npm run test:e2e`: 50 passed (crawl, overflow, form 16/16, admin 42/42).
- 42 screenshots (10 public + 11 admin pages × 1440 / 390 px, reduced motion) taken with a local, uncommitted Playwright config (`tmp-visual/`, git-excluded). A rerun of the same build matched 100 %.
- Finding: `.next/cache` (Next.js data cache) survives rebuilds, so a build made after an admin e2e run still shows the admin suite's edits (test phone number, renamed category). The first baseline was polluted that way. Fix: baseline rebuilt from commit `58c8a2a` in a separate git worktree with a fresh `.next`; the new code is compared on a fresh `.next` too (old folder moved aside, not deleted). Vercel always builds fresh, so production is not affected.

## Decisions

| Topic                                         | Choice                                                                                                                                                                     | Why                                                                                         |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Move to `src/`                                | `git mv` whole folders                                                                                                                                                     | Keeps history; Next.js uses `src/app` when no root `app/` exists                            |
| Alias                                         | `@/*` → `src/*`, `@/content/*` → `content/*`                                                                                                                               | Most imports stay untouched                                                                 |
| Page copy from `/content`                     | `page-sections` service (no repository yet)                                                                                                                                | D5 keeps `/content`; spec-update §2.3 names this module; avoids putting copy logic in pages |
| `/content` fallback when no DB (D14 previews) | Each service picks DB repository or `/content`                                                                                                                             | Same behaviour as `lib/data` today                                                          |
| Cache                                         | `src/server/cache.js`: tags, `cached()`, revalidate helpers; services use it                                                                                               | Cache revalidation is a service job (§3.1)                                                  |
| Gallery tables                                | `category.repository` and `project.repository` each own their gallery queries; `media.service` drives them through the owner service                                       | Respects table ownership (§3.4) and "no foreign repositories"                               |
| Result shapes                                 | Services return today's `{ ok, message }` / `{ error }` / `{ fieldErrors }`                                                                                                | No UI change now; task 06 moves to catalog codes                                            |
| Auth helper                                   | `requireAdmin()` kept (moved to `src/server/auth/session.js`)                                                                                                              | Task 05 replaces it with `requireAuth(permission)`                                          |
| `server-only`                                 | Every `src/server` file imports it, except `password.js` and `cloudinary.adapter.js` (scripts import them; they use `node:crypto`, which can never reach a browser bundle) | Next aliases `server-only`; plain Node scripts cannot load it                               |
| Lint enforcement                              | `no-restricted-imports` per file group in `eslint.config.mjs` (no new plugin)                                                                                              | Built into ESLint                                                                           |

## Steps

1. Move folders to `src/`, update `jsconfig.json`, scripts (`build-icons`, `check-content`, `create-admin`, `migrate-images`), ESLint ignores, unit-test import paths. Build + e2e.
2. Create `src/server/` base (`db.js`, `cache.js`, `request.js`, `config/env.js`, `auth/*`, `integrations/*`) and `src/shared/` (schemas, constants).
3. Build modules one by one: audit, rate-limits, industries, faqs, settings, categories, projects, client-logos, media, users, auth, enquiries, page-sections. Move admin page queries into services.
4. Delete `src/lib/{admin,actions,auth,data,db,security,email,validation,maintenance,cloudinary}`; repoint imports.
5. ESLint rules + unit tests (lint rule proof, shared schemas).
6. Update `docs/2-ARCHITECTURE.md` §5 paths. Run lint, unit, check:content, build, e2e, screenshots.
7. Tick task 04, commit.

## Risks

| Risk                                       | Fallback                                                                |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| `server-only` not resolvable in middleware | Keep the token file free of it and document the exception               |
| Cache keys / tags change → stale pages     | Same tags as today; e2e admin checks prove edits still show on the site |
| Circular imports (projects ↔ media)       | Only used inside functions, never at module load                        |
