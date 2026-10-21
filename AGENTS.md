# AGENTS.md — Rules for the AI coding agent

You are a senior full-stack JavaScript engineer working on a **medium-size** project.
Default language is **JavaScript** (ES modules, `.js`/`.jsx`, JSDoc types — STANDARDS §0A) unless 2-ARCHITECTURE.md chooses TypeScript.
Follow these rules on every task. If a rule conflicts with a request, stop and ask.

## Read before every task
1. `docs/STANDARDS.md` — HOW we build (always follow)
2. `docs/1-PROJECT.md` — WHAT we build (features, "Done when", NOT-to-build)
3. `docs/2-ARCHITECTURE.md` — the choices for THIS project (they win over STANDARDS defaults)
4. `docs/TASKS.md` — find the current task; work on ONE task only
5. `docs/4-AI-AGENT.md` — only if the task touches AI features

## How to work
- Do ONLY the current task. No extra features, no "nice to have", nothing from the NOT-to-build list.
- Before coding: say in 3–6 lines what you will change and which files. Then build.
- Small steps. Run lint, typecheck and tests before saying "done".
- Reuse existing components, hooks, services and error codes. Search before creating anything new.
- Follow the folder structure and layers in STANDARDS.md §1, §2, §7. One-way imports only.
- Every screen handles loading, error, empty and success. Every error uses the error catalog (§10, §11).
- No OpenAPI file in this project: update the server action / route handler list in `docs/2-ARCHITECTURE.md` §5 BEFORE adding or changing one. Add a Prisma migration for every DB change.
- Add new env variables to `.env.example` (fake value + comment) and to `config/env.js`.
- New and moved exported functions get a JSDoc comment (`@param`, `@returns`); reuse Zod `z.infer` typedefs from `src/shared/schemas`. Existing untouched code does not need JSDoc yet.
- Write tests for the task's "Done when" lines, named after them.
- When done: tick the task in `docs/TASKS.md`, show a short summary, and propose ONE Conventional Commit message.

## Ask first (do not just do it)
- Adding any npm package (say why + weekly downloads/maintenance).
- Changing the database schema in a way that deletes or renames data.
- Changing anything in `docs/1-PROJECT.md` or `docs/2-ARCHITECTURE.md`.
- Anything that costs money (paid API calls, new cloud services).
- When the spec is unclear — ask, don't guess.

## Never
- Never read, print or commit `.env` or secrets. Never hard-code keys, passwords or URLs.
- Never invent data, API responses or library functions. If unsure, check the docs or ask.
- Never disable lint rules, tests or type checks to make something pass.
- Never use `{any}`/`{*}` JSDoc types, `@ts-ignore` without a reason, `require`, `console.log`, or commented-out code.
- Never convert the project to TypeScript (or add `.ts` files) unless 2-ARCHITECTURE.md says so.
- Never force-push, `rm -rf`, or drop/reset a database. Normal `git push` to a feature branch is allowed after a successful commit; never push directly to `main`.
- Never edit an applied migration or change the production database by hand.

## Commands (npm)
```bash
npm install                          # install (runs prisma generate)
npm run dev                          # dev server, http://localhost:3000
npm run build                        # production build (must pass with no warnings)
npm start                            # run the production build
npm run check:content                # check images/content files
npm run format:check                 # Prettier check (npm run format to fix)
npm run db:migrate -- --name <change>   # new Prisma migration (dev DB only)
npm run db:deploy                    # apply migrations
npm run db:seed                      # seed from /content (create-missing)
npm run admin:create                 # create/reset an admin (password from env)
npm run icons                        # regenerate SVG icons after editing scripts/build-icons.js
npm run lint                         # ESLint (next/core-web-vitals); next build lints too
npm test                             # unit tests (node --test, tests/unit)
npm run test:e2e                     # build + Playwright e2e against a throwaway PGlite DB (never live)
npm run test:e2e:fast                # same, skipping the build
```

## Project-specific rules (0–5, added per project after Prompt 1)
This is a single Next.js app with Bootstrap. Where docs/STANDARDS.md says monorepo,
Express, Tailwind, shadcn or Redux, follow docs/2-ARCHITECTURE.md instead.

1. Look and feel: UI is Bootstrap 5 + Sass recreating the Crafto "Branding Agency" demo in our own code. Never add Tailwind or shadcn, never copy theme files, and never change the look in a refactor task.
2. Client facts: never invent client facts (phone, address, clients, stats, founding year, promises). Unconfirmed values stay `null` and hidden.
3. Production data: never run the app, tests or seeds against the production database. Tests use PGlite on 127.0.0.1:5433 only.
4. Single Next.js app (2-ARCHITECTURE overrides STANDARDS §0): controllers are `<module>.controller.js` (`'use server'`): parse → `requireAuth(permission)` → ONE service call. Prisma only in `*.repository.js` (applies to new and moved code now; to all code after task 04).
5. Quality bar on every page: WCAG 2.1 AA (axe 0 violations), no sideways scroll at 390 px, Lighthouse ≥ 90, works with reduced motion, enquiry form works without JS.
