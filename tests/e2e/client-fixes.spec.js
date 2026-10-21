// Task 03: the client's four quick fixes (R-3.4, R-1.5, R-5.3, R-8.2).
import { test, expect } from "@playwright/test";
import { hashPassword } from "../../src/server/auth/password.js";
import { resetLimits, testPrisma } from "./db.js";

test.describe.configure({ mode: "serial" });

const ADMIN = { email: "fixes-admin@test.local", name: "Fixes Admin", role: "ADMIN" };
const PASSWORD = "Fixes-Test-Pass-1";
const CATEGORY = { slug: "tailor-made-signage", name: "Tailor-made Signage" };

/**
 * @param {import("@playwright/test").Page} page
 * @returns {Promise<void>}
 */
async function login(page) {
  await resetLimits();
  await page.goto("/admin/login");
  await page.fill("#email", ADMIN.email);
  await page.fill("#password", PASSWORD);
  await Promise.all([page.waitForURL("**/admin"), page.click("button[type=submit]")]);
}

/**
 * Saves the "Founded (year)" setting through the admin form.
 * @param {import("@playwright/test").Page} page
 * @param {string} year "" clears it
 */
async function saveFoundedYear(page, year) {
  await page.goto("/admin/settings");
  await page.fill("#establishedYear", year);
  await page.getByRole("button", { name: "Save settings", exact: true }).click();
  await expect(page.locator(".alert-success")).toBeVisible();
}

/**
 * The next/image URL of a photo contains its original URL, encoded.
 * @param {string} url
 */
const imageWith = (url) => `img[src*="${encodeURIComponent(url)}"]`;

test.beforeAll(async () => {
  const prisma = testPrisma();
  const passwordHash = await hashPassword(PASSWORD);
  await prisma.adminUser.upsert({
    where: { email: ADMIN.email },
    create: { ...ADMIN, passwordHash },
    update: { ...ADMIN, passwordHash, isActive: true },
  });
  await prisma.$disconnect();
});

test("the home banner's vertical label is the tagline, not the old services line", async ({
  page,
}) => {
  // R-3.4 as revised on 21 Oct 2026: the services line is gone; the vertical label now
  // carries the tagline (details in hero.spec.js).
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const hero = page.locator(".hero-split");
  await expect(hero).toBeVisible();
  await expect(hero.locator(".hero-split__vertical .visually-hidden")).toHaveText(
    "Signage That Guides. Safety That Lasts.",
  );
  await expect(hero).not.toContainText(/Signage\s*·\s*Wayfinding/i);

  await page.goto("/about");
  await expect(page.locator(".inner-hero__vertical")).toHaveCount(1);
});

test("the years badge is gone, even when a founding year is set in admin", async ({ page }) => {
  // Removed on 21 Oct 2026: the client confirmed "10+ years" was incorrect.
  await login(page);
  const hero = page.locator(".hero-split");

  for (const year of ["", "2016"]) {
    await saveFoundedYear(page, year);
    await page.goto("/");
    await expect(hero).toBeVisible();
    await expect(hero.locator(".hero-split__badge")).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText(/years of signage expertise/i);
    await expect(hero).not.toContainText(/\d+\+/); // no "10+" style figure in the banner
  }

  await saveFoundedYear(page, ""); // leave the test database as it was
});

test("About 'Why Choose Us' shows the six items from the client's About text", async ({ page }) => {
  await page.goto("/about");
  const list = page.locator("section[aria-labelledby=why-title] .row-list li");
  await expect(list.locator("h3")).toHaveText([
    "End-to-end project execution",
    "In-house design and manufacturing",
    "Premium materials",
    "Nationwide installation",
    "Tailor-made solutions",
    "Strict quality control",
  ]);
  await expect(list.locator("p")).toHaveCount(0); // no invented descriptions
});

test("the cover chosen in admin shows on the category hero, home grid and Solutions page", async ({
  page,
}) => {
  const prisma = testPrisma();
  const category = await prisma.category.findUniqueOrThrow({
    where: { slug: CATEGORY.slug },
    select: {
      id: true,
      heroImageId: true,
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { assetId: true, asset: { select: { url: true } } },
      },
    },
  });
  await prisma.$disconnect();
  expect(category.images.length).toBeGreaterThanOrEqual(3);
  const original = category.images.findIndex((i) => i.assetId === category.heroImageId);
  const pick = original === 2 ? 1 : 2; // any photo that is not the current cover
  const coverUrl = category.images[pick].asset.url;

  await login(page);
  await page.goto(`/admin/categories/${category.id}`);
  const items = page.locator(".image-manager__item");
  await items.nth(pick).getByText("Set cover").click();
  await expect(items.nth(pick).locator(".badge")).toHaveText("Cover");

  try {
    // Category hero
    await page.goto(`/solutions/${CATEGORY.slug}`);
    await expect(page.locator(".inner-hero").locator(imageWith(coverUrl))).toHaveCount(1);

    // Home product mosaic
    await page.goto("/");
    const card = page.locator(`a.product-mosaic__tile[href="/solutions/${CATEGORY.slug}"]`);
    await expect(card.locator(imageWith(coverUrl))).toHaveCount(1);

    // Solutions page: the big photo of that solution's row
    await page.goto("/solutions");
    const row = page.locator(`article.service-block[aria-labelledby="svc-${CATEGORY.slug}"]`);
    await expect(row.locator("img").first()).toHaveAttribute(
      "src",
      new RegExp(encodeURIComponent(coverUrl).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  } finally {
    // Put the original cover back.
    await page.goto(`/admin/categories/${category.id}`);
    if (original >= 0) {
      await items.nth(original).getByText("Set cover").click();
      await expect(items.nth(original).locator(".badge")).toHaveText("Cover");
    }
  }
});
