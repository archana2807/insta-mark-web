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
  // Theme look: equal columns across the page, each logo centred in its column.
  const centres = await imgs.evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return r.left + r.width / 2;
    }),
  );
  const steps = centres.slice(1).map((c, i) => c - centres[i]);
  for (const step of steps) expect(Math.abs(step - steps[0])).toBeLessThan(4);
  expect(steps[0]).toBeGreaterThan(200);

  // Directly after the banner, before the About intro.
  const hero = await page.locator(".hero-split").boundingBox();
  const band = await logos.boundingBox();
  expect(band.y).toBeGreaterThanOrEqual(hero.y + hero.height - 1);
  expect(band.y - (hero.y + hero.height)).toBeLessThan(40);
});

test("home About: three overlapping photos on the left, the company text on the right", async ({
  page,
}) => {
  await page.goto("/");
  const about = page.locator("#about-title").locator("xpath=ancestor::section[1]");
  const imgs = about.locator(".about-collage__item img");
  await expect(imgs).toHaveCount(3);
  await expect(about.locator(".eyebrow")).toHaveText("About Insta Mark");
  await expect(about.getByRole("link", { name: "More about us" })).toBeVisible();
  await expect(about.getByRole("link", { name: "Our solutions" })).toBeVisible();
  const text = await about.locator("#about-title").boundingBox();
  const first = await about.locator(".about-collage").boundingBox();
  expect(first.x + first.width).toBeLessThanOrEqual(text.x + 1);
  // The photos overlap each other (a collage, not three separate tiles). They reveal on
  // scroll, so scroll to them and wait until the animation has settled.
  await about.locator(".about-collage").scrollIntoViewIfNeeded();
  const overlapCount = () =>
    about.locator(".about-collage__item").evaluateAll((items) => {
      const r = items.map((el) => el.getBoundingClientRect());
      const hit = (a, b) =>
        a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      return [hit(r[0], r[1]), hit(r[0], r[2]), hit(r[1], r[2])].filter(Boolean).length;
    });
  await expect.poll(overlapCount, { timeout: 5000 }).toBeGreaterThanOrEqual(2);
});

test("no small label above a headline on any public page (10b)", async ({ page }) => {
  await page.goto("/solutions");
  const solution = await page.locator('a[href^="/solutions/"]').first().getAttribute("href");
  const routes = [
    "/",
    "/about",
    "/solutions",
    solution,
    "/projects",
    "/contact",
    "/privacy-policy",
  ];
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();
    // The only small label left is the one in the home About block, as in the theme.
    const labels = await page
      .locator(".eyebrow")
      .evaluateAll((els) => els.filter((el) => !el.closest(".about-short")).length);
    expect(labels, `${route} still has a small label`).toBe(0);
  }
});

test("the Solutions dropdown opens at the right side of the page, like the theme", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Solutions" }).click();
  const menu = page.locator(".mega-menu");
  await expect(menu).toBeVisible();
  const box = await menu.boundingBox();
  const viewport = page.viewportSize();
  // Flush with the nav's right gutter (3 rem = 48 px), and in the right half of the page.
  expect(Math.abs(viewport.width - (box.x + box.width) - 48)).toBeLessThan(24);
  expect(box.x).toBeGreaterThan(viewport.width / 4);
  // Under the header, not on top of it.
  const header = await page.locator(".site-header").boundingBox();
  expect(box.y).toBeGreaterThanOrEqual(header.y + header.height - 2);
});

test("the footer carries the call to action on every page; no separate CTA panel (10d)", async ({
  page,
}) => {
  for (const route of ["/", "/about", "/projects", "/solutions"]) {
    await page.goto(route);
    await expect(page.locator(".cta-panel"), `${route} still has a CTA panel`).toHaveCount(0);
    const footer = page.locator(".site-footer");
    await expect(footer.getByRole("heading", { level: 2 })).toContainText(
      /Build Smarter Spaces Together/,
    );
    await expect(footer.getByRole("link", { name: /Get a Free Consultation/ })).toBeVisible();
    await expect(footer.getByRole("link", { name: /Contact Our Team/ })).toBeVisible();
    // Solutions and company links stay on the right.
    await expect(footer.getByText("Company", { exact: true })).toBeVisible();
    // Social icons are shown only for links the client has set (none yet: hidden, not fake).
    await expect(footer.locator(".site-footer__social")).toHaveCount(0);
  }
});

test("home sections follow the client's order and look (10c)", async ({ page }) => {
  await page.goto("/");
  // Order: logos → About → scrolling line → products → industries → process → trusted by.
  const ids = [
    ".project-logos",
    "#about-title",
    ".text-marquee",
    "#solutions-title",
    "#industries-title",
    "#process-title",
    "#trusted-title",
  ];
  const tops = [];
  for (const id of ids) tops.push((await page.locator(id).first().boundingBox()).y);
  expect([...tops].sort((a, b) => a - b)).toEqual(tops);

  // The scrolling line moves (a CSS animation) and is read once by screen readers.
  const marquee = page.locator(".text-marquee");
  await expect(marquee.locator("p.visually-hidden")).toHaveText(
    "Signage and Road Safety Solutions",
  );
  expect(
    await marquee
      .locator(".text-marquee__track")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("text-marquee");

  // Products: one photo tile per category, each a link to its solution page.
  const tiles = page.locator(".product-mosaic__tile");
  await expect(tiles).toHaveCount(8);
  expect(await tiles.first().getAttribute("href")).toMatch(/^\/solutions\//);

  // Trusted by: logos, not photos.
  const wall = page.locator(".logo-wall img");
  expect(await wall.count()).toBeGreaterThanOrEqual(8);
  await expect(page.locator("#trusted-title")).toHaveText("Trusted by Leading Brands");
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
