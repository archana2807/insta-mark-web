# Plan — Task 05 `05-jwt-login-roles`

Spec: `.claude/specs/05-jwt-login-roles.md`.

## Decisions

| Topic                      | Choice                                                                                                                             | Why                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| JWT library                | `jose@6.2.12`. Zero dependencies, MIT, maintained by panva, tens of millions of weekly downloads. Pinned; 6.2.13 is only a day old | Chosen in 2-ARCHITECTURE D2; works in Edge middleware                             |
| Cookie                     | New name `im_admin_token`                                                                                                          | Old cookies stop working on deploy (§6)                                           |
| Forbidden                  | Pages and actions redirect to `/admin?denied=1` (today's notice)                                                                   | Same look; error catalog comes in task 06                                         |
| Role source                | Permission check uses the role from the DB, not the token                                                                          | A token is at most one request out of date; `tv` covers the rest                  |
| Locked user                | `requireAuth` rejects a locked account (§6 "not locked")                                                                           | As decided in 2-ARCHITECTURE §6                                                   |
| `tv` bump on admin edit    | Only when role or active flag actually changes                                                                                     | Renaming a user should not log them out                                           |
| Migration                  | SQL from `prisma migrate diff --from-schema-datamodel` (old schema) `--to-schema-datamodel` (new)                                  | Needs no database, so never touches a live one; tested on PGlite by the e2e setup |
| Middleware + `server-only` | `jwt.js`, `cookies.js` and `permissions.js` stay Edge-safe, without `server-only`                                                  | Middleware imports them                                                           |

## Permission map (2-ARCHITECTURE §6)

| Route prefix                                          | Permission       |
| ----------------------------------------------------- | ---------------- |
| `/admin` (dashboard)                                  | `dashboard:read` |
| `/admin/enquiries/export`                             | `enquiry:export` |
| `/admin/enquiries`                                    | `enquiry:read`   |
| `/admin/categories`, `/projects`, `/clients`, `/faqs` | `content:write`  |
| `/admin/settings`                                     | `settings:write` |
| `/admin/users`                                        | `user:manage`    |
| `/admin/audit`                                        | `audit:read`     |
| `/admin/account`                                      | signed in only   |

## Steps

1. Install `jose`, schema + migration, `docs/database-design.md` row.
2. `src/server/auth/`:

   - `jwt.js` (sign/verify),
   - `cookies.js` (name and options),
   - `permissions.js` (role map, route map, `can()`),
   - `session.js` (`requireAuth`, `getCurrentUser`, `createSession`, `destroySession`).

   Delete `token.js`.

3. Users: `token_version` bumps; auth: `logoutEverywhere`. Controllers and pages use `requireAuth(permission)`. Sidebar filtered by permission.
4. Middleware: JWT + route permission.
5. Update 2-ARCHITECTURE §5 (new action `logoutEverywhere`) before adding it.
6. Tests:
   - unit: permissions, JWT sign/verify/expiry, every controller calls `requireAuth`;
   - e2e: cookie and JWT claims, expiry, logout, logout-everywhere, role change, deactivation kick-out, editor blocks incl. a direct action post.
7. Lint, unit, build, e2e, screenshots. Tick and commit.
