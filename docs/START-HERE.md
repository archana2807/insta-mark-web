# START HERE — instructions for Claude Code

You are setting up the existing Insta Mark project for spec-driven work.
This folder (`insta-mark-kit/`) was dropped into the project root by the user.
Work in the order below. **Stop at every 🛑 and wait for the user's "OK" before continuing.**
Keep every message short and in simple English.

## Step 1 — Safety checks (no changes)
1. Run `git status` and `git branch --show-current`.
2. If there are uncommitted changes, stop and tell the user. Do not continue.
3. Tell the user you will create the branch `feature/01-kit-setup` from `main`.

🛑 Wait for OK. Then run:
```bash
git checkout main
git pull origin main
git checkout -b feature/01-kit-setup
```

## Step 2 — Put the kit files in place
Copy from `insta-mark-kit/` into the project root, keeping folders:
- `AGENTS.md` → `AGENTS.md`
- `.claude/settings.json` → `.claude/settings.json`
- `.claude/specs/.gitkeep` and `.claude/plans/.gitkeep`
- everything in `insta-mark-kit/docs/` → `docs/`

Rules:
- **Never overwrite an existing file.** If a target file already exists, do not copy it. List it and ask the user.
- Do not copy `README-FIRST.txt` or this file.
- Do not touch the project's existing `CLAUDE.md` in this step.

Then show the user a list: copied / skipped (already existed).

🛑 Wait for OK. Then tell the user to delete the `insta-mark-kit/` folder themselves
(you are not allowed to delete folders), and to restart Claude Code (`/exit`, then `claude`)
so the new `.claude/settings.json` safety rules load.

After the restart, the user will type: `Continue docs/START-HERE.md from Step 3.`
(This file was copied to `docs/START-HERE.md` together with the other docs.)

## Step 3 — Understand the project (no changes)
Read AGENTS.md, docs/STANDARDS.md, docs/spec-update-architecture.md and the whole codebase.
Do not change any code. Tell the user in 10 short lines how this project is built today,
and the 5 biggest differences from docs/spec-update-architecture.md.

🛑 Wait for OK or corrections.

## Step 4 — Rules files
Show each change before saving:
1. Rename `CLAUDE.md` to `docs/OLD-CLAUDE.md`. Create a new `CLAUDE.md` with this text:
   "@AGENTS.md — Always follow AGENTS.md and docs/STANDARDS.md. Work on one task from
   docs/TASKS.md at a time. Keep answers short and in simple English."
2. In `AGENTS.md`: put this project's real npm commands in the Commands block (single app,
   no `-w` flags). Under "Project-specific rules", add the 5 rules from
   docs/spec-update-architecture.md Part C. Add this line:
   "This is a single Next.js app with Bootstrap. Where docs/STANDARDS.md says monorepo,
   Express, Tailwind, shadcn or Redux, follow docs/2-ARCHITECTURE.md instead."
3. Make sure `.env` and `.env.production.local` are in `.gitignore`.
Do not change app code.

🛑 Wait for OK. Ask the user to test the lock by typing: `read .env.production.local`
(you must refuse).

## Step 5 — Fill the project docs (no code changes)
Read specs/requirements.md, specs/design.md, specs/current-state.md,
docs/spec-update-architecture.md and docs/OLD-CLAUDE.md. Fill, in short simple English:
- `docs/1-PROJECT.md`: users, features with "Done when" lines (keep the R-ids), pages,
  NOT to build (online payment, multi-language, blog, sliders, customer accounts).
- `docs/2-ARCHITECTURE.md`: single Next.js app, Bootstrap + Sass (premium theme), Prisma +
  Postgres, MVC module folders (spec-update §2.2–2.5), JWT login in an HttpOnly cookie with
  Admin/Editor roles, database tables, and the important rules from OLD-CLAUDE.md.
- `docs/3-INFRA.md`: Vercel + Neon, daily backup, cron, go-live checklist. One page only.
- `docs/TASKS.md`: only tasks 02–08 from docs/insta-mark-steps.md, each with "Done when" lines.
- Copy specs/design.md §3–§6 into `docs/DESIGN.md`, word for word.
Do not guess. List any conflicts or questions at the end.

🛑 Wait. The user reads 1-PROJECT.md and 2-ARCHITECTURE.md and answers your questions.
Update the docs with the answers.

## Step 6 — Finish task 01
Run `git add .` and `git commit -m "docs: adopt spec-driven kit"`.
Then tell the user to run these themselves (you cannot push):
```bash
git push origin feature/01-kit-setup
```
Then: open a Pull Request on GitHub → Merge →
```bash
git checkout main
git pull origin main
git branch -d feature/01-kit-setup
```
Finally, tell the user: "Setup done. For the next task, open docs/insta-mark-steps.md, Task 02."
