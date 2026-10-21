# Spec — Task 02 `02-tests-ci`

## Why
- Tasks 03–08 change and move a lot of code. We need tests that prove nothing breaks **before** we touch it (spec-update §8, step 1).
- The browser test suites we used until 14 Oct lived only in a temporary folder, which has since been deleted. Nobody else and no CI can run them.
- On 13 Oct, local test runs wrote 5 test enquiries to the **live** database. Root cause: `next start` / `next build` read `.env.production.local` (the live Neon URL), and the test URL was not really set. There is still no code-level guard.
- No lint and no CI exist, so mistakes reach `main` unnoticed.
- `.claude/settings.json` blocks reading `.env.example`, which is a safe, committed file the agent needs (it lists all variables).

## What changes
1. **Tests in the repo** (`tests/`), runnable with one command:
   - e2e (Playwright): enquiry form, admin panel, a11y + links + SEO crawl, 390 px overflow (rebuilt from the old suites).
   - unit (Node's built-in test runner, no new package): enquiry validation rules.
2. **Test database that can never be the live one:**
   - The runner starts PGlite on `127.0.0.1:5433`, migrates and seeds it.
   - It **refuses to run** unless `DATABASE_URL` points there.
   - It sets every variable from `.env.example` itself, so no `.env*` file can add a real key (live DB, Resend, Cloudinary…).
3. **ESLint** (`eslint.config.mjs`, `next/core-web-vitals`) and `npm run lint`. Lint findings are fixed without changing behaviour or looks.
4. **GitHub Action** on every push and PR: install → lint → `check:content` → unit → build → e2e.
5. **`.claude/settings.json`:** block only real env files (`.env`, `.env.local`, `.env.*.local`, `.env.production`, `.env.development`, `.env.test`), not `.env.example`.
6. **Docs:**
   - `docs/3-INFRA.md` rule: Vercel `DATABASE_URL` / `DIRECT_URL` are set for **Production only**; previews never get a database.
   - `docs/TASKS.md` (task 02 lines) and `docs/2-ARCHITECTURE.md` (D14) updated to say the same; no Neon preview branch.
   - `AGENTS.md` commands block gets `npm run lint`, `npm test` and `npm run test:e2e`.

## Done when
1. `npm run test:e2e` runs all e2e suites against PGlite on 127.0.0.1:5433 and passes: form 16/16, admin 42/42 (the recovered suite has 42 named checks; "43" on 14 Oct was a miscount), crawl (0 broken links, 0 SEO issues, axe 0 violations), overflow 0 pages at 390 px.
2. With `DATABASE_URL` pointing anywhere other than `127.0.0.1:5433`, `npm run test:e2e` exits with an error **before** building, migrating or starting anything.
3. With a fake "live" `.env.production.local` present (dummy URL and dummy keys), a test run still uses only the test DB and blank integrations. A test proves it.
4. During a full local run, the live enquiry count does not change. The **user** checks it in the live admin (Enquiries) before and after; the agent never reads live credentials.
5. `npm test` runs the unit tests and they pass.
6. `npm run lint` passes with 0 errors and 0 warnings, with no rules switched off to make it pass.
7. `npm run build` still passes with no warnings, and the site looks the same: screenshots of Home, About, Solutions, one category page, Projects and Contact at desktop and 390 px match before/after.
8. The GitHub Action runs on push and PR and is green on this branch.
9. `.claude/settings.json` lets the agent read `.env.example` but still refuses `.env`, `.env.local` and `.env.production.local`. Checked after a restart.
10. `docs/3-INFRA.md` has the rule "Vercel `DATABASE_URL` / `DIRECT_URL` = Production only; previews never get a database", and TASKS 02 / D14 no longer mention a Neon preview branch.

## NOT in this task
- No Neon preview branch (decision of 21 Oct). No change in Vercel settings.
- No Husky, lint-staged, commitlint or `checkJs` (D4, D7). No Vitest.
- No refactor into modules (task 04), no error catalog / env validation in the app (task 06), no pino or Sentry (task 08).
- No visual or behaviour changes to the website or admin. Lint fixes must not change output.
- No Firefox / WebKit runs (Chromium only, as before).
