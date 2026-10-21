# Plan — Task 02 `02-tests-ci`

Spec: `.claude/specs/02-tests-ci.md`. No visual or behaviour change allowed.

## 0. Findings (what this task touches, and root causes)

| # | Finding | Evidence | Consequence for the plan |
|---|---|---|---|
| F1 | **The old test suites are gone from disk.** The temporary folder that held `form-e2e.mjs`, `admin-e2e.mjs` (43 checks), `qa.mjs`, `overflow.mjs`, `reset-e2e.sh` was cleared. | `ls` of the old scratchpad: only `tasks/` left | Rebuild them from their source, which is still in the earlier session log (`~/.claude/projects/…/a271b332-….jsonl`, the original `Write` calls + later edits). Where a part can't be recovered exactly, rewrite it to the same checks. |
| F2 | **Root cause of the 13 Oct incident:** `next build` and `next start` load `.env.production.local` (live Neon URL + live keys). The shell-sourced test env broke on `&`, so `DATABASE_URL` was never set and the file's live value won. | Verified today: `@next/env` only fills a variable when it is **undefined**; a variable set to `""` is kept (`{"FOO":""}` test) | **Seal the env:** the runner sets *every* variable from `.env.example` itself (test values or `""`) before starting any child process. No `.env*` file can then inject a live URL or key. Plus a hard guard on `DATABASE_URL`. |
| F3 | ESLint is not installed, so `next build` skips linting today. Once a config exists, `next build` **also lints** and fails on errors. | Build log: "Linting and checking validity of types" with no ESLint | Lint fixes must land in this task, or the build breaks. Fixes must not change output. |
| F4 | The old suites interfere with each other on one DB: login rate limit (10/10 min per IP) and the enquiry limit (5/10 min) are hit across suites; form and admin both used company "Acme Infra" while admin asserts a search returns exactly 1 row. | 13–14 Oct runs: QA login timed out after the admin suite; counts | Reset `rate_limits` before each spec file; unique test data per spec (`E2E-Form-…`, `E2E-Admin-…`). |
| F5 | PGlite (socket server) died twice after long runs. | 14 Oct runs | Start a **fresh** PGlite per run; Prisma `connection_limit=1`; `-m 4`; a health check before each spec file with a clear error. Fallback in §6. |
| F6 | Axe flagged contrast on elements mid fade-in (false positives), because the crawl ran axe right after load. | 14 Oct: 13 pages flagged, 0 after scrolling | Run the a11y crawl with `reducedMotion: 'reduce'` (our motion turns off), so it measures the final state. Overflow runs with motion **on** (drift can cause overflow). |
| F7 | `.claude/settings.json` denies `Read(./.env.*)`, which also matches `.env.example`. | settings file | Replace it with explicit patterns for real env files only. |
| F8 | Vercel `DATABASE_URL` is set for Production only (user, 21 Oct). Previews therefore use `/content` and can't store enquiries (they show the "couldn't submit" message in production mode). | User | That is acceptable and safe. Document it; no Neon branch. |

## 1. Options debated

| Topic | Options | Choice | Why |
|---|---|---|---|
| Test runner | (a) keep ad-hoc Node scripts using the `playwright` library · (b) `@playwright/test` | **(b)** | Standard runner: ordered spec files, retries, traces, HTML report, CI annotations; the kit expects named tests per "Done when". |
| Test DB | (a) PGlite socket server · (b) Docker Postgres · (c) Neon branch | **(a)** | AGENTS rule 3 says PGlite on 127.0.0.1:5433; no Docker on this machine; a Neon branch would put test data in the cloud and need secrets in CI. Proven with migrations, the seed and all suites on 13–14 Oct. |
| Env safety | (a) shell env file · (b) Node runner that **seals** the env + guard · (c) build in a copy of the repo without env files | **(b)** | (a) caused the incident. (c) is slow and fragile. (b) is simple, cross-platform (Windows + Linux CI) and testable. Guard runs twice: in the runner and in Playwright `globalSetup`. |
| Unit tests | (a) Vitest (STANDARDS default) · (b) Node built-in `node --test` | **(b)** for now | No new package (lean, D7); our first unit tests are pure functions. Vitest can come with task 04 if mocking is needed. |
| ESLint | (a) `next lint` (deprecated in 15.5) · (b) ESLint 9 flat config + `eslint-config-next` via `FlatCompat` | **(b)** | Future-proof. `eslint-config-next@15.5.27` requires ESLint ≤ 9, so pin **ESLint 9.39.5** (not 10). |
| Axe | (a) inject `axe-core` by hand · (b) `@axe-core/playwright` | **(b)** | Official Deque wrapper; handles injection. Needs `bypassCSP: true` in that context (our CSP blocks inline injection), as before. |
| Suite isolation | (a) one PGlite + full reset per spec file · (b) one DB per run + targeted resets | **(b)** with ordered files | A full reset takes ~20 s per file; targeted resets (rate limits, unlock users) are enough with unique test data. Order: crawl (pristine) → overflow → form → admin (mutates content last). |

## 2. Packages to add (devDependencies; **needs your OK** per AGENTS.md)
| Package | Version | Why | Maintainer |
|---|---|---|---|
| `@playwright/test` | 1.64.1 | e2e runner | Microsoft |
| `@axe-core/playwright` | 4.14.0 | accessibility checks | Deque |
| `@electric-sql/pglite` + `@electric-sql/pglite-socket` | 0.5.10 / 0.2.13 | in-process Postgres test DB on 127.0.0.1:5433 | ElectricSQL |
| `eslint` | 9.39.5 | lint (pinned to 9 for `eslint-config-next`) | OpenJS / ESLint |
| `eslint-config-next` | 15.5.27 | Next.js rules (`core-web-vitals`), matches our Next version | Vercel |
| `@eslint/eslintrc` | 3.3.7 | `FlatCompat` to load the Next config in flat format | ESLint |

All are dev-only; nothing ships to visitors.

## 3. Files
**New**
- `tests/e2e/run.js`: the one entry point. Seal env → guard → start PGlite → reset DB → build (skipped with `--no-build`) → `playwright test` → stop PGlite. Exit code = test result.
- `tests/e2e/env.js`: `sealTestEnv()` (every key from `.env.example`, test values or `""`) and `assertTestDatabase(url)` (host must be `127.0.0.1`, port `5433`).
- `tests/e2e/db.js`:
  - `resetDatabase()`: drop schema, `prisma migrate deploy`, `db:seed`, 3 test users (admin / editor / lock) and 1 fixture project.
  - `resetRateLimits()` and `unlockUsers()` for between spec files.
- `tests/e2e/global-setup.js`: re-checks the guard; checks PGlite answers.
- `playwright.config.js`:
  - Chromium only, `workers: 1`, ordered files, base URL `http://localhost:3100`.
  - `webServer`: `next start -p 3100` with the sealed env.
  - Local browser fallback via `PLAYWRIGHT_CHROMIUM_EXECUTABLE` (browser downloads failed on this network before).
- `tests/e2e/crawl.spec.js`: all public pages + 404; links, SEO (title, description, canonical, one H1, JSON-LD), axe WCAG 2.1 AA with reduced motion; admin pages axe after login.
- `tests/e2e/overflow.spec.js`: 7 pages at 390 px, motion on, scrolled through; `scrollWidth ≤ 390`, no console errors.
- `tests/e2e/form.spec.js`: the 16 checks, the no-JS server path, the stored row (sanitised company, E.164 phone, UTM).
- `tests/e2e/admin.spec.js`: the 43 checks (auth, lockout, cookie flags, open redirect, forged cookie, roles, enquiries + CSV, content edits visible on the site, projects, FAQ → Contact page, settings, users, audit, session invalidation).
- `tests/e2e/env-guard.spec.js` *(or a unit test)*: a fake `.env.production.local` with a dummy live URL and keys is ignored (Done when 3).
- `tests/unit/enquiry-rules.test.js`: the rule checks run by hand on 13 Oct (names, emails, typo suggestions, phones, links, sanitising).
- `tests/unit/test-env.test.js`: `assertTestDatabase` accepts only 127.0.0.1:5433; `sealTestEnv` blanks every live key.
- `eslint.config.mjs`: `next/core-web-vitals`; ignores `.next/`, generated icon files, `node_modules/`.
- `.github/workflows/ci.yml`:
  - Ubuntu, Node 20 (`.nvmrc`), `npm ci`;
  - `npm run lint`, `npm run check:content`, `npm test`;
  - `npx playwright install --with-deps chromium`, `npm run test:e2e`;
  - upload the HTML report when it fails;
  - cache the npm and Playwright browser downloads.

**Changed**
- `package.json`: devDependencies (§2); scripts `lint`, `test` (`node --test tests/unit`), `test:e2e` (`node tests/e2e/run.js`), `test:e2e:fast` (`--no-build`).
- `.gitignore`: `test-results/`, `playwright-report/`, `.pglite/`.
- `.claude/settings.json`:
  - Replace `Read(./.env.*)` and `Read(./**/.env.*)` with `Read(./.env)`, `Read(./.env.local)`, `Read(./.env.*.local)`, `Read(./.env.production)`, `Read(./.env.development)` and `Read(./.env.test)`.
  - Add the same patterns under `./**/`.
  - `.env.example` is no longer matched.
- App files with lint findings: minimal fixes only, no output change. Unknown until the first lint run; reported as a list.
- Docs:
  - `docs/3-INFRA.md`: §1 Preview row + new rule "Vercel `DATABASE_URL` / `DIRECT_URL` = Production only; previews never get a database".
  - `docs/TASKS.md`: replace the Neon-branch line in task 02 with that rule.
  - `docs/2-ARCHITECTURE.md` D14: "Previews have no database" (you approved this change on 21 Oct).
  - `AGENTS.md`: add `npm run lint`, `npm test`, `npm run test:e2e` to the commands block.

## 4. Steps (each ends with proof)
1. **Baseline screenshots** on the current code (before any change): Home, About, Solutions, `/solutions/tailor-made-signage`, Projects, Contact at 1440 and 390 px, reduced motion. Saved in the temporary folder, not committed. Proof: file list.
2. **Install packages** (after your OK), `npm install`. Proof: `npm ls` for each.
3. **Env sealing + guard + unit tests** (`env.js`, unit tests). Proof:
   - `npm test` output;
   - `DATABASE_URL=postgres://x@example.com/db npm run test:e2e` exits before anything starts.
4. **PGlite + reset** (`db.js`, `run.js` skeleton). Proof: migrations applied, seed counts (8 categories, 78 photos, 12 industries, 5 FAQs, 3 users, 1 project).
5. **Recover and port the suites**, one file at a time: crawl → overflow → form → admin. Proof per file: Playwright pass count (16, 43, crawl summary, 7 pages).
6. **ESLint**: add the config, run, fix findings in small commits. Proof:
   - `npm run lint` 0/0;
   - `npm run build` clean;
   - full e2e green again.
7. **Visual check**: rebuild and compare the screenshots from step 1. Proof: pixel diff 0 (or only antialiasing, shown).
8. **CI workflow**: push needs you. Proof: green run link on the PR.
9. **settings.json + docs** edits. Proof: diff; after a restart, `.env.example` readable and `.env.production.local` refused.
10. **Final table:** every "Done when" line, pass/fail, proof. Tick task 02 in `docs/TASKS.md`.

## 5. Tests mapped to "Done when"
| Done when | Test / proof |
|---|---|
| 1 suites pass | `npm run test:e2e` → form 16, admin 43, crawl, overflow |
| 2 guard | `tests/unit/test-env.test.js` + manual wrong-URL run |
| 3 sealed env | `env-guard` test with a fake `.env.production.local` in a temp dir |
| 4 live DB untouched | You check the live Enquiries count before and after |
| 5 unit | `npm test` |
| 6 lint | `npm run lint` output |
| 7 build + same look | build log + screenshot diff |
| 8 CI | GitHub Actions run on the PR |
| 9 settings | restart, then try reading `.env.example` (allowed) and `.env.production.local` (refused) |
| 10 docs | diff of `3-INFRA.md`, `TASKS.md`, `2-ARCHITECTURE.md` |

## 6. Risks and fallbacks
| Risk | Likelihood | Fallback |
|---|---|---|
| Many lint findings (react-hooks, jsx-a11y, `<img>` in admin) | Medium | Fix the real ones; for a rule that conflicts with a project decision, ask before configuring it off (never switch off to pass) |
| PGlite crashes mid-run | Medium | Health check gives a clear error; runner restarts PGlite once and re-runs the failed file. If still flaky in CI, ask to use a Postgres service container on 127.0.0.1:5433 in CI only |
| Playwright browser download fails locally | High (happened before) | `PLAYWRIGHT_CHROMIUM_EXECUTABLE` → the existing `chromium-1243`; CI downloads its own |
| Old suite source not fully recoverable from the log | Low–medium | Rewrite the missing checks to the same list (names kept) and say which ones were rewritten |
| Time-trap (2.5 s) and drift tests slow or flaky | Medium | Explicit waits only where the product needs them; retries 1 in CI with trace on first retry |
| CI time | Low | ~6–8 min; cache npm + browsers |
| Task 01 not merged yet | — | See note below |

## Note on branches
Task 01 (`feature/01-kit-setup`, commit `11f7104`) is **not on GitHub yet**: `origin` has only `main`. This spec, this plan and the task-01 tick are untracked/uncommitted on that branch. Suggested order:
1. Commit the tick to task 01.
2. You push and merge it.
3. Then: `git checkout main`, `git pull`, `git checkout -b feature/02-tests-ci`.

The `.claude/` files carry over to the new branch.
