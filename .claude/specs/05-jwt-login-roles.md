# Spec — Task 05 `05-jwt-login-roles`

## Why

- Today the session is a home-made HMAC token (`im_admin_session`) with a password fingerprint. It cannot log a user out when their role changes or they are deactivated, and there is no "log out everywhere".
- Role checks are spread over pages and actions as `requireAdmin({ role: "ADMIN" })`. There is no single permission map (R-12.3, R-12.4).

## What changes

1. **Login** issues ONE `jose` JWT (HS256, `AUTH_SECRET`), with claims `sub`, `role`, `tv`, `iat`, `exp`. It is valid 8 hours and stored in a new cookie `im_admin_token`: HttpOnly, Secure in production, SameSite=Lax, path `/`. Nothing goes in localStorage. The old `im_admin_session` cookie stops working, so admins log in once again (2-ARCHITECTURE §6).
2. **`admin_users.token_version`** (new column, default 0, migration). It goes up on:

   - own password change (this browser gets a fresh token),
   - admin password reset,
   - role change,
   - deactivation or reactivation,
   - "log out everywhere".

   A token whose `tv` differs from the DB is rejected at once.

3. **`src/server/auth/permissions.js`** is the only role map (the permission table in 2-ARCHITECTURE §6), plus the route → permission list for `/admin/*`.
4. **Checks:**
   - `src/middleware.js` verifies the JWT and the route permission. A logged-out user goes to `/admin/login?next=…`; a missing permission goes to `/admin?denied=1`, as today.
   - Every controller and admin page calls `requireAuth(permission)`. It re-checks the user in the DB (exists, active, not locked, `tv` matches), then the permission. This is the check that counts.
   - The admin sidebar shows only the sections the user's permissions allow.
5. **Log out everywhere:** a button on My account. It raises `token_version`, clears the cookie, writes the audit entry `LOGOUT_ALL` and goes to the login page.
6. **Kept:** scrypt, the 10-character minimum, lockout (5 failures → 15 min), the login rate limit (10 per 10 min per IP), no user enumeration, no open redirect, audit of login, logout and lockout, and "cannot remove the last admin or yourself".

## Done when

1. Login sets exactly one cookie `im_admin_token` (HttpOnly, SameSite=Lax, 8 h max-age, a valid `jose` JWT with `sub`/`role`/`tv`/`exp`). No token is stored in localStorage.
2. Migration `admin_users.token_version` exists. Password change, role change, deactivation and "log out everywhere" make an old token fail at once (e2e).
3. `permissions.js` is the only role map. Middleware checks the route. Every controller calls `requireAuth(permission)` (unit test scans controllers). The UI hides what the user can't use.
4. An Editor is sent to "denied" on settings, users and audit, also when posting the settings action directly, and nothing changes (e2e).
5. Logout clears the cookie. Lockout, rate limit, no enumeration, no open redirect and audit logging still pass.
6. E2E covers login, expiry (an expired token goes to login), logout, role blocks, and a deactivated user being kicked out.
7. Lint, unit, build, the full e2e suite and the screenshots pass. Only expected difference: the My account page gains the "Log out everywhere" button.

## NOT in this task

- No refresh tokens (D3), no Auth.js, no new roles.
- No error catalog (task 06): "forbidden" is today's `denied=1` notice.
