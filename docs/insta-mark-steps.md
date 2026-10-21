# Insta Mark — simple steps (short version)

This is the only file you need to follow. It has 8 tasks, in order. For every task:
1. type the **terminal** commands,
2. paste the **Claude** commands one at a time,
3. stop at each 🛑 and check the work yourself.

---

## Before task 01: put the files in place (once)

Unzip `insta-mark-kit.zip`. Copy **everything inside** the `insta-mark-kit` folder into the
project's main folder (the one with `package.json`), including the hidden `.claude` folder.
Merge folders if asked; nothing should be replaced. Full details are in `README-FIRST.txt`.

---

## The same cycle for every task

**Terminal** (replace `NN-name` with the task name, e.g. `01-kit-setup`):
```bash
git checkout main
git pull origin main
git checkout -b feature/NN-name
claude
```

In Claude, type `/rename NN-name`. Then paste the task's commands from below.

**When the task is done, in the terminal:**
```bash
git add .
git commit -m "NN-name"
git push origin feature/NN-name
```
On GitHub: open a Pull Request, then click Merge. Then:
```bash
git checkout main
git pull origin main
git branch -d feature/NN-name
```

---

## Task 01 — `01-kit-setup` (docs and rules only, no code)

**Claude command 1**
```text
Read AGENTS.md, docs/STANDARDS.md, docs/spec-update-architecture.md and the whole codebase.
Do not change any code. Tell me in 10 short lines how this project is built today.
```
🛑 If it says something wrong about the project, correct it.

**Claude command 2**
```text
Do only this, and show me each change before saving:
1. Rename CLAUDE.md to docs/OLD-CLAUDE.md. Make a new CLAUDE.md with this text:
   "@AGENTS.md — Always follow AGENTS.md and docs/STANDARDS.md. Work on one task from
   docs/TASKS.md at a time. Keep answers short and in simple English."
2. In AGENTS.md: put this project's real npm commands in the Commands block. Add the 5 rules
   from docs/spec-update-architecture.md Part C under "Project-specific rules". Add this line:
   "This is a single Next.js app with Bootstrap. Where docs/STANDARDS.md says monorepo,
   Express, Tailwind, shadcn or Redux, follow docs/2-ARCHITECTURE.md instead."
3. Make sure .env and .env.production.local are in .gitignore.
```
🛑 Test the safety lock: ask Claude `read .env.production.local`. It must refuse.

**Claude command 3**
```text
Read specs/requirements.md, specs/design.md, specs/current-state.md,
docs/spec-update-architecture.md and docs/OLD-CLAUDE.md. Do not change any code.
Fill, in short simple English:
- docs/1-PROJECT.md: users, features with "Done when" lines (keep the R-ids), pages,
  NOT to build (online payment, multi-language, blog, sliders, customer accounts).
- docs/2-ARCHITECTURE.md: single Next.js app, Bootstrap + Sass (premium theme), Prisma +
  Postgres, MVC module folders (spec-update §2.2–2.5), JWT login in HttpOnly cookie with
  Admin/Editor roles, database tables, and the important rules from OLD-CLAUDE.md.
- docs/3-INFRA.md: Vercel + Neon, daily backup, cron, go-live checklist. One page only.
- docs/TASKS.md: only tasks 02–08 from docs/insta-mark-steps.md, each with "Done when" lines.
Keep the theme design notes from design.md §3–§6 in docs/DESIGN.md, word for word.
Do not guess. List any conflicts or questions at the end.
```
🛑 Read 1-PROJECT.md and 2-ARCHITECTURE.md carefully. Send me the questions if you are unsure.
Then commit and merge (see "When the task is done").

---

## Tasks 02–08 — the same 2 commands each

**Claude command A: spec + plan** (press **Shift+Tab** first for plan mode)
```text
Read AGENTS.md, docs/2-ARCHITECTURE.md and task [NN] in docs/TASKS.md.
1. Write a short spec: why, what changes, "Done when" lines, what is NOT in this task.
   Save it to .claude/specs/NN-name.md.
2. Act as a senior software architect and senior UI/UX designer. Look at the code this task
   touches, find the root cause where needed, do deep research for the best approach, debate
   the options, and make a plan: files, steps, tests, risks. Save it to .claude/plans/NN-name.md.
Do not write code. Wait for my OK.
```
🛑 Read the spec and the plan. Approve them, or say what to change.

**Claude command B: build + check**
```text
Build .claude/plans/NN-name.md step by step. Test in the test environment only (never the live
database) and repeat until everything passes. Give proof at each step. Make sure no other
feature or design breaks, with no domino effect.
At the end, check every "Done when" line in .claude/specs/NN-name.md and show a table:
line, pass/fail, proof. Then tick the task in docs/TASKS.md.
```
🛑 Accept or reject each edit. When it finishes, open the website yourself on desktop and at
phone width. If something is wrong: `Fix the failing lines, then check again.`

### What each task is

| # | Name | What it does | Website looks different? |
|---|---|---|---|
| 02 | `02-tests-ci` | Put the existing Playwright tests in the repo; a test database that can never touch live data; ESLint; GitHub check on every push | No |
| 03 | `03-quick-client-fixes` | Remove the banner side label; hide the "10+ years" badge; correct the About "Why Choose Us" list; make the category cover work | **Yes**: show the client |
| 04 | `04-mvc-structure` | Move code into module folders (controller / service / repository). Enquiries first, then the rest. Behaviour stays the same | No |
| 05 | `05-jwt-login-roles` | JWT login in an HttpOnly cookie (8 hours); Admin/Editor permissions checked on every admin action; logout | No (admins log in once again) |
| 06 | `06-errors-env` | One clear error system with friendly messages; the app checks its settings at start-up; loading and error screens in admin | No |
| 07 | `07-client-changes` | Banner upload (desktop + mobile), home page order, quote, FAQs, auto-reply email. **Split into 2–3 smaller tasks if large** | **Yes** |
| 08 | `08-go-live` | Vercel Pro, domain, backup, change every password and key shared in chat, final check | — |

> **Note for 04:** if Claude says it is too big, split it: `04a-mvc-enquiries`, `04b-mvc-content`, `04c-mvc-admin`.

---

## Your 4 control points on every task
1. Approve the spec and the plan
2. Approve each code edit
3. Open the website yourself and check it
4. Merge on GitHub (Claude cannot push or merge)
