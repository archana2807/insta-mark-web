# Spec — Task 06 `06-errors-env`

## Why

- Error texts are scattered as strings in services and controllers, and some screens read `error`, others `message`. Unexpected failures (DB down) bubble up as raw exceptions (R-11.7).
- `process.env` is read in about 15 places. A missing secret shows up only when a feature is used (R-11.8).
- Admin sections have no loading or error screens. The FAQ and audit lists have no empty state. The admin projects list is not paginated (D8, R-13.3).

## What changes

1. **Error catalog** in `src/shared/errors.js`: every code, HTTP status and user message. It holds 2-ARCHITECTURE §9 plus the admin messages the app shows today, with the same wording, and `INTERNAL_ERROR` for anything unexpected.
   - Services throw `AppError(code)` (`src/server/errors/app-error.js`).
   - Controllers turn errors into `{ ok: false, code, fieldErrors? }`.
   - Unexpected errors are logged in full on the server; the user sees only the safe catalog message.
   - Screens look up the message by code (`errorMessage(code)`). Field-rule texts stay in the shared Zod schemas.
2. **Env validation** in `src/server/config/env.js` (Zod), the only server file that reads `process.env`. An ESLint rule blocks `process.env` in other server code. Required variables:

   - **Production on Vercel** (`VERCEL_ENV=production`): `NEXT_PUBLIC_SITE_URL`, `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET` (32+ chars), `CRON_SECRET`, `IP_HASH_SALT` (3-INFRA §6).
   - **Any time a database is set:** `AUTH_SECRET` and `IP_HASH_SALT`.
   - **Otherwise:** all optional, so previews and dev without a DB run on `/content` (D14).

   Integrations (Resend, Turnstile, Cloudinary, GA4) stay optional; a half-configured one is reported at start-up and stays off. `next.config.mjs` validates on build, dev and start, so a bad env stops the app before it serves anything. Error output names the variables, never their values.

3. **Admin loading and error screens:** `error.jsx` for the admin panel (every section) shows the safe message and a reference. The loading screen shows while a sidebar link loads its section; a route `loading.jsx` was not used, because it broke the admin forms (see plan). Empty states come from one shared component (`EmptyState` / `EmptyRow`). Audit and FAQs gain one; the existing ones keep their text.
4. **Server pagination:** the admin projects list joins enquiries and audit (25 per page), with a shared `Pagination` component (same markup as the enquiries list today).

## Done when

1. `src/shared/errors.js` holds every error code and user message. Users see safe messages; details only in server logs (unit test: an unexpected error becomes `INTERNAL_ERROR`, and the stack is logged, not returned).
2. `src/server/config/env.js` validates env with Zod. Required variables missing → build and start refuse with a clear list; optional integrations stay optional (unit tests; a sealed test run with a broken env fails to start).
3. Admin sections have loading and error screens; empty lists show an empty state.
4. Enquiries, projects and audit lists are paginated on the server.
5. E2E covers one error message, one empty state and pagination. All earlier tests stay green, and screenshots are unchanged except the FAQ / audit pages when their lists are empty (not in the seeded data).

## NOT in this task

- No pino or Sentry (D6, task 08). No new npm packages.
- No change to field-rule wording or to success messages.
