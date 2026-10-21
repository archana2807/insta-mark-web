// Task 05: JWT login, expiry, logout, "log out everywhere", role blocks, and a role
// change / deactivation logging the user out at once. Uses its own users, so it does
// not depend on what the admin suite changed.
import { test, expect } from "@playwright/test";
import { Prisma } from "@prisma/client";
import { SignJWT, decodeJwt } from "jose";
import { hashPassword } from "../../src/server/auth/password.js";
import { resetLimits, testPrisma } from "./db.js";

test.describe.configure({ mode: "serial" });

const COOKIE = "im_admin_token";
const PASSWORD = "Auth-Test-Pass-1";
const U = {
  admin: { email: "auth-admin@test.local", name: "Auth Admin", role: "ADMIN" },
  editor: { email: "auth-editor@test.local", name: "Auth Editor", role: "EDITOR" },
  role: { email: "auth-role@test.local", name: "Auth Role", role: "EDITOR" },
  gone: { email: "auth-gone@test.local", name: "Auth Gone", role: "EDITOR" },
};
const ids = {};
let base;

/**
 * Signs in through the real form and waits for the dashboard.
 * @param {import("@playwright/test").Page} page
 * @param {string} email
 */
async function login(page, email) {
  await page.goto("/admin/login");
  await page.fill("#email", email);
  await page.fill("#password", PASSWORD);
  await Promise.all([page.waitForURL("**/admin"), page.click("button[type=submit]")]);
}

/**
 * @param {import("@playwright/test").BrowserContext} context
 * @returns {Promise<import("@playwright/test").Cookie | undefined>}
 */
async function tokenCookie(context) {
  return (await context.cookies()).find((c) => c.name === COOKIE);
}

/**
 * @param {import("@playwright/test").Page} page
 * @returns {Promise<string>} pathname after visiting /admin
 */
async function adminPath(page) {
  await page.goto("/admin");
  return new URL(page.url()).pathname;
}

test.beforeAll(async ({ baseURL }) => {
  base = baseURL;
  await resetLimits();
  const prisma = testPrisma();
  const passwordHash = await hashPassword(PASSWORD);
  for (const [key, u] of Object.entries(U)) {
    const row = await prisma.adminUser.upsert({
      where: { email: u.email },
      create: { ...u, passwordHash },
      update: { ...u, passwordHash, isActive: true, failedLoginCount: 0, lockedUntil: null },
    });
    ids[key] = row.id;
  }
  await prisma.$disconnect();
});

// Every test signs in several times; the login limit is 10 per 10 min per IP.
test.beforeEach(() => resetLimits());

test("login sets one HttpOnly SameSite=Lax JWT cookie for 8 hours, nothing in localStorage", async ({
  page,
  context,
}) => {
  await login(page, U.editor.email);
  const admin = (await context.cookies()).filter((c) => c.name.startsWith("im_admin"));
  expect(admin.map((c) => c.name)).toEqual([COOKIE]);
  const [c] = admin;
  expect(c.httpOnly).toBe(true);
  expect(c.sameSite).toBe("Lax");
  expect(Math.abs(c.expires - (Date.now() / 1000 + 8 * 3600))).toBeLessThan(120);

  const claims = decodeJwt(c.value);
  expect(claims.sub).toBe(ids.editor);
  expect(claims.role).toBe("EDITOR");
  expect(typeof claims.tv).toBe("number");
  expect(claims.exp - claims.iat).toBe(8 * 3600);

  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
  expect(stored).not.toContain(c.value.split(".")[1]);
});

test("an expired token sends the user to the login page", async ({ browser }) => {
  const now = Math.floor(Date.now() / 1000);
  const expired = await new SignJWT({ role: "ADMIN", tv: 0 })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(ids.admin)
    .setIssuedAt(now - 9 * 3600)
    .setExpirationTime(now - 3600)
    .sign(new TextEncoder().encode(process.env.AUTH_SECRET));
  const c = await browser.newContext();
  await c.addCookies([{ name: COOKIE, value: expired, url: base }]);
  const q = await c.newPage();
  expect(await adminPath(q)).toBe("/admin/login");
  await c.close();
});

test("the old im_admin_session cookie no longer works", async ({ browser }) => {
  const c = await browser.newContext();
  await c.addCookies([{ name: "im_admin_session", value: "eyJ1aWQiOiJ4In0.old", url: base }]);
  const q = await c.newPage();
  expect(await adminPath(q)).toBe("/admin/login");
  await c.close();
});

test("logout clears the cookie", async ({ page, context }) => {
  await login(page, U.editor.email);
  expect(await tokenCookie(context)).toBeTruthy();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.waitForURL(/\/admin\/login/);
  expect(await tokenCookie(context)).toBeUndefined();
});

test("editor is denied on settings, users and audit pages and sees no admin links", async ({
  page,
}) => {
  await login(page, U.editor.email);
  const nav = page.getByRole("navigation", { name: "Admin" }).first();
  for (const label of ["Site settings", "Users", "Audit log"]) {
    await expect(nav.getByRole("link", { name: label })).toHaveCount(0);
  }
  for (const path of ["/admin/settings", "/admin/users", "/admin/audit"]) {
    await page.goto(path);
    expect(page.url()).toContain("denied=1");
    await expect(
      page.locator(".alert-warning", { hasText: "only available to administrators" }),
    ).toBeVisible();
  }
  const csv = await page.request.get("/admin/enquiries/export", { maxRedirects: 0 });
  expect(csv.status()).toBe(200);
});

test("editor calling the settings action directly is denied and nothing changes", async ({
  browser,
}) => {
  const SENTINEL = "+91 22 5555 0101";
  const prisma = testPrisma();
  const phone = async () =>
    (await prisma.siteSetting.findUnique({ where: { key: "contact.phone" } }))?.value ?? null;

  // Capture the exact request the admin's browser sends, without letting it through.
  const a = await browser.newContext();
  const ap = await a.newPage();
  await login(ap, U.admin.email);
  await ap.goto("/admin/settings");
  let captured;
  await ap.route("**/admin/settings", async (route) => {
    const r = route.request();
    if (r.method() === "POST" && r.headers()["next-action"]) {
      captured = { headers: r.headers(), body: r.postDataBuffer() };
      await route.abort();
    } else await route.continue();
  });
  await ap.fill("#phone", SENTINEL);
  await ap.getByRole("button", { name: /save/i }).first().click();
  await expect.poll(() => Boolean(captured)).toBe(true);
  const before = await phone();
  expect(before).not.toBe(SENTINEL);

  /**
   * Replays the captured action call from inside a signed-in page, like the app does.
   * @param {import("@playwright/test").Page} page
   */
  const send = (page) =>
    page.evaluate(
      async ({ action, type, body }) => {
        const res = await fetch("/admin/settings", {
          method: "POST",
          headers: { "next-action": action, "content-type": type, accept: "text/x-component" },
          body: new Uint8Array(body),
        });
        return {
          status: res.status,
          url: res.url,
          text: (await res.text()).slice(0, 200),
        };
      },
      {
        action: captured.headers["next-action"],
        type: captured.headers["content-type"],
        body: [...captured.body],
      },
    );

  // Next.js only runs an action on a page that includes it, so the call must go to
  // /admin/settings. The middleware turns the editor away there (requireAuth inside
  // the action is the second wall; tests/unit/auth.test.js proves every action has it).
  const e = await browser.newContext();
  const ep = await e.newPage();
  await login(ep, U.editor.email);
  const denied = await send(ep);
  expect(denied.url, JSON.stringify(denied)).toContain("/admin?denied=1");
  expect(await phone()).toEqual(before);

  // Control: the same call from the admin really saves, so the replay is valid.
  await ap.unroute("**/admin/settings");
  const saved = await send(ap);
  expect(saved.url, JSON.stringify(saved)).toContain("/admin/settings");
  await expect.poll(phone).toBe(SENTINEL);

  await prisma.siteSetting.update({
    where: { key: "contact.phone" },
    data: { value: before === null ? Prisma.JsonNull : before },
  });
  await prisma.$disconnect();
  await a.close();
  await e.close();
});

test("log out everywhere signs out every browser of that user", async ({ browser }) => {
  const one = await browser.newContext();
  const two = await browser.newContext();
  const p1 = await one.newPage();
  const p2 = await two.newPage();
  await login(p1, U.admin.email);
  await login(p2, U.admin.email);

  await p1.goto("/admin/account");
  p1.once("dialog", (d) => d.accept());
  await p1.getByRole("button", { name: "Log out everywhere", exact: true }).click();
  await p1.waitForURL(/\/admin\/login/);
  expect(await tokenCookie(one)).toBeUndefined();
  expect(await tokenCookie(two)).toBeTruthy();
  expect(await adminPath(p2)).toBe("/admin/login");

  const prisma = testPrisma();
  const entry = await prisma.auditLog.findFirst({
    where: { action: "LOGOUT_ALL", actorId: ids.admin },
  });
  await prisma.$disconnect();
  expect(entry).toBeTruthy();
  await one.close();
  await two.close();
});

test("a role change and a deactivation log the user out at once", async ({ browser }) => {
  const a = await browser.newContext();
  const ap = await a.newPage();
  await login(ap, U.admin.email);

  const r = await browser.newContext();
  const rp = await r.newPage();
  await login(rp, U.role.email);
  const g = await browser.newContext();
  const gp = await g.newPage();
  await login(gp, U.gone.email);

  await ap.goto("/admin/users");
  const roleRow = ap.locator("div.border-top", { hasText: U.role.email });
  await roleRow.locator("select[name=role]").selectOption("ADMIN");
  await roleRow.getByRole("button", { name: "Save", exact: true }).click();
  await roleRow.locator(".alert-success").waitFor();
  expect(await adminPath(rp)).toBe("/admin/login");

  const goneRow = ap.locator("div.border-top", { hasText: U.gone.email });
  await goneRow.locator("input[name=isActive]").uncheck();
  await goneRow.getByRole("button", { name: "Save", exact: true }).click();
  await goneRow.locator(".alert-success").waitFor();
  expect(await adminPath(gp)).toBe("/admin/login");

  // …and cannot sign in again (same generic message: no enumeration).
  await gp.fill("#email", U.gone.email);
  await gp.fill("#password", PASSWORD);
  await gp.click("button[type=submit]");
  await expect(gp.locator(".alert-danger")).toContainText("Invalid email or password");

  for (const c of [a, r, g]) await c.close();
});
