# Plan — Task 06 `06-errors-env`

Spec: `.claude/specs/06-errors-env.md`.

## Decisions

| Topic                      | Choice                                                                                                                                                             | Why                                                                                                                                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Result shape               | `{ ok: false, code, fieldErrors?, message? }`. `message` only carries a field-rule text from a shared schema (e.g. alt text too short)                             | §3.1 contract; screens keep showing the same words                                                                                                                                                                                                             |
| Not-found codes            | One code per entity (`CATEGORY_NOT_FOUND` …)                                                                                                                       | Keeps today's wording                                                                                                                                                                                                                                          |
| Unexpected errors          | `attempt()` in controllers: `unstable_rethrow` for redirect / notFound, otherwise `console.error` the full error and return `INTERNAL_ERROR`                       | R-11.7; pino comes in task 08                                                                                                                                                                                                                                  |
| Required env               | Depends on where the app runs (see spec)                                                                                                                           | D14 previews have no DB; 3-INFRA §6 for production                                                                                                                                                                                                             |
| Where env is checked       | `next.config.mjs` imports `getEnv()`                                                                                                                               | Runs on build, dev and start; refuses before serving                                                                                                                                                                                                           |
| `env.js` and `server-only` | No marker: `next.config.mjs` and the Edge middleware import it                                                                                                     | Plain Node / Edge cannot load `server-only`                                                                                                                                                                                                                    |
| Loading / error screens    | `error.jsx` at `admin/(panel)/` for every section. Loading screen: shown while a sidebar link loads its section (`useLinkStatus` + overlay), **not** `loading.jsx` | Tried `loading.jsx` first: its Suspense boundary made every admin server-action form hang after saving (Next.js 15.5, `useActionState` + `revalidatePath`), proven by removing it (admin suite 42/42 again). The client overlay changes nothing on first load. |
| Pagination                 | Extract the enquiries pager into `components/shared/Pagination.jsx`; reuse it for projects; audit keeps its Newer / Older buttons                                  | Same look as today                                                                                                                                                                                                                                             |

## Risk to check before merging

The production env on Vercel must have every variable in 3-INFRA §6, or the next deploy will refuse to build. The user can check without showing values: `node --env-file=.env.production.local scripts/check-env.js`.

## Steps

1. Catalog + `AppError` + `attempt()`; convert services, controllers and screens (ActionForm, LoginForm, EnquiryForm, ImageManager, LogoUploader).
2. `env.js` + `next.config.mjs` check; move every server `process.env` read to `env.js`; ESLint `no-restricted-properties`.
3. `loading.jsx`, `error.jsx`, `EmptyState`, `EmptyRow`, `Pagination`; paginate admin projects.
4. Unit tests (catalog, `attempt`, env rules). E2E `errors.spec.js` (catalog message, empty state, pagination).
5. Lint, unit, build, e2e, screenshots; a broken-env run must refuse to start. Tick and commit.
