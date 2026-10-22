// Admin panel end to end: auth, lockout, roles, enquiries + CSV, content edits that must
// appear on the public site, projects, FAQs, settings, users, audit, sessions.
// Ported from the 13–14 Oct admin suite (43 named checks), steps in the same order.
import fs from "node:fs";
import { test, expect } from "@playwright/test";
import { resetLimits } from "./db.js";
import { USERS } from "./fixtures.js";

test.describe.configure({ mode: "serial" });

/** @type {import("@playwright/test").BrowserContext} */
let admin;
/** @type {import("@playwright/test").Page} */
let p;
let base;
const checks = [];
const jsErrors = [];

/**
 * One named check, reported in the summary (soft: the step continues).
 * @param {string} name
 * @param {unknown} ok
 * @returns {void}
 */
function check(name, ok) {
  checks.push({ name, ok: Boolean(ok) });
  expect.soft(Boolean(ok), name).toBe(true);
}

/**
 * Polls a public URL until predicate(html) is true (cache revalidation after admin edits).
 * @param {string} path
 * @param {(html: string) => boolean} predicate
 * @param {number} [tries]
 * @returns {Promise<boolean>}
 */
async function eventually(path, predicate, tries = 12) {
  for (let i = 0; i < tries; i++) {
    if (predicate(await (await fetch(base + path)).text())) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} email
 * @param {string} password
 * @returns {Promise<void>}
 */
async function login(page, email, password) {
  await page.goto("/admin/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click("button[type=submit]");
}

test.beforeAll(async ({ browser, baseURL }) => {
  await resetLimits();
  base = baseURL;
  admin = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    acceptDownloads: true,
  });
  p = await admin.newPage();
  p.on("pageerror", (e) => jsErrors.push(e.message));
});

test.afterAll(async () => {
  const passed = checks.filter((c) => c.ok).length;
  console.log(`admin checks: ${passed}/${checks.length} passed`);
  for (const c of checks.filter((x) => !x.ok)) console.log(`  FAIL ${c.name}`);
  await admin?.close();
});

test("auth gate", async () => {
  await p.goto("/admin/enquiries?status=NEW");
  const u = new URL(p.url());
  check(
    "unauthenticated /admin/* redirects to login with next=",
    u.pathname === "/admin/login" && u.searchParams.get("next") === "/admin/enquiries?status=NEW",
  );
});

test("bad login", async () => {
  await login(p, USERS.admin.email, "wrong-password");
  await p.waitForSelector(".alert-danger");
  check(
    "wrong password → generic error",
    (await p.textContent(".alert-danger")).includes("Invalid email or password"),
  );
  await login(p, "nobody@test.local", "whatever-123");
  await p.waitForSelector(".alert-danger");
  check(
    "unknown email → same generic error (no enumeration)",
    (await p.textContent(".alert-danger")).includes("Invalid email or password"),
  );
});

test("lockout", async ({ browser }) => {
  const c = await browser.newContext();
  const q = await c.newPage();
  for (let i = 0; i < 5; i++) {
    await login(q, USERS.lock.email, `bad-pass-${i}`);
    await q.waitForSelector(".alert-danger");
  }
  await login(q, USERS.lock.email, USERS.lock.password);
  await q.waitForSelector(".alert-danger");
  check(
    "5 failures lock the account (correct password refused)",
    (await q.textContent(".alert-danger")).includes("temporarily locked"),
  );
  await c.close();
});

test("open redirect blocked", async () => {
  await p.goto("/admin/login?next=https://evil.example.com");
  await p.fill("#email", USERS.admin.email);
  await p.fill("#password", USERS.admin.password);
  await Promise.all([p.waitForURL("**/admin"), p.click("button[type=submit]")]);
  check("login succeeds; external next= ignored → /admin", new URL(p.url()).pathname === "/admin");
  const sc = (await admin.cookies()).find((c) => c.name === "im_admin_token");
  check(
    "session cookie is HttpOnly + SameSite=Lax",
    sc?.httpOnly === true && sc?.sameSite === "Lax",
  );
});

// A public enquiry with a spreadsheet-formula payload for the CSV test. The name field
// only accepts letters, so the payload goes in Project location.
test("public enquiry → admin", async ({ browser }) => {
  const pubCtx = await browser.newContext();
  const pub = await pubCtx.newPage();
  // The solution page's call to action leads to the Contact form with Road Signs chosen.
  await pub.goto("/solutions/road-signs?utm_source=newsletter");
  await pub.getByRole("link", { name: /Request a Consultation/ }).click();
  await pub.waitForURL(/\/contact\?requirement=Road\+Signs&utm_source=newsletter/);
  await pub.fill("#contact-form-name", "Csv Tester");
  await pub.fill("#contact-form-email", "csv@test.local");
  await pub.fill("#contact-form-phone", "98200 11223");
  await pub.fill("#contact-form-company", "Zenith Admin Test");
  await pub.fill("#contact-form-projectLocation", "=SUM(1+1)*cmd");
  await pub.waitForTimeout(2600); // the form's time trap
  await Promise.all([
    pub.waitForURL("**/thank-you"),
    pub.click("form.enquiry-form button[type=submit]"),
  ]);
  await pubCtx.close();

  await p.goto("/admin/enquiries");
  check("new enquiry visible in admin list", (await p.content()).includes("Zenith Admin Test"));
  await p.fill("#q", "zenith");
  await p.click("form[role=search] button[type=submit]");
  await p.waitForURL(/q=zenith/);
  check("search filter works", (await p.locator("table.admin-table tbody tr").count()) === 1);
  await p.click("table.admin-table tbody tr a");
  await p.waitForURL(/\/admin\/enquiries\/c/);
  await p.selectOption("#status", "CONTACTED");
  await p.getByRole("button", { name: "Save", exact: true }).click();
  await p.waitForSelector(".alert-success");
  await p.fill("#body", "Called the client, site visit on Monday.");
  await p.getByRole("button", { name: "Add note", exact: true }).click();
  await p.waitForSelector("text=site visit on Monday");
  await p.reload();
  check("status change persisted", (await p.textContent(".status-badge")).trim() === "CONTACTED");
  check("note saved with author", (await p.content()).includes(USERS.admin.name));
});

test("CSV export", async () => {
  await p.goto("/admin/enquiries");
  const [dl] = await Promise.all([
    p.waitForEvent("download"),
    p.getByRole("link", { name: "Export CSV" }).click(),
  ]);
  const csv = fs.readFileSync(await dl.path(), "utf8");
  check(
    "CSV has BOM + header",
    csv.charCodeAt(0) === 0xfeff && csv.includes('"Received","Status","Name"'),
  );
  check("CSV neutralises formula injection", csv.includes(`"'=SUM(1+1)*cmd"`));
  check("CSV contains UTM source", csv.includes('"newsletter"'));
});

test("category edit → public page", async () => {
  await p.goto("/admin/categories");
  await p.getByRole("link", { name: "Braille Signs" }).first().click();
  await p.fill("#name", "Braille & Tactile Signs");
  await p.getByRole("button", { name: "Save changes", exact: true }).click();
  await p.waitForSelector(".alert-success");
  check(
    "category rename shows on public page (revalidateTag)",
    await eventually("/solutions/braille-signs", (h) => h.includes("Braille &amp; Tactile Signs")),
  );
  check(
    "…and in the header menu of other pages",
    await eventually("/about", (h) => h.includes("Braille &amp; Tactile Signs")),
  );
});

test("category validation", async () => {
  await p.fill("#features", "");
  await p.$eval("#features", (el) => el.removeAttribute("required"));
  await p.getByRole("button", { name: "Save changes", exact: true }).click();
  await p.waitForSelector(".alert-danger");
  check(
    "empty features rejected by server validation",
    (await p.textContent(".alert-danger")).includes("features"),
  );
});

test("gallery order / cover / remove", async () => {
  await p.goto("/admin/categories");
  await p.getByRole("link", { name: "Road Safety Products" }).first().click();
  await p.waitForSelector(".image-manager__item");
  const firstAlt = await p.locator(".image-manager__item textarea").first().inputValue();
  const before = await p.locator(".image-manager__item").count();
  await p.locator(".image-manager__item").first().locator("button[aria-label='Move down']").click();
  await p
    .waitForFunction(
      (alt) => document.querySelectorAll(".image-manager__item textarea")[1]?.value === alt,
      firstAlt,
    )
    .catch(() => {});
  const secondAlt = await p.locator(".image-manager__item textarea").nth(1).inputValue();
  check("move down reorders gallery", secondAlt === firstAlt);
  const newFirstAlt = await p.locator(".image-manager__item textarea").first().inputValue();
  const esc = (t) => t.replace(/&/g, "&amp;");
  // Compare inside the gallery only: since task 03 the hero shows the chosen cover (R-8.2),
  // which does not move with the gallery order.
  check(
    "public gallery order follows admin",
    await eventually("/solutions/road-safety-products", (h) => {
      const gallery = h.slice(h.indexOf("Our work on site"));
      const a = gallery.indexOf(esc(newFirstAlt));
      const b = gallery.indexOf(esc(firstAlt));
      return a !== -1 && b !== -1 && a < b;
    }),
  );
  p.once("dialog", (d) => d.accept());
  await p
    .locator(".image-manager__item")
    .last()
    .locator("button[aria-label='Remove photo']")
    .click();
  await p.waitForFunction(
    (n) => document.querySelectorAll(".image-manager__item").length === n - 1,
    before,
  );
  check(
    "remove photo (with confirm)",
    (await p.locator(".image-manager__item").count()) === before - 1,
  );
  await p.locator(".image-manager__item").nth(2).getByText("Set cover").click();
  const coverShown = await p
    .waitForFunction(
      () =>
        document.querySelectorAll(".image-manager__item")[2]?.querySelector(".badge")
          ?.textContent === "Cover",
    )
    .then(() => true)
    .catch(() => false);
  check("set cover", coverShown);
  check(
    "upload disabled with notice when Cloudinary not configured",
    (await p.content()).includes("Photo uploads need Cloudinary"),
  );
});

test("alt text validation", async () => {
  const item = p.locator(".image-manager__item").first();
  await item.locator("textarea").fill("abc");
  await item.getByText("Save").click();
  await item.locator(".alert-danger").waitFor();
  check(
    "too-short alt text rejected",
    (await item.locator(".alert-danger").textContent()).includes("Alt text"),
  );
});

test("projects CRUD", async () => {
  await p.goto("/admin/projects/new");
  await p.fill("#title", "CCI Residential Tower, Kandivali");
  await p.fill("#clientName", "CCI");
  await p.fill("#city", "Mumbai");
  await p.fill("#year", "2024");
  await p.check("text=Tailor-made Signage");
  await p.check("text=General Signs");
  await p.getByRole("button", { name: "Create project", exact: true }).click();
  await p.waitForURL(/\/admin\/projects\/c.*created=1/);
  check(
    "project created with auto slug",
    await eventually("/projects/cci-residential-tower-kandivali", (h) =>
      h.includes("CCI Residential Tower, Kandivali"),
    ),
  );
  check(
    "project listed on public /projects",
    await eventually(
      "/projects",
      (h) => h.includes("Featured projects") && h.includes("CCI Residential Tower"),
    ),
  );
  check(
    "project in sitemap",
    await eventually("/sitemap.xml", (h) =>
      h.includes("/projects/cci-residential-tower-kandivali"),
    ),
  );
  const html = await (await fetch(`${base}/projects/cci-residential-tower-kandivali`)).text();
  check(
    "project page shows linked solutions",
    html.includes("/solutions/tailor-made-signage") && html.includes("Solutions used"),
  );
  // duplicate title → unique slug
  await p.goto("/admin/projects/new");
  await p.fill("#title", "CCI Residential Tower, Kandivali");
  await p.getByRole("button", { name: "Create project", exact: true }).click();
  await p.waitForURL(/created=1/);
  check(
    "duplicate title gets unique slug",
    await eventually("/projects/cci-residential-tower-kandivali-2", (h) =>
      h.includes("CCI Residential Tower"),
    ),
  );
  p.once("dialog", (d) => d.accept());
  await Promise.all([
    p.waitForURL(/deleted=1/),
    p.getByRole("button", { name: "Delete project" }).click(),
  ]);
  const res = await fetch(`${base}/projects/cci-residential-tower-kandivali-2`);
  check("deleted project page 404s", res.status === 404);
});

test("FAQ + settings → public", async () => {
  await p.goto("/admin/faqs");
  await p.fill("#new-q", "Do you offer site surveys in Pune?");
  await p.fill("#new-a", "Yes, our team visits sites across Maharashtra.");
  await p.getByRole("button", { name: "Add FAQ", exact: true }).click();
  await p.waitForSelector(".alert-success");
  // Home FAQs are shown on the Contact page since 14 Oct.
  check(
    "new home FAQ appears on contact page",
    await eventually("/contact", (h) => h.includes("site surveys in Pune")),
  );
  await p.goto("/admin/settings");
  await p.fill("#phone", "+91 98765 43210");
  await p.fill("#whatsapp", "919876543210");
  await p.fill("#mapEmbedUrl", "https://evil.example.com/embed");
  await p.getByRole("button", { name: "Save settings", exact: true }).click();
  await p.waitForSelector(".alert-danger");
  check(
    "non-Google map URL rejected",
    (await p.textContent(".alert-danger")).includes("Google Maps"),
  );
  await p.fill("#mapEmbedUrl", "");
  await p.getByRole("button", { name: "Save settings", exact: true }).click();
  await p.waitForSelector(".alert-success");
  check(
    "phone shows on public site (footer + floating button)",
    await eventually(
      "/contact",
      (h) => h.includes("tel:+919876543210") && h.includes("wa.me/919876543210"),
    ),
  );
});

test("editor role limits", async ({ browser }) => {
  const c = await browser.newContext();
  const e = await c.newPage();
  await login(e, USERS.editor.email, USERS.editor.password);
  await e.waitForURL("**/admin");
  check("editor sidebar hides admin-only section", !(await e.content()).includes("Site settings"));
  await e.goto("/admin/settings");
  check("editor blocked from settings", e.url().includes("denied=1"));
  await e.goto("/admin/users");
  check("editor blocked from users", e.url().includes("denied=1"));
  await c.close();
});

test("users safety rules", async () => {
  await p.goto("/admin/users");
  const row = p.locator("div.border-top", { hasText: USERS.admin.email });
  await row.locator("input[name=isActive]").uncheck();
  await row.getByText("Save").click();
  await row.locator(".alert-danger").waitFor();
  check(
    "admin cannot deactivate themself",
    (await row.locator(".alert-danger").textContent()).includes("cannot deactivate yourself"),
  );
});

test("password change invalidates other sessions", async ({ browser }) => {
  const old = (await admin.cookies()).find((c) => c.name === "im_admin_token");
  const other = await browser.newContext();
  await other.addCookies([{ ...old }]);
  const o = await other.newPage();
  await o.goto("/admin");
  check("copied session works before change", new URL(o.url()).pathname === "/admin");
  await p.goto("/admin/account");
  await p.fill("#current", USERS.admin.password);
  await p.fill("#password", "Admin-Test-Pass-2");
  await p.fill("#confirm", "Admin-Test-Pass-2");
  await p.getByRole("button", { name: "Update password", exact: true }).click();
  await p.waitForSelector(".alert-success");
  await o.goto("/admin");
  check("old session rejected after password change", new URL(o.url()).pathname === "/admin/login");
  await p.goto("/admin");
  check("current browser stays signed in", new URL(p.url()).pathname === "/admin");
  await other.close();
});

test("audit log + logout", async () => {
  await p.goto("/admin/audit");
  const html = await p.content();
  check(
    "audit log records actions",
    ["LOGIN", "LOCKOUT", "EXPORT", "PASSWORD_CHANGE", "REMOVE_IMAGE"].every((a) =>
      html.includes(a),
    ),
  );
  await p.getByRole("button", { name: "Sign out", exact: true }).click();
  await p.waitForURL(/\/admin\/login/);
  await p.goto("/admin");
  check("after sign-out /admin requires login", new URL(p.url()).pathname === "/admin/login");
});

test("forged cookie", async ({ browser }) => {
  const c = await browser.newContext();
  await c.addCookies([
    { name: "im_admin_token", value: "eyJ1aWQiOiJ4Iiwicm9sZSI6IkFETUlOIn0.forged", url: base },
  ]);
  const q = await c.newPage();
  const res = await q.goto("/admin/users");
  check("forged session cookie rejected", new URL(q.url()).pathname === "/admin/login" && res.ok());
  const exp = await fetch(`${base}/admin/enquiries/export`, { redirect: "manual" });
  check(
    "CSV export without session → login/401",
    exp.status === 401 || (exp.status >= 300 && exp.status < 400),
  );
  await c.close();
  expect(jsErrors, "JavaScript errors in the admin").toEqual([]);
});
