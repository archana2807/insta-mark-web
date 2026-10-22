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
  // The text itself lies clearly on the photo (not just one stray letter): 100 px or more.
  const textRight = await headline.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return Math.max(...[...range.getClientRects()].map((r) => r.right));
  });
  expect(textRight - media.x).toBeGreaterThanOrEqual(100);

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
  await expect(about.locator("#about-title")).toHaveText(/Creating Signage/);
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
    // No small label above any headline, on the home page too (client, 22 Oct 2026).
    const labels = await page.locator(".eyebrow").count();
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

test("the footer carries the call to action text on every page; no logo, no buttons, no CTA panel (10d)", async ({
  page,
}) => {
  for (const route of ["/", "/about", "/projects", "/solutions"]) {
    await page.goto(route);
    await expect(page.locator(".cta-panel"), `${route} still has a CTA panel`).toHaveCount(0);
    const footer = page.locator(".site-footer");
    await expect(footer.getByRole("heading", { level: 2 })).toContainText(
      /Build Smarter Spaces Together/,
    );
    // No brand logo and no call-to-action buttons in the footer (client, 21 Oct 2026).
    await expect(footer.locator(".brand-logo")).toHaveCount(0);
    await expect(footer.getByRole("link", { name: /Get a Free Consultation/ })).toHaveCount(0);
    await expect(footer.getByRole("link", { name: /Contact Our Team/ })).toHaveCount(0);
    // Solutions and company links stay on the right.
    await expect(footer.getByText("Company", { exact: true })).toBeVisible();
    // Contact details and four social icons (sample values until the client's are entered).
    await expect(footer.getByRole("link", { name: "info@example.com" })).toBeVisible();
    await expect(footer.getByText("Head office")).toBeVisible();
    await expect(footer.locator(".site-footer__social a")).toHaveCount(4);
    await expect(footer.getByRole("link", { name: "Insta Mark on LinkedIn" })).toBeVisible();
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

  // Products: the heading is "Our products", with its description and no small label above.
  await expect(page.locator("#solutions-title")).toHaveText("Our products");
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

test("inner page headlines run onto the photo, like the theme (10f)", async ({ page }) => {
  const routes = [
    "/about",
    "/solutions",
    "/projects",
    "/contact",
    "/solutions/tailor-made-signage",
  ];
  for (const route of routes) {
    await page.goto(route);
    const hero = page.locator(".inner-hero");
    const media = hero.locator(".inner-hero__media").first();
    if ((await media.count()) === 0) continue; // a page without a photo has nothing to overlap
    const m = await media.boundingBox();
    // The title's block runs past its column into the photo ...
    const blockRight = await hero.locator("h1").evaluate((h) => h.getBoundingClientRect().right);
    expect(blockRight, `${route}: the title block should reach the photo`).toBeGreaterThan(
      m.x + 40,
    );
    // ... and where the title is long, its text lines lie on the photo too.
    if (["/about", "/solutions"].includes(route)) {
      const textRight = await hero.locator("h1").evaluate((h) => {
        const range = document.createRange();
        range.selectNodeContents(h);
        return Math.max(...[...range.getClientRects()].map((r) => r.right));
      });
      expect(textRight, `${route}: the title text should reach the photo`).toBeGreaterThan(m.x);
    }
    const z = await hero.locator("h1").evaluate((h) => getComputedStyle(h).zIndex);
    expect(Number(z)).toBeGreaterThan(0);
  }
});

test("About wording follows the client's content document (10f)", async ({ page }) => {
  // Home: the About block shows the document's two paragraphs, word for word.
  await page.goto("/");
  const block = page.locator("#about-title").locator("xpath=ancestor::section[1]");
  await expect(block).toContainText("Insta Mark is one of India’s leading providers");
  await expect(block).toContainText("From design and manufacturing to installation, we deliver");

  // About page: title and "Who We Are" heading from the document, not invented slogans.
  await page.goto("/about");
  await expect(page.locator("h1")).toHaveText("Creating Signage That Makes Every Space Smarter");
  await expect(page.locator("h2.visually-hidden").first()).toHaveText("Who We Are");
  await expect(page.locator("body")).not.toContainText("Pan India");
  await expect(page.locator("body")).toContainText(
    "Insta Mark is a leading architectural signage and road safety solutions company",
  );
});

test("inner page heroes show no Home / page breadcrumb, but keep it for search engines (10f)", async ({
  page,
}) => {
  for (const route of [
    "/about",
    "/solutions",
    "/projects",
    "/contact",
    "/solutions/tailor-made-signage",
  ]) {
    await page.goto(route);
    await expect(page.locator(".inner-hero .breadcrumb"), `${route} still shows it`).toHaveCount(0);
    await expect(page.locator('nav[aria-label="Breadcrumb"]')).toHaveCount(0);
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(
      jsonLd.some((t) => t.includes("BreadcrumbList")),
      `${route}: JSON-LD`,
    ).toBe(true);
  }
});

test("the three collage photos have the reference's sizes, and the same size on every page (10c)", async ({
  page,
}) => {
  const measure = async (route, scope) => {
    await page.goto(route);
    const items = page.locator(`${scope} .about-collage__item`);
    await items.first().scrollIntoViewIfNeeded();
    // offsetWidth/Height ignore the scroll drift movement.
    return items.evaluateAll((els) => els.map((el) => [el.offsetWidth, el.offsetHeight]));
  };
  const home = await measure("/", ".about-short");
  const about = await measure("/about", "main");
  const solution = await measure("/solutions/tailor-made-signage", "main");

  // Reference layout sizes: 224×279, 261×313 and 305×375 (within a pixel or two).
  const reference = [
    [224, 279],
    [261, 313],
    [305, 375],
  ];
  for (const [i, [w, h]] of reference.entries()) {
    expect(
      Math.abs(home[i][0] - w),
      `photo ${i + 1} width (ours ${home[i][0]}, reference ${w})`,
    ).toBeLessThanOrEqual(8);
    expect(
      Math.abs(home[i][1] - h),
      `photo ${i + 1} height (ours ${home[i][1]}, reference ${h})`,
    ).toBeLessThanOrEqual(8);
  }
  // Identical on the other pages.
  expect(about).toEqual(home);
  expect(solution).toEqual(home);
});

test("type sizes and hero timing follow the Crafto reference, measured 22 Oct 2026 (10g)", async ({
  page,
}) => {
  const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);
  await page.goto("/");

  // Home hero: 70 px headline, 15 px vertical label, 16 px / 30 px text, 18 px menu.
  const h1 = page.locator(".hero-split h1");
  expect(await css(h1, "fontSize")).toBe("70px");
  expect(await css(h1, "fontWeight")).toBe("600");
  expect(await css(page.locator(".hero-split__vertical"), "fontSize")).toBe("15px");
  const text = page.locator(".hero-split .lead-text");
  expect(await css(text, "fontSize")).toBe("16px");
  expect(await css(text, "lineHeight")).toBe("30px");
  const nav = page.locator(".site-header .nav-link").first();
  expect(await css(nav, "fontSize")).toBe("18px");
  expect(await css(nav, "fontWeight")).toBe("600");

  // Entrance: children rise 300 ms apart, over 600 ms (reference data-anime values).
  const kids = page.locator(".hero-split .load-stagger > *");
  expect(await css(kids.nth(1), "animationDelay")).toBe("0.3s");
  expect(await css(kids.nth(1), "animationDuration")).toBe("0.6s");
  // The photo zooms in slowly while it is revealed.
  const zoom = page.locator(".hero-split__media .drift-fill img").first();
  expect(await css(zoom, "animationName")).toBe("hero-zoom");
  expect(await css(zoom, "animationDuration")).toBe("2.5s");

  // About hero headline: 55 px / 55 px.
  await page.goto("/about");
  const about = page.locator(".inner-hero h1");
  expect(await css(about, "fontSize")).toBe("55.008px");
  expect(await css(about, "lineHeight")).toBe("55.008px");
});

test("the phone headline is 52.5 px like the reference and nothing overflows at 360 and 390 px (10g)", async ({
  page,
}) => {
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const size = await page
      .locator(".hero-split h1")
      .evaluate((el) => getComputedStyle(el).fontSize);
    expect(size).toBe("52.48px");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `sideways scroll at ${width} px`).toBeLessThanOrEqual(0);
  }
  // As in the reference, the photo comes first on a phone, then the headline.
  const photo = await page.locator(".hero-split__media").boundingBox();
  const title = await page.locator(".hero-split h1").boundingBox();
  expect(photo.y).toBeLessThan(title.y);
});

test("the gaps around the logo row match the reference's 90 px (10c)", async ({ page }) => {
  await page.goto("/");
  // Reference (1440 px): the logo section has 90 px above and below, the About block that
  // follows has no top padding, so the gap under the logos is exactly the section padding.
  // Ours is 84 px because our logo files are taller than the reference's 35 px wordmarks.
  const m = await page.evaluate(() => {
    const rect = (sel) => document.querySelector(sel).getBoundingClientRect();
    const logos = document.querySelector(".project-logos");
    const cs = getComputedStyle(logos);
    const about = document.querySelector(".about-short");
    return {
      padTop: parseFloat(cs.paddingTop),
      padBottom: parseFloat(cs.paddingBottom),
      heroToLogos: rect(".project-logos").top - rect(".hero-split").bottom,
      logosToAbout: rect(".about-short").top - rect(".project-logos").bottom,
      aboutPadTop: getComputedStyle(about).paddingTop,
    };
  });
  expect(m.padTop).toBeGreaterThanOrEqual(80);
  expect(m.padTop).toBeLessThanOrEqual(100);
  expect(m.padBottom).toBeGreaterThanOrEqual(80);
  expect(m.padBottom).toBeLessThanOrEqual(100);
  expect(m.aboutPadTop).toBe("0px");
});
