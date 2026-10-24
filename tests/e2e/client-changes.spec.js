// Task 07 (part 1): admin-managed home banner, visitor auto-reply, and honeypot hits
// not counting as GA4 conversions.
import { test, expect } from "@playwright/test";
import { featured } from "../../content/gallery.js";
import { hashPassword } from "../../src/server/auth/password.js";
import { resetLimits, testPrisma } from "./db.js";
import { startMailMock } from "./mail-mock.js";

test.describe.configure({ mode: "serial" });

const EDITOR = { email: "banner-editor@test.local", name: "Banner Editor", role: "EDITOR" };
const PASSWORD = "Banner-Test-Pass-1";
const enc = (url) => encodeURIComponent(url);
let mail;

/**
 * @param {import("@playwright/test").Page} page
 * @returns {Promise<void>}
 */
async function login(page) {
  await resetLimits();
  await page.goto("/admin/login");
  await page.fill("#email", EDITOR.email);
  await page.fill("#password", PASSWORD);
  await Promise.all([page.waitForURL("**/admin"), page.click("button[type=submit]")]);
}

/**
 * Fills and sends the contact-page enquiry form like a visitor.
 * @param {import("@playwright/test").Page} page
 * @param {{ name: string, email: string, honeypot?: string }} who
 */
async function sendEnquiry(page, { name, email, honeypot }) {
  await resetLimits();
  await page.goto("/contact");
  const form = page.locator("form.enquiry-form");
  await form.locator('[name="name"]').fill(name);
  await form.locator('[name="email"]').fill(email);
  await form.locator('[name="phone"]').fill("98200 11223");
  if (honeypot) {
    await page.evaluate((v) => {
      document.querySelector('form.enquiry-form input[name="website"]').value = v;
    }, honeypot);
  }
  await page.waitForTimeout(2600); // the form's time trap
  await Promise.all([
    page.waitForURL("**/thank-you"),
    page.click("form.enquiry-form button[type=submit]"),
  ]);
}

/**
 * GA4 conversions queued on this page.
 * @param {import("@playwright/test").Page} page
 * @returns {Promise<number>}
 */
const leadEvents = (page) =>
  page.evaluate(
    () =>
      (window.dataLayer ?? [])
        .map((a) => Array.from(a))
        .filter((a) => a[0] === "event" && a[1] === "generate_lead").length,
  );

/**
 * The URL the home banner image actually loaded at the current viewport.
 * @param {import("@playwright/test").Page} page
 */
async function bannerSrc(page) {
  await page.goto("/");
  const img = page.locator(".hero-split__media img").first();
  await expect(img).toBeVisible();
  await expect.poll(() => img.evaluate((el) => el.complete && el.currentSrc)).toBeTruthy();
  return img.evaluate((el) => el.currentSrc);
}

test.beforeAll(async () => {
  const prisma = testPrisma();
  const passwordHash = await hashPassword(PASSWORD);
  await prisma.adminUser.upsert({
    where: { email: EDITOR.email },
    create: { ...EDITOR, passwordHash },
    update: { ...EDITOR, passwordHash, isActive: true },
  });
  await prisma.siteSetting.deleteMany({ where: { key: "home.banner" } });
  await prisma.$disconnect();
  mail = await startMailMock();
});

test.afterAll(async () => {
  await mail?.close();
});

// ── Banner ────────────────────────────────────────────────────────────

test("editors open /admin/banner: sizes for the client and the add-a-slide button", async ({
  page,
}) => {
  await login(page);
  const nav = page.getByRole("navigation", { name: "Admin" }).first();
  await nav.getByRole("link", { name: "Home banner" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Home banner" })).toBeVisible();
  const sizes = page.locator("table.admin-table");
  await expect(sizes).toContainText("1920 × 1720 px");
  await expect(sizes).toContainText("1080 × 1080 px");
  // Nothing uploaded yet: the page offers to add the first slide.
  await expect(page.getByText("No slides yet")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add a slide" })).toBeVisible();
  // No Cloudinary keys in tests: the page says so instead of showing a broken upload.
  await expect(page.getByText("Banner uploads need Cloudinary")).toBeVisible();
});

test("without an uploaded banner the home page keeps the old photo", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".hero-split__media picture")).toHaveCount(0);
  expect(await bannerSrc(page)).toContain(enc(featured.hero.src));
});

test("the banner shows desktop on wide screens and mobile on phones; remove falls back", async ({
  browser,
  page,
}) => {
  // Two seeded photos stand in for the client's banner files (uploads need Cloudinary). The
  // older single-banner shape is stored on purpose: it must still work as slide 1.
  const prisma = testPrisma();
  const [desktop, mobile] = await prisma.mediaAsset.findMany({
    where: { url: { not: featured.hero.src } },
    orderBy: { url: "asc" },
    take: 2,
  });
  await prisma.siteSetting.upsert({
    where: { key: "home.banner" },
    create: {
      key: "home.banner",
      value: { desktopAssetId: desktop.id, mobileAssetId: mobile.id, alt: null },
    },
    update: { value: { desktopAssetId: desktop.id, mobileAssetId: mobile.id, alt: null } },
  });
  await prisma.$disconnect();

  // Saving in admin refreshes the home page.
  await login(page);
  await page.goto("/admin/banner");
  await expect(
    page.locator(`[data-slide="0"] [data-banner-slot=desktop] img[src*="${enc(desktop.url)}"]`),
  ).toHaveCount(1);
  await expect(
    page.locator(`[data-slide="0"] [data-banner-slot=mobile] img[src*="${enc(mobile.url)}"]`),
  ).toHaveCount(1);
  await page.fill("#banner-alt-0", "Insta Mark wayfinding signage banner");
  await page.getByRole("button", { name: "Save alt text", exact: true }).click();
  await expect(page.locator(".alert-success")).toBeVisible();

  const wide = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    expect(await bannerSrc(wide)).toContain(enc(desktop.url));
    await expect(wide.locator(".hero-split__media picture source")).toHaveAttribute(
      "media",
      "(min-width: 992px)",
    );
    await expect(wide.locator(".hero-split__media img")).toHaveAttribute(
      "alt",
      "Insta Mark wayfinding signage banner",
    );
    expect(await bannerSrc(phone)).toContain(enc(mobile.url));

    // Remove mobile → phones get the desktop banner.
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Remove mobile photo" }).click();
    await expect(page.locator('[data-slide="0"] [data-banner-slot=mobile]')).toContainText(
      "No mobile banner yet",
    );
    expect(await bannerSrc(phone)).toContain(enc(desktop.url));

    // Remove desktop too → the old photo is back everywhere.
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Remove desktop photo" }).click();
    await expect(page.locator('[data-slide="0"] [data-banner-slot=desktop]')).toContainText(
      "No desktop banner yet",
    );
    await wide.goto("/");
    await expect(wide.locator(".hero-split__media picture")).toHaveCount(0);
    expect(await bannerSrc(wide)).toContain(enc(featured.hero.src));
  } finally {
    await wide.close();
    await phone.close();
  }
});

// ── Auto-reply and GA4 ────────────────────────────────────────────────

test("a visitor gets the auto-reply and the visit counts as one GA4 conversion", async ({
  page,
}) => {
  const visitor = "visitor-reply@test.local";
  await sendEnquiry(page, { name: "Asha Rao", email: visitor });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Thank you");

  await expect
    .poll(() => mail.sent.filter((m) => m.to.includes(visitor)).length, { timeout: 15_000 })
    .toBe(1);
  const reply = mail.sent.find((m) => m.to.includes(visitor));
  expect(reply.subject).toBe("We have received your enquiry — Insta Mark");
  expect(reply.from).toBe("Insta Mark Website <website@test.local>");
  expect(reply.reply_to).toBe("sales@test.local");
  expect(reply.text).toContain("Hello Asha Rao,");
  expect(mail.sent.some((m) => m.to.includes("sales@test.local"))).toBe(true);

  expect(await leadEvents(page)).toBe(1);
  await page.reload(); // a reload is not a new lead
  expect(await leadEvents(page)).toBe(0);
});

test("when the auto-reply fails, the thank-you page still appears and the lead is stored", async ({
  page,
}) => {
  const visitor = "visitor-fail@test.local";
  mail.failWhen((m) => m.to.includes(visitor));
  try {
    await sendEnquiry(page, { name: "Ravi Kumar", email: visitor });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Thank you");
    await expect
      .poll(() => mail.sent.filter((m) => m.to.includes(visitor)).length, { timeout: 15_000 })
      .toBe(1); // it was tried, and failed
    const prisma = testPrisma();
    const stored = await prisma.enquiry.count({ where: { email: visitor } });
    await prisma.$disconnect();
    expect(stored).toBe(1);
  } finally {
    mail.failWhen(() => false);
  }
});

test("a honeypot hit reaches the thank-you page but is no GA4 conversion and gets no email", async ({
  page,
}) => {
  const bot = "bot-honeypot@test.local";
  await sendEnquiry(page, { name: "Spam Bot", email: bot, honeypot: "https://spam.example" });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Thank you");
  expect(await leadEvents(page)).toBe(0);
  await page.waitForTimeout(1500);
  expect(mail.sent.some((m) => m.to.includes(bot))).toBe(false);

  const prisma = testPrisma();
  const stored = await prisma.enquiry.count({ where: { email: bot } });
  await prisma.$disconnect();
  expect(stored).toBe(0);

  // Opening the thank-you page directly is no conversion either.
  await page.goto("/thank-you");
  expect(await leadEvents(page)).toBe(0);
});
