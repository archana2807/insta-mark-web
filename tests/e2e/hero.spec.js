// Home banner (client feedback, 21 Oct 2026; Crafto "Branding Agency" hero):
// - H1 "Architectural Signage & Road Safety", the page's only H1, running onto the photo;
// - wide screens (≥ 1200 px): the tagline "Signage That Guides. Safety That Lasts." is
//   the vertical label on the left (with a thin line next to the headline);
// - narrower screens (no vertical label, as in the theme): the tagline is a smaller line
//   right under the H1.
// No small label above the headline at any width.
import { test, expect } from "@playwright/test";

const HEADLINE = "Architectural Signage & Road Safety";
const TAGLINE = "Signage That Guides. Safety That Lasts.";

/** @param {import("@playwright/test").Locator} locator */
const fontPx = (locator) =>
  locator.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

test("home banner (desktop): vertical tagline on the left, headline runs onto the photo", async ({
  page,
}) => {
  await page.goto("/");
  const hero = page.locator(".hero-split");
  const headline = hero.locator("h1");
  const vertical = hero.locator(".hero-split__vertical");
  await expect(headline).toHaveText(HEADLINE);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(hero.locator(".eyebrow")).toHaveCount(0);

  // The vertical label shows the tagline; screen readers read it once, as one line.
  await expect(vertical).toBeVisible();
  await expect(vertical.locator(".visually-hidden")).toHaveText(TAGLINE);
  await expect(vertical.locator("[aria-hidden=true]")).toHaveText(TAGLINE);
  expect(await vertical.evaluate((el) => getComputedStyle(el).writingMode)).toBe("vertical-rl");
  await expect(hero.locator(".hero-split__tagline")).toBeHidden(); // shown only below 1200 px

  // Left of the headline, with the thin line between them.
  const v = await vertical.boundingBox();
  const h = await headline.boundingBox();
  expect(v.x + v.width).toBeLessThanOrEqual(h.x);
  expect(await vertical.evaluate((el) => getComputedStyle(el).borderLeftWidth)).toBe("1px");

  // Theme effect: the headline runs past its column onto the photo.
  const media = await hero.locator(".hero-split__media").boundingBox();
  expect(h.x + h.width).toBeGreaterThan(media.x);

  // Hierarchy: the headline is far bigger than the vertical label.
  expect(await fontPx(headline)).toBeGreaterThanOrEqual((await fontPx(vertical)) * 2);
});

test("home banner (desktop): the vertical tagline is fully visible without scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto("/");
  const label = await page.locator(".hero-split__vertical [aria-hidden=true]").boundingBox();
  expect(label.y).toBeGreaterThanOrEqual(0);
  expect(label.y + label.height).toBeLessThanOrEqual(800);
});

test("project logos sit right under the banner: 4–5 logos that load (R-3.10)", async ({ page }) => {
  await page.goto("/");
  const logos = page.locator(".project-logos");
  await expect(logos).toBeVisible();
  const imgs = logos.locator("img");
  const count = await imgs.count();
  expect(count).toBeGreaterThanOrEqual(4);
  expect(count).toBeLessThanOrEqual(5);
  for (let i = 0; i < count; i++) {
    await expect(imgs.nth(i)).toBeVisible();
    await expect(imgs.nth(i)).toHaveAttribute("alt", /\S+ logo$/);
    expect(await imgs.nth(i).evaluate((el) => el.naturalWidth)).toBeGreaterThan(0);
  }
  // Directly after the banner, before the About intro.
  const hero = await page.locator(".hero-split").boundingBox();
  const band = await logos.boundingBox();
  expect(band.y).toBeGreaterThanOrEqual(hero.y + hero.height - 1);
  expect(band.y - (hero.y + hero.height)).toBeLessThan(40);
});

test("home banner (phone): no vertical label; the tagline is a smaller line under the H1", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const hero = page.locator(".hero-split");
  const headline = hero.locator("h1");
  const tagline = hero.locator(".hero-split__tagline");
  await expect(headline).toHaveText(HEADLINE);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(hero.locator(".eyebrow")).toHaveCount(0);
  await expect(hero.locator(".hero-split__vertical")).toBeHidden();

  await expect(tagline).toBeVisible();
  await expect(tagline).toHaveText(TAGLINE);
  await expect(headline.locator("xpath=following-sibling::*[1]")).toHaveText(TAGLINE);
  const h = await headline.boundingBox();
  const t = await tagline.boundingBox();
  expect(t.y).toBeGreaterThanOrEqual(h.y + h.height - 1);
  expect(await fontPx(headline)).toBeGreaterThanOrEqual((await fontPx(tagline)) * 1.5);
});
