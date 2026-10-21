# Spec — Task 08 `08-go-live` (prep: everything that needs no client input)

Website looks different: **no**.

## Why

Soft launch: the technical base (logs, error alerts, backups, restore) must be ready before real traffic. The client's content can follow through the admin panel.

## In this part

### Logs: pino (D6)

- `src/server/logger.js` is the only logger for server code: JSON lines on stdout (Vercel logs), level from `LOG_LEVEL` (default `info`), secrets and personal data redacted (`password`, `passwordHash`, `token`, cookies, `authorization`, `email`, `phone`).
- Every `console.*` in `src/server`, `src/app` and `src/middleware.js` moves to the logger. ESLint `no-console` (error) keeps it that way; browser code is unchanged.

### Errors: Sentry (D6)

- `@sentry/nextjs`, **on only when a DSN is set**:

  - `SENTRY_DSN` for the server and edge runtimes,
  - `NEXT_PUBLIC_SENTRY_DSN` for the browser.

  Without them, nothing is sent and nothing changes.

- Captured:

  - unexpected server errors from controllers (`attempt()`),
  - request errors (`onRequestError`),
  - admin error-screen errors,
  - browser errors.

  Expected errors (catalog codes) are not sent.

- Privacy: `sendDefaultPii: false`; no session replay; request bodies and cookies are not sent.
- Source maps upload only when `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and `SENTRY_PROJECT` are set (Vercel build); otherwise the build is unchanged.
- CSP allows the browser to report to Sentry's ingest host only when the browser DSN is set.

### Backups (D15)

- `.github/workflows/backup.yml` runs **daily at 21:30 UTC (03:00 IST)** and on demand. It:
  1. dumps the production database with `pg_dump` (PostgreSQL 16 client, custom format) from the `NEON_DIRECT_URL` repository secret;
  2. **restores the dump into a throwaway Postgres 16** in the same job and checks that all tables and their row counts match (an automatic restore test on every run);
  3. encrypts the dump (AES-256, `BACKUP_PASSPHRASE` secret) and uploads it as an artifact kept **30 days**.
- The job fails clearly if the secrets are missing, and never prints the URL or any data.
- Scripts in `scripts/backup/` (`dump.sh`, `verify-restore.sh`) are shared by the workflow and the local rehearsal.
- Neon's built-in restore (point-in-time history) is a Neon console setting: documented in 3-INFRA with the steps. The user turns it on.

### Restore test

- **Local rehearsal now:**
  1. test data in a throwaway Postgres 16 (Docker),
  2. the same scripts: dump → encrypt → decrypt → restore into a second throwaway database → compare.
  3. The result and date are recorded in 3-INFRA.
- **Production:** the first green run of the backup job is the first real restore test; 3-INFRA has a line to fill with that date. Restoring into a Neon branch stays a manual step before go-live (3-INFRA §7).

## Not in this part (client inputs)

Vercel Pro, domain and `NEXT_PUBLIC_SITE_URL`, rotated secrets, Resend / Cloudinary / Turnstile / GA4 keys, privacy policy approval, client facts, final Lighthouse on the real domain, uptime monitor sign-up.

## Done when

1. Server logs are pino JSON; no `console.*` left in server code (lint enforces it); secrets and personal data are redacted (unit test).
2. Sentry is wired for server, edge and browser; off without a DSN; an unexpected controller error is reported, a catalog error is not (unit test); build passes with and without a DSN.
3. The backup workflow exists, restores every dump into a throwaway database, encrypts and keeps the artifact 30 days.
4. A local backup → restore rehearsal passed and is dated in 3-INFRA. The production restore line is ready for the first green run.
5. Lint, unit, build, full e2e green; no visual change.
