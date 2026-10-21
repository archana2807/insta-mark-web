# STANDARDS.md — How we build MEDIUM full-stack JavaScript projects

> **NEW PROJECT?** Do NOT change this file. Same for every medium project.

The AI must follow this file on every task. `2-ARCHITECTURE.md` says WHICH options a project uses; this file says HOW to build them well.
"Medium" = 2–12 weeks, 5–30 screens, users + roles, a database, 1–3 developers.
Based on: Bulletproof React, Node.js Best Practices, Next.js and Express docs, Redux Style Guide, React docs,
Google Engineering Practices, Nielsen Norman Group, Testing Trophy, OWASP Top 10:2025 (links at the end).

**Golden rule for medium projects:** one modular monolith, one database, one deploy. Add Redis, queues, extra services
or Kubernetes ONLY when `1-PROJECT.md` gives a real reason (numbers, not "maybe later").

## 0. Default stack (JavaScript everywhere)

| Part | Default | Alternative (only if 2-ARCHITECTURE.md says) |
|---|---|---|
| Language | **JavaScript** (ES modules, `.js` / `.jsx`) + JSDoc types checked by `checkJs` (§0A) | TypeScript (strict) — then NestJS may replace Express |
| Shape | **Monorepo: Next.js web + Express API** (modular monolith) | **Single Next.js app** (route handlers / server actions) when there is no separate API client (no mobile app, no third-party API users) and < ~15 entities |
| Frontend | Next.js (App Router) | React + Vite (pure SPA behind login) |
| UI | Tailwind CSS + shadcn/ui (+ lucide icons) | — |
| Server data (frontend) | RTK Query (client components) / Server Components | — |
| Global client state | Redux Toolkit slice — only when needed (§7A) | — |
| App-wide rare values | React Context (theme, session user, permissions) | — |
| Forms | React Hook Form + Zod | — |
| Backend | Express (layered, §1–§2) | NestJS (only with TypeScript) |
| Validation | Zod (shared schemas front + back) | — |
| Database / ORM | PostgreSQL + Prisma | MySQL + Prisma (if client hosting needs it) |
| Auth | JWT access + refresh in httpOnly cookies (`jsonwebtoken` + Express middleware) · Auth.js for single Next.js app | Google login (OIDC) |
| Background jobs | none by default | Redis + BullMQ when emails/imports/AI batches must not block requests |
| File storage | S3-compatible (AWS S3, Cloudflare R2, DigitalOcean Spaces) | local disk in dev only |
| Email | Resend / SES / SMTP via one adapter | — |
| AI | LangChain.js with OpenAI (LangGraph.js for multi-step agents) | — |
| Logging | pino + pino-http | — |
| Testing | Vitest, Testing Library, MSW, Supertest, Playwright | Testcontainers (if DB tests need isolation) |
| Tooling | npm workspaces + Turborepo, ESLint, Prettier, Husky, lint-staged, commitlint | — |
| Runtime | Node.js LTS | — |

## 0A. JavaScript rules (types without TypeScript)
- ES modules everywhere: `"type": "module"` in every `package.json`; `import`/`export`, never `require`.
- Files: `.js` for logic, `.jsx` for React components (Next.js: `page.jsx`, `layout.jsx`, `error.jsx`...).
- `jsconfig.json` in each app with `"checkJs": true`, `"strict": true` and path aliases (`@/*`). `npm run typecheck` = `tsc --noEmit -p jsconfig.json` (TypeScript installed as a dev tool only, to check JS).
- Types come from **Zod schemas** + **JSDoc**:
```js
// packages/shared/src/schemas/booking.js
import { z } from "zod";
export const createBookingSchema = z.object({ date: z.string().datetime(), people: z.number().int().min(1).max(10) });
/** @typedef {z.infer<typeof createBookingSchema>} CreateBookingInput */

// apps/api/src/modules/bookings/bookings.service.js
/** @param {import("@app/shared/schemas/booking.js").CreateBookingInput} input  @param {string} userId */
export async function createBooking(input, userId) { /* ... */ }
```
- Every exported function has a JSDoc comment with `@param` and `@returns`. React components document props with `@param {{ title: string, onSave?: () => void }} props`.
- No `// @ts-ignore` / `// @ts-nocheck` without a written reason. Use `unknown`-style narrowing (`typeof`, `instanceof`, Zod `.safeParse`) instead of guessing.
- shadcn/ui in JS mode: `"tsx": false` in `components.json`.

## 1. Backend architecture — layered (modern MVC)
A request flows top to bottom only.

| Layer | Job | Must NOT |
|---|---|---|
| Controller / Route handler | receive request, validate input, call ONE service method, return response | contain business logic or DB code |
| Schema (Zod) | define and validate input and output shapes | — |
| Service | business rules, permission + ownership checks, transactions | know about HTTP (req/res) |
| Repository | all database access (Prisma) | contain business rules |
| Integration adapter | one external API (payment, email, LLM, storage) behind an interface | leak provider details to services |

Rules:
- Organise by business MODULE (`modules/bookings/...`), not by file type.
- Modules talk to each other only through the other module's SERVICE, never its repository.
- Simple dependency injection: services and adapters are created by factory functions that receive their dependencies (`createBookingsService({ bookingsRepo, emailAdapter })`), wired once in `app.js` — so tests can pass fakes.
- Domain code never imports request/response objects.
- Keep it simple: no extra layers, patterns or abstractions "for the future". For very simple CRUD modules, the service may call Prisma directly — add a repository when queries get reused or complex.

## 2. Repository and folder structure
### A. Monorepo (default)
```
apps/
  web/                 Next.js frontend           (section 7)
  api/                 Express backend            (below)
packages/
  shared/              Zod schemas, JSDoc typedefs, ERROR CODES + messages, constants — used by web AND api
docs/                  specs
docker-compose.yml   turbo.json   package.json (workspaces)   package-lock.json   .env.example
```
- Package manager **npm**. Root `package.json`: `"workspaces": ["apps/*", "packages/*"]`, `"packageManager": "npm@<version>"`.
- Internal packages referenced as `"@app/shared": "*"` — never `"workspace:*"` (pnpm-only, breaks npm).
- `package-lock.json` always committed. Per workspace: `npm run dev -w apps/api`, `npm install <pkg> -w apps/web`.
- Shared lint/jsconfig/prettier config lives in the root (add `packages/config` only if it grows).

### Backend — Express (`apps/api/src`)
```
server.js              starts the HTTP server, graceful shutdown
app.js                 builds the app: helmet, CORS, cookie-parser, json limit, pino-http, request-id,
                       routes, 404 handler, ONE error middleware (last); wires services (factory functions)
config/env.js          env schema (Zod) — app refuses to start if invalid
common/
  errors/              AppError + subclasses (section 10)
  middleware/          request-id.js, error-handler.js, validate.js (Zod), require-auth.js, require-role.js, rate-limit.js
  logger.js            pino
modules/
  auth/  users/  <feature>/
    <feature>.routes.js        Express Router: path + middleware + controller
    <feature>.controller.js    req → validate → ONE service call → res
    <feature>.service.js       business rules (no req/res)
    <feature>.repository.js    Prisma queries (if needed)
    <feature>.test.js
integrations/<provider>/      <provider>.adapter.js (documented with JSDoc)
prisma/                schema.prisma, migrations/, seed.js
test/                  API integration tests (Supertest)
```
- Async route errors: Express 5 passes rejected promises to the error middleware automatically; on Express 4 wrap handlers with `asyncHandler`.
- Routes are protected by default: `router.use(requireAuth)` at the top of each private router; public routes listed explicitly.

### B. Single Next.js app (only if 2-ARCHITECTURE.md chooses it)
```
src/
  app/                 routes + route handlers (app/api/...) — THIN
  features/ components/ hooks/ lib/ store/ contexts/ config/   (same as section 7)
  server/
    modules/<feature>/ service.js, repository.js, schema.js
    integrations/<provider>/
    errors/  auth/  db.js (Prisma client)
prisma/
```
Route handlers and server actions only: parse input → call ONE service → return. Same layer rules as §1.

## 3. API standards (REST)
- **Contract first:** update `docs/api/openapi.yaml` BEFORE coding the endpoint. Swagger UI (`swagger-ui-express`) at `/docs` outside production.
- `/api/v1/...` · plural nouns · kebab-case paths · camelCase JSON.
- GET read · POST create · PATCH partial update · DELETE remove.
- Status codes: 200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500, 503.
- Success: `{ "data": ..., "meta": { "page", "limit", "total" } }` (meta only for lists).
- Error (ALWAYS this shape): `{ "error": { "code": "BOOKING_IN_PAST", "message": "...", "details": [{ "field": "date", "code": "IN_PAST" }], "requestId": "..." } }`
- Lists paginated (`?page=1&limit=20`, max 100). Filters/sort only as the spec says.
- Payments/orders accept an `Idempotency-Key` header.
- Responses go through output schemas — never return passwords, tokens or internal fields.

## 4. Authentication and authorization (if the project has users)
- Access token (JWT, 15 min) + refresh token (7 days), rotated on use, stored hashed in DB so it can be revoked. Logout revokes it.
- Web: tokens in httpOnly + Secure + SameSite cookies — never localStorage. Mobile/API clients: Bearer header.
- Passwords: argon2id (or bcrypt). Reset tokens single-use, expire in 30 min.
- Rate-limit login/signup/reset (`express-rate-limit`). Lock 15 min after 5 failed logins.
- Roles (RBAC) with `requireRole('ADMIN')` middleware; the SERVICE checks ownership ("is this booking yours?").
- Deny by default: every router uses `requireAuth` unless the route is listed as public.
- Frontend route guards are UX only — the backend is the real check.
- Optional per spec: email verification, Google login, 2FA.

## 5. Security — OWASP Top 10:2025 checklist

| OWASP 2025 | What we do |
|---|---|
| A01 Broken Access Control | deny by default, guards + ownership checks in services, tests for 401/403 |
| A02 Security Misconfiguration | helmet, strict CORS allow-list, no stack traces in prod, Swagger off in prod |
| A03 Software Supply Chain Failures | lockfile committed, `npm audit` + Dependabot, ask before adding packages |
| A04 Cryptographic Failures | HTTPS only, argon2/bcrypt, secrets never in code |
| A05 Injection | Prisma (no raw SQL with string concat), Zod on every input, no `eval` |
| A06 Insecure Design | specs + "Done when" + threat questions in Prompt 2 |
| A07 Authentication Failures | section 4 |
| A08 Software/Data Integrity Failures | verify webhook signatures, CI-built images only |
| A09 Logging & Alerting Failures | section 16; never log secrets/PII |
| A10 Mishandling of Exceptional Conditions | section 10 (central error handling, fail safe) |

Plus: uploads checked for type/size, stored in object storage with private access + signed URLs; CSRF protection with cookies (SameSite + origin check); request body size limit; audit log for admin actions (who, what, when).

## 6. Database (Prisma + PostgreSQL)
- Every schema change = `npx prisma migrate dev --name <what>` migration committed. Never edit an applied migration. Never change prod DB by hand.
- Tables/columns snake_case (`@@map`/`@map`), models PascalCase. Every table: id (uuid/cuid), created_at, updated_at.
- Indexes on foreign keys and on columns used in filters/sorting.
- `prisma.$transaction` when one action writes several tables.
- No N+1: use `include`/`select`; select only needed fields.
- Money = integer minor units (paise) + currency. Dates stored UTC, shown in the user's timezone.
- Soft delete / audit columns only where the spec says. Seed file for dev + demo data.

## 7. Frontend architecture (Bulletproof React)
```
apps/web/src/
  app/              routes, layouts, providers.jsx, error.jsx, not-found.jsx, loading.jsx — THIN, compose features
  features/<name>/  api/ (RTK Query injectEndpoints) · components/ · hooks/ · <name>Slice.js (only if needed)   (only folders needed)
  components/
    ui/             design-system primitives (shadcn/ui based) — section 8
    shared/         PageHeader, DataTable, EmptyState, ErrorState, ConfirmDialog...
    layout/         AppShell, Sidebar, Navbar
  hooks/            shared hooks (useDebounce, useMediaQuery)
  lib/              api/base-api.js (RTK Query), errors.js, utils.js (cn)
  store/            store.js (makeStore), hooks.js, StoreProvider.jsx
  contexts/         AuthContext, ThemeContext — small, rarely changing values only
  config/           env.js (validated), constants
  testing/          MSW handlers, renderWithProviders
```
Rules:
- **One-way imports:** shared (components/hooks/lib) → features → app. Features never import other features; compose them in `app/`. Enforce with ESLint `import/no-restricted-paths`.
- Import files directly — no barrel `index.js` in features.
- Server Components by default; `'use client'` only for interactivity.
- All client HTTP goes through ONE RTK Query `baseApi`: base URL, cookies, requestId, error mapping, 401 → refresh once → logout.
- Colocate; move to shared only when reused twice.

## 7A. State management — keep it in the lowest place that works

| Kind of state | Example | Lives in |
|---|---|---|
| Server data | bookings, products, profile | **RTK Query** cache or Server Components — never copied into slices/Context |
| Shared client state, changes often, many screens | cart, multi-step wizard, shared filters | **Redux Toolkit slice** |
| App-wide values that rarely change | session user, theme, permissions | **React Context** |
| URL state | page, search, sort, active tab | URL search params |
| Form state | values while typing | React Hook Form |
| Local UI state | open/closed, hover | `useState` / `useReducer` |

Order: local → parent → URL → Context → Redux. Many medium projects need **no Redux slices at all** — only RTK Query.

**Redux Toolkit rules:** only RTK (`configureStore`, `createSlice`, `createSelector`). One store, created per request with `makeStore()` and a client `StoreProvider` — never a module-level global store. Use `useAppDispatch` / `useAppSelector` from `store/hooks.js` (re-exports of `useDispatch` / `useSelector`, documented with JSDoc `RootState`). One slice per feature, named by data (`cart`), actions as events (`cart/itemAdded`). Reducers pure; state serializable (ISO strings, not Dates). Derive with `createSelector`. DevTools in dev only. Never persist tokens.

**RTK Query rules:** one `baseApi` (`createApi` + `baseQueryWithReauth`, `tagTypes`) in `lib/api/base-api.js`; each feature adds endpoints with `injectEndpoints` in `features/<name>/api/`. Invalidate with `providesTags` / `invalidatesTags`. Use `isLoading` (skeleton), `isFetching` (small indicator), `isError` + `refetch` (ErrorState + Retry). Mutations: `await mutate(body).unwrap()` in try/catch. Optimistic updates with `onQueryStarted` + `updateQueryData` + `patch.undo()` only where the spec needs instant feedback.

**React Context rules:** use only when distant components need the same rarely-changing value. One context per concern, with a Provider + a hook that throws outside it (`useAuth()`). Memoize the value with `useMemo`. Never for lists, server data or typing input. Providers composed once in `app/providers.jsx` (StoreProvider → AuthProvider → ThemeProvider → Toaster).

## 8. Reusable components (design system)
**Never build the same UI twice. Before creating a component, check `components/ui` and `components/shared`.**

Must exist (Milestone 0, used everywhere):

| Component | Purpose |
|---|---|
| Button | variants (primary, secondary, destructive, ghost), sizes, `loading` prop (spinner + disabled) |
| Input, Textarea, Select, Checkbox, Switch, DatePicker | consistent form controls, `aria-invalid` support |
| FormField | label + control + hint + error (used by every form) |
| Card, Badge, Avatar, Tooltip | display |
| Dialog / Sheet, ConfirmDialog | modals; ConfirmDialog for every destructive action |
| Toast (sonner) | short success/error feedback |
| Spinner, Skeleton | loading (section 9) |
| EmptyState | icon + message + action ("No bookings yet — Create booking") |
| ErrorState | message + Retry + small Error ID |
| DataTable | sorting, pagination, loading/empty/error built in |
| Pagination, SearchInput (debounced) | lists |
| PageHeader, AppShell | page layout |

Rules: small and single-purpose (split at ~150 lines or ~7 props); props documented with JSDoc and given defaults; forward `className`/refs; wrap third-party widgets (charts, editors, date pickers) in our own component; variants with `cva`, merge with `cn()`; Tailwind theme tokens, no hard-coded hex; accessible (keyboard, focus ring, labels, AA contrast); user-facing text from props/constants.

## 9. Loading states
Every place that waits MUST show feedback.

| Situation | Pattern |
|---|---|
| Page / section loading | Skeleton matching the final layout (`loading.jsx` or `isLoading`) |
| Short inline wait | Spinner next to the element |
| Button action | `Button loading` — spinner + disabled, prevents double submit |
| Background refetch | keep old data + small indicator (`isFetching`); never blank the screen |
| Long job (> 5 s: upload, AI, import) | progress or step text ("Generating… 2 of 3") + cancel if possible |

Rules: every data view handles **loading → error → empty → success** (in that order in code). Skeletons same size as content. Show loaders only after ~200–300 ms. `<Suspense>` per section.

## 10. Error handling — end to end
- **Expected** (validation, not found, no permission, payment declined, offline): handled, helpful message.
- **Unexpected** (bugs): caught by global filter / error boundary, sent to Sentry, user sees a safe message + Error ID.

### Backend
- `AppError` (extends `Error`) with `code`, `httpStatus`, `details`. Subclasses: `ValidationError`(422), `NotFoundError`(404), `ForbiddenError`(403), `UnauthorizedError`(401), `ConflictError`(409), `RateLimitError`(429), `ExternalServiceError`(502/503).
- Services THROW `AppError`s with a catalog code; controllers never format errors.
- ONE Express error middleware (`common/middleware/error-handler.js`, registered last): AppError → standard error shape (§3); unknown → 500 `INTERNAL_ERROR`; logs with requestId; never sends stack traces or DB messages.
- Zod validation errors → 422 with `details[]` per field.
- External calls: timeout (10 s), retry only safe operations, map provider errors to `ExternalServiceError`.
- Always `await`; no empty `catch {}`. Handle `unhandledRejection` / `uncaughtException`: log, exit, let the process manager restart.
- Fail safe: deny on error; use transactions so nothing is half-written.

### Shared error catalog (`packages/shared/src/errors.js`) — codes AND user messages
```js
export const ERRORS = Object.freeze({
  VALIDATION_FAILED: { status: 422, message: "Please check the highlighted fields." },
  UNAUTHORIZED:      { status: 401, message: "Please log in to continue." },
  FORBIDDEN:         { status: 403, message: "You don't have access to this." },
  NOT_FOUND:         { status: 404, message: "We couldn't find what you were looking for." },
  CONFLICT:          { status: 409, message: "This was changed by someone else. Refresh and try again." },
  RATE_LIMITED:      { status: 429, message: "Too many attempts. Please wait a minute and try again." },
  NETWORK_ERROR:     { status: 0,   message: "You seem to be offline. Check your connection and try again." },
  INTERNAL_ERROR:    { status: 500, message: "Something went wrong on our side. Please try again." },
  // feature codes, e.g.
  BOOKING_IN_PAST:   { status: 422, message: "Choose a date and time in the future." },
});
/** @typedef {keyof typeof ERRORS} ErrorCode */
```

### Frontend
- `baseQuery` turns every failure into `ApiError { code, message, details, requestId, status }`; network failures → `NETWORK_ERROR`.
- `lib/errors.js` → `getErrorMessage(error)`: catalog message by code, else safe generic message. Never show raw server text.
- 401 → refresh once → else logout + "Your session expired. Please log in again."

| Error | Shown as |
|---|---|
| Field validation | under the field, field highlighted, focus on first error |
| Form submit failure | Alert at top of form; user's input KEPT |
| Action failure (delete, toggle) | error Toast + Retry |
| Data loading failure | ErrorState in that section with Retry |
| Not found | `not-found.jsx` with link back |
| No permission | 403 page explaining what's missing |
| Crash | `error.jsx` per route segment + `global-error.jsx`, reported to Sentry |

- Multiple error boundaries — one broken widget must not blank the app.
- Server Actions: return expected errors as values (`{ ok: false, code }`).

## 11. Writing error messages (Nielsen Norman Group)
1. **Say what happened** in plain words ("Email or password is incorrect", not "Error 401").
2. **Say how to fix it** ("Use at least 8 characters, including a number").
3. **Be specific** ("This email is already registered — Log in instead?").
4. **Be polite, don't blame** — avoid "invalid", "illegal", "you failed"; no jokes.
5. **Show it next to the problem**, icon + text (not colour alone).
6. **Keep the user's work** — never clear the form.
7. **Offer a next action** — Retry, Log in, Contact support; Error ID small, for support.
8. **Right time** — validate on blur/submit, not on the first keystroke.
Success messages too: short confirmations ("Booking confirmed for 7:30 pm").

## 12. Forms
- React Hook Form + Zod resolver; the SAME Zod schema from `packages/shared` validates on the server.
- Every field uses FormField; required fields marked.
- Submit button loading + disabled while submitting.
- Server `details[]` mapped back onto matching fields.
- Destructive actions use ConfirmDialog.

## 13. Testing — Testing Trophy ("mostly integration")

| Layer | What | Tools |
|---|---|---|
| Static | types + lint on every commit | `checkJs` typecheck (JSDoc), ESLint |
| Unit | services with business rules, utils, Zod schemas, error mapping | Vitest |
| Integration (most value) | API endpoints against a test DB; pages/components with mocked API | Supertest · Testing Library + MSW |
| End-to-end | 3–5 critical flows (login, main create flow, payment if any) | Playwright |

- Test like a user: query by role/label/text.
- Every "Done when" line has a test named after it (`F2: rejects booking in the past`).
- Every endpoint: success, validation error, 401, 403, 404. Every data screen: loading, error, empty, success.
- Test DB: separate database (docker-compose `postgres-test` or Testcontainers), reset between test files.
- Mock only external services. Coverage goal ~70–80% on services. CI blocks merge on failure.

## 14. Code quality, review and Git
- ESLint (typescript-eslint, react-hooks, jsx-a11y, import/no-restricted-paths) + Prettier. Zero warnings.
- Naming: PascalCase components/classes, camelCase functions/vars, kebab-case files, UPPER_SNAKE constants and error codes. Booleans `is/has/can`. Handlers `handleX` / props `onX`.
- No `{*}` / `{any}` JSDoc types, no unexplained `@ts-ignore`, no `require`, no `console.log`, no commented-out code, no unused files.
- ESLint config: `@eslint/js` recommended, react, react-hooks, jsx-a11y, import (no `typescript-eslint` needed).
- Husky + lint-staged (format + lint changed files), commitlint (Conventional Commits: `feat(bookings): add cancel endpoint`).
- Branch per task `feat/<task-id>-<name>`, small PRs (~100–400 lines, one purpose, with tests).
- Review: fresh AI session (Prompt 5) + you. Check design, behaviour, tests, naming, errors; minor points "Nit:".
- `main` protected. Tag releases (SemVer) + CHANGELOG.md.

## 15. Configuration (12-factor)
- All config from env variables; same build for every environment.
- `config/env.js` validates env with Zod at startup — app refuses to start if wrong.
- Only `NEXT_PUBLIC_*` reaches the browser — never secrets.
- `.env.example` lists every variable with a fake value and a comment; real `.env` never committed.

## 16. Logging and monitoring
- pino JSON logs: time, level, requestId, userId, message. Levels: error, warn, info (business events), debug (dev).
- requestId from `X-Request-ID` or generated; returned in responses and error bodies.
- Never log passwords, tokens, card data, or AI prompts with personal data.
- Sentry (free tier) on web + api, source maps, release tag.
- `GET /health` (alive) and `GET /ready` (DB reachable). Free uptime monitor (UptimeRobot / Better Stack) + email alert.

## 17. Performance and background work
- Pagination everywhere, indexes, no N+1, timeouts on every outbound call.
- Frontend: Server Components, `next/image`, dynamic import for heavy widgets, debounce search, memoize only when measured.
- Slow work (emails, imports, reports, AI batches): start simple (send after response / cron); move to Redis + BullMQ when it causes timeouts or must retry reliably. Jobs idempotent with retries.
- Cache only where measured slow; every cache key has TTL + invalidation rule.

## 18. AI features (when the project uses AI)
- LLM calls only on the server, through ONE client (`integrations/llm/`) using LangChain.js + OpenAI: timeout, retry, token/cost logging, model name from env.
- Multi-step agents: LangGraph.js with typed state, step limit, tools limited to the logged-in user's permissions.
- Prompts in versioned files (`prompts/summary.v1.md`), never inline strings.
- Structured output validated with Zod (`withStructuredOutput`); invalid → safe fallback, not a crash.
- Stream long answers with a "thinking" state and a Stop button.
- Never present AI guesses as facts: show sources, label AI-generated content.
- Per-user rate limit + monthly cost cap from env. AI features can be switched off with a flag.
- Small eval set (10–30 example inputs + expected results) run when prompts or models change.

## 19. DevOps (medium = one server or one platform)
- Docker: multi-stage, `node:<LTS>-alpine`, `npm ci`, non-root user, HEALTHCHECK, `.dockerignore`, `NODE_ENV=production`.
- `docker-compose.yml` for local dev: web + api + postgres (+ redis only if used).
- Hosting (pick in 3-INFRA.md): **A)** one VPS with Docker Compose + Caddy/Nginx (HTTPS) — cheapest; **B)** platform: Vercel (web) + Railway/Render/Fly (api + Postgres).
- GitHub Actions on PR: `npm ci` → lint → typecheck → test → build → `npm audit`. Turborepo caching.
- Deploy on merge to `main` (or manual button); run `npx prisma migrate deploy` before starting the new version; smoke test `/health`.
- Staging environment optional: required if the client tests before go-live.
- Rollback = redeploy previous image/tag. Keep the last 3 images.

## 20. Documentation
- README: what it is, setup in under 10 commands, env vars, scripts, tests, deploy.
- OpenAPI/Swagger = API docs. Decisions in 2-ARCHITECTURE.md. CHANGELOG.md per release.
- Comments explain WHY, not what.

## 21. Definition of Done (every task)
- [ ] Only what the task asked; meets its "Done when" lines
- [ ] Layers (§1), folders (§2/§7) and one-way imports respected
- [ ] Reused existing components; new reusable ones placed in components/ui or shared (§8)
- [ ] State in the lowest correct place (§7A)
- [ ] Loading, empty, error, success states handled (§9)
- [ ] Errors use AppError + catalog codes; friendly messages; user input kept (§10, §11)
- [ ] Input validated (shared Zod); permissions + ownership checked in the service
- [ ] OpenAPI updated if an endpoint changed; migration added if DB changed; .env.example updated
- [ ] Tests written and passing; lint + typecheck pass with zero warnings
- [ ] No secrets, console.log, any, commented-out code or unused files
- [ ] Task ticked in TASKS.md; one Conventional Commit

## 22. Production readiness (before go-live)
- [ ] HTTPS, helmet, CORS allow-list, Swagger off in prod
- [ ] Secrets in the platform/server env, different from dev values
- [ ] Daily DB backups on, restore tested once
- [ ] Migrations run in deploy; rollback tried once
- [ ] Sentry + logs + uptime monitor + alert email working
- [ ] Rate limits on auth and public endpoints
- [ ] Friendly 404, 403, 500 and offline states, each with a way back
- [ ] Main flow tested with realistic data volume (numbers in 1-PROJECT.md)
- [ ] Lighthouse performance and accessibility ≥ 90 on key pages
- [ ] Admin user created safely (seed script or CLI, not hard-coded)
- [ ] README + API docs current; client handover notes written
- [ ] Privacy: data export/deletion if required (DPDP / GDPR)

## Sources
- Bulletproof React — https://github.com/alan2207/bulletproof-react
- Redux Style Guide — https://redux.js.org/style-guide/
- Redux with Next.js — https://redux.js.org/usage/nextjs
- React Context — https://react.dev/learn/passing-data-deeply-with-context
- Node.js Best Practices — https://github.com/goldbergyoni/nodebestpractices
- Next.js Error Handling — https://nextjs.org/docs/app/getting-started/error-handling
- Express error handling — https://expressjs.com/en/guide/error-handling.html
- JSDoc types in JS (TypeScript checkJs) — https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html
- NN/g Error-Message Guidelines — https://www.nngroup.com/articles/error-message-guidelines/
- Testing Trophy — https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications
- Google Code Review Standard — https://google.github.io/eng-practices/review/reviewer/standard.html
- Google Small CLs — https://google.github.io/eng-practices/review/developer/small-cls.html
- OWASP Top 10:2025 — https://owasp.org/Top10/2025/
- Twelve-Factor App — https://12factor.net
- npm workspaces — https://docs.npmjs.com/cli/using-npm/workspaces
- LangChain.js — https://js.langchain.com/docs/
- Claude Code best practices — https://code.claude.com/docs/en/best-practices
