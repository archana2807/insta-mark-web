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
- **Daily backup (task 08, D15):** Neon's built-in restore, plus a nightly GitHub Actions job that runs `pg_dump` against `DIRECT_URL` and saves it as an artifact (private repo, kept 30 days).
- **Restore test:** restore one dump into a Neon branch before go-live and record the date here.

## 8. Monitoring (go-live, task 08)
- Errors: Sentry (decision D6). Logs: pino JSON in Vercel logs.
- Uptime: a free uptime monitor on the home page, alerts to the team email.

## 9. Go-live checklist (task 08)
- [ ] Vercel **Pro** plan
- [ ] Client domain connected, HTTPS on, `NEXT_PUBLIC_SITE_URL` updated
- [ ] **Rotate every secret shared in chat:** Vercel token, Neon password, admin password; new JWT secret (logs everyone out once)
- [ ] Resend domain verified; test enquiry → sales email + auto-reply
- [ ] Turnstile, GA4 and Cloudinary keys set and tested
- [ ] Daily backup running and one restore tested
- [ ] Sentry and uptime alerts on
- [ ] Privacy policy approved by the client
- [ ] Client facts confirmed (contact details, founding year); test data removed
- [ ] Lighthouse mobile ≥ 90 and LCP ≤ 2.5 s on production; axe 0 violations; no sideways scroll at 390 px

