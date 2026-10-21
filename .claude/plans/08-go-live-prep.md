# Plan — Task 08 prep

Spec: `.claude/specs/08-go-live-prep.md`.

## Packages (D6 chose them; versions at least 2 weeks old)

| Package          | Version              | Why                                                                         | Maintainer                  |
| ---------------- | -------------------- | --------------------------------------------------------------------------- | --------------------------- |
| `pino`           | 10.4.0 (2 Oct 2026)  | JSON logger, D6                                                             | pino team, very widely used |
| `@sentry/nextjs` | 10.76.1 (6 Oct 2026) | Error tracking, D6. The mature 10.x line; 11.x is a new major from Sep 2026 | Sentry                      |

## Decisions

| Topic                          | Choice                                                                                           | Why                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Logger in Edge middleware      | Not used (middleware does not log)                                                               | pino is Node-only                                                             |
| Personal data in logs / Sentry | Redact paths; `sendDefaultPii: false`; no replay                                                 | Enquiries hold names, emails, phones                                          |
| Backup format                  | `pg_dump --format=custom`, PG 16 client (Neon runs 16)                                           | Selective restore; client version matches server                              |
| Backup encryption              | `gpg --symmetric --cipher-algo AES256` with a secret passphrase                                  | The artifact holds personal data; protects it even if repo access is too wide |
| Restore test                   | In the same job, every night, into a Postgres 16 service container; compare per-table row counts | A backup that has never been restored is not a backup                         |
| Secrets                        | `NEON_DIRECT_URL`, `BACKUP_PASSPHRASE` (GitHub repo secrets, set by the user)                    | I never see production credentials                                            |
| Local rehearsal                | Docker Postgres 16 with migrated + seeded test data                                              | Same scripts, no production data                                              |

## Steps

1. Install packages. 2. Logger + replace `console.*` + ESLint `no-console`. 3. Sentry files, env vars, CSP, `attempt()` capture, admin `error.jsx` capture. 4. Backup scripts + workflow. 5. Local rehearsal (Docker). 6. Docs: 3-INFRA §7–§9, `.env.example`. 7. Lint, unit, build (with and without DSN), e2e.
