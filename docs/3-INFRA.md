# 3-INFRA.md — HOW we run it

## 1. Environments (decision D9)
| Env | URL | Database | Deployed when |
|---|---|---|---|
| Local | http://localhost:3000 | PGlite test DB on 127.0.0.1:5433 (never production) | — |
| Preview (= staging) | Vercel preview link per branch / PR | **None** — previews run on `/content` and never get a database (D14) | Every push to a branch |
| Production | https://insta-mark-web.vercel.app today → client domain at go-live | Neon production | Merge to `main` |

**Rule (D14):** in Vercel, `DATABASE_URL` and `DIRECT_URL` are set for **Production only**. Never add them to Preview or Development. Previews then show `/content` and cannot store enquiries (the form shows its "couldn't submit" message there) — that is expected and safe.

## 2. Hosting
- **Chosen:** Vercel (web, server actions, cron) + Neon PostgreSQL (Singapore). Vercel region `sin1`, close to Mumbai.
- **Why:** no servers to run; preview links for the client; Neon pooled connections fit serverless.
- **Today:** Vercel **Hobby** (not allowed for commercial use) → **Pro** before the public launch.
- Build command: `npm run build:vercel` (applies pending migrations, then builds).

## 3. Services
| Service | Provider | Notes |
|---|---|---|
| Database | Neon Postgres | `DATABASE_URL` = pooled (`pgbouncer=true`), `DIRECT_URL` = direct (migrations) |
| Images | Cloudinary | Signed direct uploads from admin; `next/image` serves them |
| Email | Resend | Needs a verified client domain |
| Spam check | Cloudflare Turnstile | Optional |
| Analytics | Google Analytics 4 | Optional |
| Domain + DNS | Client's domain (not connected yet) | Point to Vercel; HTTPS by Vercel |

## 4. Scheduled job (cron)
- `vercel.json`: `GET /api/cron/maintenance` daily at **20:30 UTC (02:00 IST)**, with `Authorization: Bearer $CRON_SECRET`.
- It retries failed sales emails and applies data retention (rate limits 1 day, SPAM 90 days, audit 1 year, anonymise enquiries after 3 years).

## 5. CI/CD
- **CI (task 02):** GitHub Actions (`.github/workflows/ci.yml`) on every push and PR: install → lint → `check:content` → unit tests → build + e2e against a throwaway PGlite database. No secrets in CI.
- **CD:** Vercel deploys previews on every push and production on merge to `main`. Rollback: "Promote" the previous deployment in Vercel.

## 6. Secrets
- Kept in Vercel env settings (and `.env.local` / `.env.production.local` on the developer machine, never committed). `.env.example` lists every variable with a fake value.
- Required: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET` (signs the admin JWT, 32+ chars), `CRON_SECRET`, `IP_HASH_SALT`, `NEXT_PUBLIC_SITE_URL`. Optional: Resend, Turnstile, GA4, Cloudinary keys.
- Enforced since task 06 by `src/server/config/env.js`: a Production deploy (`VERCEL_ENV=production`) without any required variable **fails to build**. Previews (no database, D14) need none of them. Check before deploying, without showing values: `node --env-file=.env.production.local scripts/check-env.js`.

## 7. Backups and recovery
- **Neon built-in restore (point-in-time):** Neon console → the project → **Settings → Instant restore / History retention**. Set the longest history the plan allows. To recover: **Restore** the branch to a time, or create a branch from a past time and point `DATABASE_URL` / `DIRECT_URL` at it.
- **Daily backup (D15):** `.github/workflows/backup.yml`, every night at **21:30 UTC (03:00 IST)**, after the maintenance cron, and on demand (**Actions → Database backup → Run workflow**).
  1. `pg_dump` (PostgreSQL 16 client, custom format) from the Neon **direct** URL.
  2. **Restore test on every run:** the dump is decrypted and restored into a throwaway Postgres 16 in the same job. Every table's row count is checked. The job fails if anything is missing.
  3. The dump is encrypted (gpg, AES-256) and kept as an artifact for **30 days**. It contains personal data, so it is encrypted even though the repo is private.
  4. The job summary shows table names and row counts only, never URLs or data.
- **Setup (once, by the repo owner):** GitHub → **Settings → Secrets and variables → Actions → New repository secret**:
  - `NEON_DIRECT_URL`: the Neon direct (not pooled) connection string. A read-only Neon role is enough and safer.
  - `BACKUP_PASSPHRASE`: a long random string. **Also store it in the team password manager**; without it the dumps cannot be opened.

  Then run the workflow once by hand and check it is green.
- **Restore a backup (runbook):**
  1. Actions → the run → download `database-backup-<id>`; unzip.
  2. `gpg --decrypt --output db.dump insta-mark-<date>.dump.gpg` (asks for `BACKUP_PASSPHRASE`).
  3. In Neon create a new branch (or an empty database) and copy its direct URL.
  4. `pg_restore --no-owner --no-privileges --exit-on-error -d "<that direct URL>" db.dump`
  5. Check the admin panel against it on a preview, then switch Vercel's `DATABASE_URL` / `DIRECT_URL` (Production) if this is a real recovery.
- **CI:** the same scripts run on every push and PR (`backup-rehearsal` job in `ci.yml`) against throwaway Docker databases with test data, so a broken backup script is caught before it reaches `main`.

**Restore tests**

| Date | What | Result |
|---|---|---|
| 21 Oct 2026 | Local rehearsal (`bash scripts/backup/rehearse-local.sh`): test data in Postgres 16 → dump → encrypt → decrypt → restore into an empty database | ✅ 16 tables, all row counts match; a wrong passphrase is refused |
| _(first green run)_ | Production: first run of `backup.yml` after the secrets are set (restore into a throwaway database in the job) | ⏳ needs the two secrets |
| _(before go-live)_ | Production: restore one artifact into a **Neon branch** with the runbook above | ⏳ |

## 8. Monitoring (D6)
- **Logs:** pino JSON lines on stdout (`src/server/logger.js`), read in Vercel → Logs. Level: `LOG_LEVEL` (default `info`). Passwords, tokens, cookies, emails, phones and credentials in error messages are redacted. Server code cannot use `console.*` (ESLint).
- **Errors:** Sentry (`@sentry/nextjs`), **on only when the DSNs are set**:
  - in Vercel (Production): `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` (the same DSN);
  - optionally `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` for readable stack traces (source maps).

  It reports unexpected server errors, request errors and browser errors. It does not report expected errors (wrong password, validation…), personal data, session replays or performance traces. The browser SDK loads only when a DSN is set, after the page is idle, so it never slows the first paint.
- **Sentry setup (once):** create a free Sentry account → new project, platform **Next.js** → copy the DSN into the Vercel variables above → in Sentry, set an alert rule "a new issue is created → email the team".
- **Uptime:** a free uptime monitor (e.g. UptimeRobot or Better Stack) on the home page URL and `/robots.txt`, every 5 minutes, alerts to the team email.

## 9. Go-live checklist (task 08)
- [ ] Vercel **Pro** plan
- [ ] Client domain connected, HTTPS on, `NEXT_PUBLIC_SITE_URL` updated
- [ ] **Rotate every secret shared in chat:** Vercel token, Neon password, admin password; new JWT secret (logs everyone out once)
- [ ] Resend domain verified; test enquiry → sales email + auto-reply
- [ ] Turnstile, GA4 and Cloudinary keys set and tested
- [ ] Daily backup running and one restore tested — workflow + restore test ready; needs the two GitHub secrets, one green run, and one restore into a Neon branch (§7)
- [ ] Sentry and uptime alerts on — code ready (off until DSNs are set); needs a Sentry project + DSN in Vercel and an uptime monitor (§8)
- [ ] Privacy policy approved by the client
- [ ] Client facts confirmed (contact details, founding year); test data removed
- [ ] **Footer sample data replaced:** the footer shows fake sample contact details and social links (`footerPlaceholders` in `content/site.js`) until the real ones are entered in Admin → Settings; enter all of them, then delete the placeholders
- [ ] **Contact office sample data replaced:** the Contact page shows three sample offices (`officePlaceholders` in `content/site.js`; the head office switches to the real address, email and phone from Admin → Settings once set); replace them with the client's real offices or remove the extra columns
- [ ] **Home counter sample numbers replaced:** Projects Delivered (500+), Years of Experience (9+) and Locations Covered (25+) on the home page are sample numbers (`statsPlaceholders` in `content/site.js`); replace them with the client's confirmed figures
- [ ] Lighthouse mobile ≥ 90 and LCP ≤ 2.5 s on production; axe 0 violations; no sideways scroll at 390 px

