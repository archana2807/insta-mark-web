// Task 05 "Done when": one jose JWT (8 h), one permission map, every controller checks auth.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SignJWT, decodeJwt } from "jose";

process.env.AUTH_SECRET = "unit-test-secret-unit-test-secret-unit-test";
const { signAccessToken, verifyAccessToken } = await import("../../src/server/auth/jwt.js");
const { ACCESS_TOKEN_TTL, TOKEN_COOKIE, tokenCookieOptions } = await import(
  "../../src/server/auth/cookies.js"
);
const { can, permissionsFor, permissionForPath } = await import(
  "../../src/server/auth/permissions.js"
);

const ROOT = new URL("../..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const key = new TextEncoder().encode(process.env.AUTH_SECRET);

test("login token is one HS256 JWT with sub, role, tv, valid 8 hours", async () => {
  const token = await signAccessToken({ sub: "u1", role: "EDITOR", tv: 3 });
  const claims = decodeJwt(token);
  assert.equal(claims.sub, "u1");
  assert.equal(claims.role, "EDITOR");
  assert.equal(claims.tv, 3);
  assert.equal(claims.exp - claims.iat, 8 * 60 * 60);
  assert.equal(ACCESS_TOKEN_TTL, 8 * 60 * 60);
  assert.deepEqual(await verifyAccessToken(token), claims);
});

test("cookie is HttpOnly, SameSite=Lax, 8 hours, under the new name", () => {
  const options = tokenCookieOptions();
  assert.equal(TOKEN_COOKIE, "im_admin_token");
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.maxAge, 8 * 60 * 60);
});

test("expired, tampered, wrong-key and unsigned tokens are rejected", async () => {
  const now = Math.floor(Date.now() / 1000);
  const expired = await new SignJWT({ role: "ADMIN", tv: 0 })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("u1")
    .setIssuedAt(now - 9 * 3600)
    .setExpirationTime(now - 3600)
    .sign(key);
  assert.equal(await verifyAccessToken(expired), null);

  const good = await signAccessToken({ sub: "u1", role: "EDITOR", tv: 0 });
  const [h, , s] = good.split(".");
  const forgedBody = Buffer.from(JSON.stringify({ sub: "u1", role: "ADMIN", tv: 0 })).toString(
    "base64url",
  );
  assert.equal(await verifyAccessToken(`${h}.${forgedBody}.${s}`), null);

  const otherKey = await new SignJWT({ role: "ADMIN", tv: 0 })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("u1")
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode("another-secret-another-secret-another-secret"));
  assert.equal(await verifyAccessToken(otherKey), null);

  const none = `${Buffer.from('{"alg":"none"}').toString("base64url")}.${forgedBody}.`;
  assert.equal(await verifyAccessToken(none), null);
  assert.equal(await verifyAccessToken("eyJ1aWQiOiJ4In0.forged"), null);
  assert.equal(await verifyAccessToken(undefined), null);
});

test("permission map: Admin has everything, Editor has no settings, users or audit", () => {
  for (const p of ["settings:write", "user:manage", "audit:read"]) {
    assert.equal(can("ADMIN", p), true, p);
    assert.equal(can("EDITOR", p), false, p);
  }
  for (const p of ["dashboard:read", "enquiry:read", "enquiry:update", "enquiry:export"]) {
    assert.equal(can("EDITOR", p), true, p);
  }
  assert.equal(can("EDITOR", "content:write"), true);
  assert.equal(can("EDITOR", "media:upload"), true);
  assert.deepEqual(permissionsFor("NOBODY"), []);
  assert.equal(can(undefined, "dashboard:read"), false);
});

test("middleware route map", () => {
  assert.equal(permissionForPath("/admin"), "dashboard:read");
  assert.equal(permissionForPath("/admin/settings"), "settings:write");
  assert.equal(permissionForPath("/admin/users"), "user:manage");
  assert.equal(permissionForPath("/admin/audit"), "audit:read");
  assert.equal(permissionForPath("/admin/enquiries/export"), "enquiry:export");
  assert.equal(permissionForPath("/admin/enquiries/abc"), "enquiry:read");
  assert.equal(permissionForPath("/admin/clients/new"), "content:write");
  assert.equal(permissionForPath("/admin/account"), null);
  assert.equal(permissionForPath("/admin/settingsX"), null);
});

test("permissions.js is the only role map", () => {
  const offenders = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(js|jsx)$/.test(e.name) && !p.endsWith(join("auth", "permissions.js"))) {
        const src = readFileSync(p, "utf8");
        if (
          /role\s*===?\s*["'](ADMIN|EDITOR)["']|["'](ADMIN|EDITOR)["']\s*===?\s*\w*role/i.test(src)
        )
          offenders.push(p);
      }
    }
  };
  walk(join(ROOT, "src"));
  // users.service decides "last admin" rules on the data, not on access.
  assert.deepEqual(
    offenders.filter((p) => !p.endsWith(join("users", "user.service.js"))),
    [],
  );
});

test("every non-public controller action calls requireAuth first", () => {
  const PUBLIC = new Set(["submitEnquiry", "login", "logout"]);
  const dir = join(ROOT, "src/server/modules");
  for (const mod of readdirSync(dir)) {
    for (const f of readdirSync(join(dir, mod)).filter((f) => f.endsWith(".controller.js"))) {
      const src = readFileSync(join(dir, mod, f), "utf8");
      const actions = src.split(/^export async function /m).slice(1);
      for (const body of actions) {
        const name = body.match(/^\w+/)[0];
        if (PUBLIC.has(name)) continue;
        const firstLine = body.split("\n").find((l, i) => i > 0 && l.trim());
        assert.match(firstLine, /await requireAuth\(/, `${f} → ${name} starts with requireAuth`);
      }
    }
  }
});
