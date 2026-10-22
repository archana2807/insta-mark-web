// Task 10h: the home banner is a slider of 1–3 slides with a "01 — 03" counter, a pause
// button (WCAG 2.2.2), no auto-play for reduced motion, and admin-controlled slides.
import { test, expect } from "@playwright/test";
import { hashPassword } from "../../src/server/auth/password.js";
import { resetLimits, testPrisma } from "./db.js";

test.describe.configure({ mode: "serial" });

const EDITOR = { email: "slider-editor@test.local", name: "Slider Editor", role: "EDITOR" };
const PASSWORD = "Slider-Test-Pass-1";
const TITLE = "Architectural Signage & Road Safety";

/** @param {import("@playwright/test").Page} page */
async function login(page) {
  await resetLimits();
  await page.goto("/admin/login");
  await page.fill("#email", EDITOR.email);
  await page.fill("#password", PASSWORD);
  await Promise.all([page.waitForURL("**/admin"), page.click("button[type=submit]")]);
}

/** @param {import("@playwright/test").Page} page */
const activeSlide = (page) =>
  page.locator(".hero-slider__slide.is-active").getAttribute("data-slide");

/** Seeds the banner setting, then saves slide 1's alt text so the site refreshes its cache. */
async function seedAndRefresh(page, slides) {
  const prisma = testPrisma();
  const value = slides ? { slides } : null;
  if (value) {
    await prisma.siteSetting.upsert({
      where: { key: "home.banner" },
      create: { key: "home.banner", value },
      update: { value },
    });
  } else {
    await prisma.siteSetting.deleteMany({ where: { key: "home.banner" } });
  }
  await prisma.$disconnect();
  await login(page);
  await page.goto("/admin/banner");
  if (slides) {
    await page.fill("#banner-alt-0", "Insta Mark banner photo");
    await page.getByRole("button", { name: "Save alt text" }).first().click();
    await expect(page.locator(".alert-success").first()).toBeVisible();
  } else {
    // no slides: any admin banner change would do; the cache is still fresh for the default
  }
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
});

test.afterAll(async () => {
  const prisma = testPrisma();
  await prisma.siteSetting.deleteMany({ where: { key: "home.banner" } });
  await prisma.$disconnect();
});

test("by default the banner is a slider of the three current photos with a 01 — 03 counter", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const slider = page.locator(".hero-slider");
  await expect(slider).toBeVisible();
  await expect(slider.locator(".hero-slider__slide")).toHaveCount(3);
  await expect(slider.locator(".hero-slider__count").first()).toHaveText("01");
  await expect(slider.locator(".hero-slider__count").last()).toHaveText("03");
  expect(await activeSlide(page)).toBe("0");

  // The first photo is the priority image; the others load lazily.
  const imgs = slider.locator("img");
  await expect(imgs.nth(0)).toHaveAttribute("fetchpriority", "high");
  await expect(imgs.nth(1)).toHaveAttribute("loading", "lazy");
  await expect(imgs.nth(2)).toHaveAttribute("loading", "lazy");

  // Only the active slide is exposed to assistive technology.
  await expect(slider.locator(".hero-slider__slide[inert]")).toHaveCount(2);
});

test("the arrows change the slide; the headline and tagline stay the same", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Next slide" }).click();
  await expect.poll(() => activeSlide(page)).toBe("1");
  await expect(page.locator(".hero-slider__count").first()).toHaveText("02");
  await page.getByRole("button", { name: "Next slide" }).click();
  await expect.poll(() => activeSlide(page)).toBe("2");
  await page.getByRole("button", { name: "Next slide" }).click();
  await expect.poll(() => activeSlide(page)).toBe("0"); // wraps round
  await page.getByRole("button", { name: "Previous slide" }).click();
  await expect.poll(() => activeSlide(page)).toBe("2");

  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveText(TITLE);
  await expect(page.locator(".hero-split__vertical .visually-hidden")).toHaveText(
    "Signage That Guides. Safety That Lasts.",
  );
});

test("it plays by itself and the pause button stops it (WCAG 2.2.2)", async ({ page }) => {
  await page.clock.install();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /slideshow/ });
  await expect(toggle).toHaveAccessibleName("Pause the slideshow");
  expect(await activeSlide(page)).toBe("0");

  await page.clock.fastForward(6500);
  await expect.poll(() => activeSlide(page)).toBe("1");

  await toggle.click();
  await expect(toggle).toHaveAccessibleName("Play the slideshow");
  await page.clock.fastForward(20_000);
  expect(await activeSlide(page)).toBe("1"); // paused: it did not move

  await toggle.click(); // play again
  await expect(toggle).toHaveAccessibleName("Pause the slideshow");
  await page.clock.fastForward(6500);
  await expect.poll(() => activeSlide(page)).toBe("2");
});

test("with reduced motion it does not play by itself", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: /slideshow/ })).toHaveAccessibleName(
    "Play the slideshow",
  );
  await page.clock.fastForward(30_000);
  expect(await activeSlide(page)).toBe("0");
});

test("with one slide there is no slider and no counter, just the photo (10h)", async ({ page }) => {
  const prisma = testPrisma();
  const [photo] = await prisma.mediaAsset.findMany({ orderBy: { url: "asc" }, take: 1 });
  await prisma.$disconnect();
  await seedAndRefresh(page, [{ desktopAssetId: photo.id, mobileAssetId: null, alt: null }]);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".hero-split__media picture")).toHaveCount(1);
  await expect(page.locator(".hero-slider")).toHaveCount(0);
  await expect(page.locator(".hero-slider__controls")).toHaveCount(0);
});

test("admin: two slides make a slider, the order can be changed, an empty slide is skipped", async ({
  page,
}) => {
  const prisma = testPrisma();
  const [a, b] = await prisma.mediaAsset.findMany({ orderBy: { url: "asc" }, take: 2 });
  await prisma.$disconnect();
  await seedAndRefresh(page, [
    { desktopAssetId: a.id, mobileAssetId: null, alt: null },
    { desktopAssetId: b.id, mobileAssetId: null, alt: null },
  ]);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".hero-slider__slide")).toHaveCount(2);
  await expect(page.locator(".hero-slider__count").last()).toHaveText("02");
  const firstSrc = () =>
    page.locator('.hero-slider__slide[data-slide="0"] img').evaluate((el) => el.getAttribute("src"));
  const before = await firstSrc();

  // Move slide 1 later: the photos swap places on the website.
  await page.goto("/admin/banner");
  await page.locator('[data-slide="0"]').getByRole("button", { name: "Move later" }).click();
  await expect(page.locator(".alert-success").first()).toBeVisible();
  await page.goto("/");
  await expect.poll(firstSrc).not.toBe(before);

  // Add a third, still empty slide: it is listed in admin but skipped on the website.
  await page.goto("/admin/banner");
  await page.getByRole("button", { name: "Add a slide" }).click();
  await expect(page.locator('[data-slide="2"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Add a slide" })).toHaveCount(0); // at the limit
  await page.goto("/");
  await expect(page.locator(".hero-slider__slide")).toHaveCount(2);

  // Remove the empty slide again.
  await page.goto("/admin/banner");
  page.once("dialog", (d) => d.accept());
  await page.locator('[data-slide="2"]').getByRole("button", { name: "Remove slide" }).click();
  await expect(page.locator('[data-slide="2"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add a slide" })).toBeVisible();
});
