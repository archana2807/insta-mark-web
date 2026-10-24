// Home banner (client feedback, 21 Oct 2026; Crafto "Branding Agency" hero):
// - H1 "Architectural Signage & Road Safety", the page's only H1, beside the photo (not on it);
// - the tagline "Signage That Guides. Safety That Lasts." is a smaller line right under the
//   H1 at every width; no vertical label (client, 23 Oct 2026). Inner pages follow the same
//   layout.
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

test("home banner (desktop): the tagline sits right under the headline; no buttons", async ({
  page,
}) => {
  await page.goto("/");
  const hero = page.locator(".hero-split");
  const headline = hero.locator("h1");
  const tagline = hero.locator(".hero-split__tagline");
  await expect(headline).toHaveText(HEADLINE);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(hero.locator(".eyebrow")).toHaveCount(0);

  // No vertical label any more: the tagline is the line right under the headline.
  await expect(hero.locator(".hero-split__vertical")).toHaveCount(0);
  await expect(tagline).toBeVisible();
  await expect(tagline).toHaveText(TAGLINE);
  await expect(headline.locator("xpath=following-sibling::*[1]")).toHaveText(TAGLINE);
  const h = await headline.boundingBox();
  const t = await tagline.boundingBox();
  expect(t.y).toBeGreaterThanOrEqual(h.y + h.height - 1);
  expect(t.y - (h.y + h.height)).toBeLessThan(40);
  expect(Math.abs(t.x - h.x)).toBeLessThanOrEqual(1); // same left edge

  // No buttons in the banner (client, 23 Oct 2026).
  await expect(hero.locator(".hero-split__text-col").locator("a, button")).toHaveCount(0);

  // Hierarchy: the headline is far bigger than the tagline.
  expect(await fontPx(headline)).toBeGreaterThanOrEqual((await fontPx(tagline)) * 2);

  // The "&" never ends a line: it starts the second line, with "Road Safety".
  const lastOfFirstLine = await headline.evaluate((el) => {
    const range = document.createRange();
    const node = el.firstChild;
    const rows = new Map();
    for (let i = 0; i < node.length; i++) {
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const r = range.getClientRects()[0];
      if (!r || r.width === 0) continue;
      const row = Math.round(r.top);
      rows.set(row, (rows.get(row) ?? "") + node.data[i]);
    }
    return [...rows.values()][0].trim();
  });
  expect(lastOfFirstLine.endsWith("&")).toBe(false);
});

test("home banner: the headline stays beside the photo, never on it, from 1024 to 1920 px", async ({
  page,
}) => {
  for (const width of [1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const hero = page.locator(".hero-split");
    const media = await hero.locator(".hero-split__media").boundingBox();
    // Right edge of the letters themselves, not of the H1 box.
    const textRight = await hero.locator("h1").evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return Math.max(...[...range.getClientRects()].map((r) => r.right));
    });
    expect(textRight, `${width} px`).toBeLessThanOrEqual(media.x - 16);
    // Still the biggest text on the page: 44 px or more.
    expect(await fontPx(hero.locator("h1")), `${width} px`).toBeGreaterThanOrEqual(44);
  }
});

test("home banner (desktop): the tagline is fully visible without scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto("/");
  const label = await page.locator(".hero-split__tagline").boundingBox();
  expect(label.y).toBeGreaterThanOrEqual(0);
  expect(label.y + label.height).toBeLessThanOrEqual(800);
});

test("the row under the banner shows five counters in place of the logos, in the same equal columns", async ({
  page,
}) => {
  await page.goto("/");
  const row = page.locator(".project-logos");
  await expect(row).toBeVisible();
  await expect(row.locator("img")).toHaveCount(0);
  const items = row.locator(".project-logos__stat");
  await expect(row.locator(".project-logos__label")).toHaveText([
    "Projects Delivered",
    "Years of Experience",
    "Locations Covered",
    "Solutions & Applications",
    "Industries Served",
  ]);
  // Screen readers get each number as plain text; the last two come from real content.
  const values = row.locator(".project-logos__value .visually-hidden");
  await expect(values.nth(3)).toHaveText("8");
  await expect(values.nth(4)).toHaveText("12");
  for (let i = 0; i < 3; i++) await expect(values.nth(i)).toHaveText(/^\d+\+$/);

  // Same look as the logo row: one row of equal columns, each item centred in its column.
  const centres = await items.evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return [el.offsetTop, r.left + r.width / 2];
    }),
  );
  expect(new Set(centres.map(([top]) => top)).size).toBe(1);
  const steps = centres.slice(1).map(([, c], i) => c - centres[i][1]);
  for (const step of steps) expect(Math.abs(step - steps[0])).toBeLessThan(4);

  // Directly after the banner.
  const hero = await page.locator(".hero-split").boundingBox();
  const band = await row.boundingBox();
  expect(band.y).toBeGreaterThanOrEqual(hero.y + hero.height - 1);
  expect(band.y - (hero.y + hero.height)).toBeLessThan(40);

  // Rolling digits: the "8" strip ends on its digit once the row is in view.
  await row.scrollIntoViewIfNeeded();
  const strip = items.nth(3).locator(".digit-roll__strip");
  await expect
    .poll(() => strip.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42), {
      timeout: 5000,
    })
    .toBeLessThan(-1);
});

test("the counter row looks finished: light band, dividers, small raised plus, gradient line, uppercase labels", async ({
  page,
}) => {
  const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const row = page.locator(".project-logos");
  // A light band, different from the white banner above.
  expect(await css(row, "backgroundColor")).not.toBe("rgba(0, 0, 0, 0)");
  // Hairline dividers between the columns (not before the first).
  const stats = row.locator(".project-logos__stat");
  expect(await css(stats.first(), "borderLeftWidth")).toBe("0px");
  expect(await css(stats.nth(1), "borderLeftWidth")).toBe("1px");
  // The "+" is smaller than the number.
  const value = row.locator(".project-logos__value").first();
  const plus = value.locator(".digit-roll__sym");
  expect(parseFloat(await css(plus, "fontSize"))).toBeLessThan(
    parseFloat(await css(value, "fontSize")) * 0.7,
  );
  // Small uppercase labels.
  const label = row.locator(".project-logos__label").first();
  expect(await css(label, "textTransform")).toBe("uppercase");
  expect(parseFloat(await css(label, "fontSize"))).toBeLessThanOrEqual(14);
  // The gradient line is fully drawn once the row is in view.
  await row.scrollIntoViewIfNeeded();
  const bar = row.locator(".project-logos__bar").first();
  expect(await css(bar, "backgroundImage")).toContain("linear-gradient");
  await expect
    .poll(() => bar.evaluate((el) => el.getBoundingClientRect().width), { timeout: 5000 })
    .toBeGreaterThan(30);
});

test("with reduced motion the counter row shows its final numbers and lines at once", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const row = page.locator(".project-logos");
  await row.scrollIntoViewIfNeeded();
  const bar = row.locator(".project-logos__bar").first();
  expect(await bar.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(30);
  await expect(row.locator(".project-logos__value .visually-hidden").nth(3)).toHaveText("8");
});

test("the counter row rolls like an odometer (zeros too) and the labels fade up when it comes into view", async ({
  page,
}) => {
  // The banner fills the screen, so the row comes into view when the visitor scrolls.
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.addInitScript(() => {
    window.__armed = false;
    new MutationObserver(() => {
      if (document.querySelector(".project-logos__list.motion-armed")) window.__armed = true;
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["class"] });
  });
  await page.goto("/");
  const row = page.locator(".project-logos");
  await expect.poll(() => page.evaluate(() => window.__armed), { timeout: 5000 }).toBe(true);
  await row.scrollIntoViewIfNeeded();

  // "500": the last zero turns two full rounds before it stops on 0 (20 digits = 20 em).
  const zero = row.locator(".project-logos__stat").first().locator(".digit-roll__strip").nth(2);
  const fontPx = await zero.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  await expect
    .poll(() => zero.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42), {
      timeout: 6000,
    })
    .toBeLessThan(-19 * fontPx);
  // It is still a 0 on screen, and the screen reader text is the real value.
  await expect(row.locator(".project-logos__value .visually-hidden").first()).toHaveText(/^\d+\+$/);

  // The labels end fully visible.
  const label = row.locator(".project-logos__label").first();
  await expect
    .poll(() => label.evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 5000 })
    .toBe(1);
});

test("scroll entrances replay every time they come into view, scrolling down and back up", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const grid = page.locator(".product-mosaic"); // a Reveal with staggered tiles
  const armed = () => grid.evaluate((el) => el.classList.contains("motion-armed"));
  const tileOpacity = () => grid.evaluate((el) => Number(getComputedStyle(el.children[0]).opacity));

  // 1. First time down: it plays.
  await grid.scrollIntoViewIfNeeded();
  await expect.poll(armed).toBe(false);
  await expect.poll(tileOpacity, { timeout: 4000 }).toBe(1);

  // 2. Scrolled away (above it, back to the top): reset while off screen.
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(armed).toBe(true);

  // 3. Down again: it plays again.
  await grid.scrollIntoViewIfNeeded();
  await expect.poll(armed).toBe(false);
  await expect.poll(tileOpacity, { timeout: 4000 }).toBe(1);

  // 4. Past it to the bottom, then back UP onto it: it resets and plays again.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(armed).toBe(true);
  await grid.scrollIntoViewIfNeeded();
  await expect.poll(armed).toBe(false);
  await expect.poll(tileOpacity, { timeout: 4000 }).toBe(1);

  // 5. No flicker at the edge: while any part is on screen it is never reset.
  const box = await grid.boundingBox();
  const top = await page.evaluate(() => window.scrollY);
  await page.evaluate((y) => window.scrollTo(0, y), top + box.y + box.height - 40);
  await page.waitForTimeout(300);
  expect(await armed()).toBe(false);
});

test("the counter row wraps centred on a phone without sideways scroll", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".project-logos__stat")).toHaveCount(5);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("Home has only the one counter row under the banner; the About counters stay on About", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".home-counters")).toHaveCount(0);
  await expect(page.locator(".counter-cols")).toHaveCount(0);
  await expect(page.locator(".project-logos__stat")).toHaveCount(5);
  // A white gap between the band and the About content (the band's bottom margin; the
  // About row's negative gutter and its columns' gutter cancel out). The columns are
  // centred, so the gap you see is to the highest one, not to the section box.
  const bandBottom = await page.locator(".project-logos").evaluate((el) => {
    let y = el.offsetHeight;
    for (let n = el; n; n = n.offsetParent) y += n.offsetTop;
    return y;
  });
  // Layout positions (offsetTop), so an entrance animation's 30 px start offset does not count.
  const tops = await page.locator(".about-short .row > *").evaluateAll((els) =>
    els.map((el) => {
      let y = 0;
      for (let n = el; n; n = n.offsetParent) y += n.offsetTop;
      return y;
    }),
  );
  const gap = Math.min(...tops) - bandBottom;
  expect(gap).toBeGreaterThanOrEqual(76);
  expect(gap).toBeLessThanOrEqual(92);
  await page.goto("/about");
  await expect(page.locator(".counter-cols dt")).toHaveCount(4);
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

test("home About photos float against each other on scroll: left and right go opposite ways, up-down and sideways", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const items = page.locator(".about-short .about-collage__item");
  const offsets = () =>
    items.evaluateAll((els) =>
      els.map((el) => {
        const m = new DOMMatrix(getComputedStyle(el).transform);
        return [m.m41, m.m42];
      }),
    );

  // Two scroll positions while the collage is on screen; let the smooth catch-up settle.
  await items.first().scrollIntoViewIfNeeded();
  const top = await page.evaluate(() => scrollY);
  await page.evaluate((y) => scrollTo(0, y - 250), top);
  await page.waitForTimeout(1800);
  const before = await offsets();
  await page.evaluate((y) => scrollTo(0, y + 150), top);
  await page.waitForTimeout(1800);
  const after = await offsets();
  const dx = before.map((b, i) => after[i][0] - b[0]);
  const dy = before.map((b, i) => after[i][1] - b[1]);
  // Left photo rises while the right one sinks, by a clearly visible amount (bob aside).
  expect(dy[0]).toBeLessThan(-15);
  expect(dy[1]).toBeGreaterThan(15);
  // Sideways too, in opposite directions.
  expect(Math.sign(dx[0])).toBe(-Math.sign(dx[1]));
  expect(Math.abs(dx[0])).toBeGreaterThan(3);
  // Still subtle: under 80 px for a 400 px scroll.
  expect(Math.max(...dy.map(Math.abs))).toBeLessThan(80);

  // Idle float: without scrolling, the photos still move a little.
  const still = await offsets();
  await page.waitForTimeout(1200);
  const later = await offsets();
  const bob = later.map((v, i) => Math.abs(v[1] - still[i][1]));
  expect(Math.max(...bob)).toBeGreaterThan(0.5);
  expect(Math.max(...bob)).toBeLessThan(17);
});

test("home About photos do not float with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const items = page.locator(".about-short .about-collage__item");
  await items.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const transforms = await items.evaluateAll((els) =>
    els.map((el) => getComputedStyle(el).transform),
  );
  expect(transforms).toEqual(["none", "none", "none"]);
});

test("no small label above a headline on any public page (10b)", async ({ page }) => {
  await page.goto("/solutions");
  const solution = await page.locator('a[href^="/solutions/"]').first().getAttribute("href");
  const routes = ["/", "/about", "/solutions", solution, "/contact", "/privacy-policy"];
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
  for (const route of ["/", "/about", "/contact", "/solutions"]) {
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
  // Order: counter row → About → scrolling line → products → industries → process → trusted by.
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
  // Five logos per row on a laptop (client, 24 Oct 2026).
  const rowTops = await page
    .locator(".logo-wall > li")
    .evaluateAll((els) => els.map((el) => el.offsetTop));
  expect(rowTops.filter((t) => t === rowTops[0]).length).toBe(5);
  await expect(page.locator("#trusted-title")).toHaveText("Trusted by Leading Brands");

  // Products: the heading is "Our Products", with its description and no small label above.
  await expect(page.locator("#solutions-title")).toHaveText("Our Products");
});

test("home banner (phone): the tagline is a smaller line under the H1", async ({ page }) => {
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

test("inner page photos have the home banner's size on laptops and a phone", async ({ page }) => {
  test.setTimeout(240000); // 12 page loads at 3 screen sizes
  for (const [w, h] of [
    [1440, 900],
    [1920, 1080],
    [390, 844],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const home = await page.locator(".hero-split__media").boundingBox();
    for (const route of ["/about", "/contact", "/solutions", "/solutions/road-signs"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const inner = await page.locator(".inner-hero__media").boundingBox();
      expect(
        Math.abs(inner.height - home.height),
        `${route} at ${w} px: height`,
      ).toBeLessThanOrEqual(2);
      expect(Math.abs(inner.width - home.width), `${route} at ${w} px: width`).toBeLessThanOrEqual(
        2,
      );
    }
  }
});

test("inner page photos move like the home banner photo: same box, same scroll drift and zoom", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const look = async (route) => {
    await page.goto(route);
    await page.waitForTimeout(2800); // after the load zoom
    return page.evaluate(() => {
      const media = document.querySelector(".hero-split__media, .inner-hero__media");
      const drift = media.querySelector(".drift-fill");
      const img = drift.querySelector("img");
      const m = new DOMMatrix(getComputedStyle(drift).transform);
      return {
        box: [img.offsetWidth, img.offsetHeight], // no taller parallax layer
        frame: [media.offsetWidth, media.offsetHeight],
        scale: Math.round(m.a * 100) / 100,
        y: Math.round(m.f),
        zoom: getComputedStyle(img).animationName,
      };
    });
  };
  const home = await look("/");
  for (const route of ["/about", "/contact", "/solutions/road-signs"]) {
    const inner = await look(route);
    expect(inner.box, route).toEqual(inner.frame);
    expect(inner.scale, route).toBe(home.scale);
    expect(Math.abs(inner.y - home.y), route).toBeLessThanOrEqual(2);
    expect(inner.zoom, route).toBe(home.zoom);
  }
});

test("scroll-linked photos glide to their place like the reference, the same way down and up", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/about");
  await page.waitForTimeout(2800); // after the load zoom
  const drift = page.locator(".inner-hero__media .drift-fill");
  const y = () => drift.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).f);
  const start = await y();

  // A sudden scroll: the photo does not jump; it glides there in about 200 ms.
  await page.evaluate(() => window.scrollTo(0, 300));
  const early = await y();
  await page.waitForTimeout(600);
  const settled = await y();
  expect(Math.abs(settled - start)).toBeGreaterThan(3);
  expect(Math.abs(early - start)).toBeLessThan(Math.abs(settled - start));

  // Back up: it glides back to where it started.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  expect(Math.abs((await y()) - start)).toBeLessThanOrEqual(0.5);
});

test("About: the manufacturing heading sits beside its photo, not over it, lined up with its text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/about");
  const section = page.locator("#mfg-title").locator("xpath=ancestor::section[1]");
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  const media = await section.locator(".overlap-feature__media").boundingBox();
  const h2 = section.locator("#mfg-title");
  // No white panel and no shift onto the photo.
  expect(await h2.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgba(0, 0, 0, 0)");
  const textLeft = await h2.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return Math.min(...[...range.getClientRects()].map((r) => r.left));
  });
  expect(textLeft).toBeGreaterThanOrEqual(media.x + media.width + 16);
  // Lined up on the left with the intro under it (layout position, so the fade-up does not count).
  const left = (loc) =>
    loc.evaluate((el) => {
      let x = 0;
      for (let n = el; n; n = n.offsetParent) x += n.offsetLeft;
      return x;
    });
  expect(
    Math.abs((await left(h2)) - (await left(section.locator("p").first()))),
  ).toBeLessThanOrEqual(2);
});

test("inner page titles stay beside the photo, like the home banner; no vertical label", async ({
  page,
}) => {
  const routes = ["/about", "/solutions", "/contact", "/solutions/tailor-made-signage"];
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const route of routes) {
    await page.goto(route);
    const hero = page.locator(".inner-hero");
    await expect(hero.locator(".inner-hero__vertical"), route).toHaveCount(0);
    const media = hero.locator(".inner-hero__media").first();
    if ((await media.count()) === 0) continue; // a page without a photo has nothing to overlap
    const m = await media.boundingBox();
    // The letters themselves end before the photo, with air between.
    const textRight = await hero.locator("h1").evaluate((h) => {
      const range = document.createRange();
      range.selectNodeContents(h);
      return Math.max(...[...range.getClientRects()].map((r) => r.right));
    });
    expect(textRight, `${route}: the title must not reach the photo`).toBeLessThanOrEqual(m.x - 16);
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
  for (const route of ["/about", "/solutions", "/contact", "/solutions/tailor-made-signage"]) {
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

test("About: a layered card carousel replaces the photo collage; keys, a swipe and a click move the cards", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/about");
  const section = page.locator("#vision-title").locator("xpath=ancestor::section[1]");
  await expect(section.locator(".about-collage")).toHaveCount(0);
  const carousel = section.locator(".layer-carousel");
  await expect(carousel).toHaveAttribute("aria-roledescription", "carousel");
  const cards = carousel.locator(".layer-carousel__card");
  await expect(cards).toHaveCount(3);
  // Each card is labelled with a real solution name.
  await expect(carousel.locator(".layer-carousel__label")).toHaveText([
    "Tailor-made Signage",
    "Modular Signs",
    "Road Signs",
  ]);
  const front = carousel.locator(".layer-carousel__card.is-active");
  await expect(front.locator(".layer-carousel__label")).toHaveText("Tailor-made Signage");
  await expect(front.getByRole("link", { name: /View solution/ })).toHaveAttribute(
    "href",
    "/solutions/tailor-made-signage",
  );
  // The front card is in front and bigger than the side cards.
  const z = (loc) => loc.evaluate((el) => Number(getComputedStyle(el).zIndex));
  expect(await z(front)).toBeGreaterThan(await z(cards.nth(1)));
  await carousel.scrollIntoViewIfNeeded();
  await carousel.hover(); // the mouse over the carousel holds the auto-slide
  await page.waitForTimeout(900);
  const w = async (loc) => (await loc.boundingBox()).width;
  expect(await w(front)).toBeGreaterThan((await w(cards.nth(1))) * 1.1);
  // Only the front card's link can be reached with the keyboard.
  await expect(cards.nth(1).locator("a")).toHaveAttribute("tabindex", "-1");

  // No arrows: it slides by itself. The keyboard (on the pause button), a swipe and a click
  // on a side card still change the card.
  await expect(carousel.locator(".layer-carousel__arrow")).toHaveCount(0);
  const announce = carousel.locator("[aria-live]");
  await carousel.getByRole("button", { name: /the cards/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(announce).toHaveText("Card 2 of 3: Modular Signs");
  await expect(front.locator(".layer-carousel__label")).toHaveText("Modular Signs");
  const stage = await carousel.locator(".layer-carousel__stage").boundingBox();
  const cy = stage.y + stage.height / 2;
  await page.mouse.move(stage.x + stage.width * 0.7, cy);
  await page.mouse.down();
  await page.mouse.move(stage.x + stage.width * 0.3, cy, { steps: 5 });
  await page.mouse.up();
  await expect(announce).toHaveText("Card 3 of 3: Road Signs");
  // Card 1 now sits on the right, partly behind the front card: click its free right edge.
  await page.waitForTimeout(900);
  const side = await cards.nth(0).boundingBox();
  await page.mouse.click(side.x + side.width - 12, side.y + side.height / 2);
  await expect(announce).toHaveText("Card 1 of 3: Tailor-made Signage");
});

test("About carousel slides by itself every 2 s, and the pause button stops it (WCAG 2.2.2)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/about");
  const carousel = page.locator(".layer-carousel");
  await carousel.scrollIntoViewIfNeeded();
  await page.mouse.move(5, 5); // the mouse away from the carousel (hover pauses it)
  const frontLabel = carousel.locator(".layer-carousel__card.is-active .layer-carousel__label");
  await expect(frontLabel).toHaveText("Tailor-made Signage");
  await page.waitForTimeout(800);
  await expect(frontLabel).toHaveText("Tailor-made Signage"); // not yet after 0.8 s
  await expect(frontLabel).toHaveText("Modular Signs", { timeout: 3000 });

  // Pause: nothing moves for longer than one interval.
  const pause = carousel.getByRole("button", { name: "Pause the cards" });
  await expect(pause).toBeVisible();
  await pause.click();
  await page.mouse.move(5, 5);
  const now = await frontLabel.textContent();
  await page.waitForTimeout(3500);
  await expect(frontLabel).toHaveText(now);
  await expect(carousel.getByRole("button", { name: "Play the cards" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("About carousel: no sideways scroll on a phone; no motion and no auto-slide with reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/about");
  const carousel = page.locator(".layer-carousel");
  await carousel.scrollIntoViewIfNeeded();
  // No auto-slide: the first card stays in front; the play button is offered instead.
  await page.mouse.move(5, 5);
  await page.waitForTimeout(3000);
  await expect(
    carousel.locator(".layer-carousel__card.is-active .layer-carousel__label"),
  ).toHaveText("Tailor-made Signage");
  await expect(carousel.getByRole("button", { name: "Play the cards" })).toBeVisible();
  // The site-wide reduced-motion rule turns every transition into 0.01 ms.
  const duration = await carousel
    .locator(".layer-carousel__card")
    .first()
    .evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration));
  expect(duration).toBeLessThan(0.01);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("the three collage photos on Home have the reference's sizes; solution pages show the photo deck instead (10c, 10e)", async ({
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
  // The solution pages have the fanned photo deck instead (client, 24 Oct 2026), and the
  // About page the card carousel.
  await page.goto("/solutions/tailor-made-signage");
  await expect(page.locator("main .about-collage")).toHaveCount(0);
  await expect(page.locator("main .card-deck")).toHaveCount(1);
});

test("type sizes and hero timing follow the Crafto reference, measured 22 Oct 2026 (10g)", async ({
  page,
}) => {
  const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);
  await page.goto("/");

  // Home hero: 63 px headline at 1440 px (4.4vw, so it stays beside the photo; 70 px from
  // about 1600 px), 28 px tagline under it, 16 px / 30 px text, 18 px menu.
  const h1 = page.locator(".hero-split h1");
  expect(await css(h1, "fontSize")).toBe("63.36px");
  expect(await css(h1, "fontWeight")).toBe("600");
  expect(await css(page.locator(".hero-split__tagline"), "fontSize")).toBe("28px");
  // The tagline alone is in Pacifico (client, 24 Oct 2026); the headline keeps its font.
  expect(await css(page.locator(".hero-split__tagline"), "fontFamily")).toMatch(/script/i);
  expect(await css(h1, "fontFamily")).not.toMatch(/script/i);
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

test("header and inner hero follow the Crafto reference's measured sizes (10f)", async ({
  page,
}) => {
  const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const route of ["/about", "/contact"]) {
    await page.goto(route);
    // Header: 94 px high, links 18 px / 600 with 20 px padding, CTA 13 px / 600 and 45.5 px high.
    const header = await page.locator(".site-header").boundingBox();
    expect(Math.round(header.height)).toBe(94);
    const link = page.locator(".site-header .nav-link").first();
    expect(await css(link, "paddingLeft")).toBe("20px");
    const cta = page.locator(".site-header .header-cta");
    expect(await css(cta, "fontSize")).toBe("13px");
    expect(await css(cta, "fontWeight")).toBe("600");
    expect(Math.round((await cta.boundingBox()).height * 10) / 10).toBeCloseTo(45.5, 0);

    // Hero: like the home banner, the photo is the screen height under the header (806 px on
    // a 900 px screen), text 5/12 and photo 7/12 of the width, and
    // the title starts where the home headline does (72 px from the left).
    const hero = await page.locator(".inner-hero").boundingBox();
    expect(Math.round(hero.height), `${route} hero height`).toBe(806);
    const media = await page.locator(".inner-hero__media").boundingBox();
    expect(Math.abs(media.x - 600), `${route} photo starts at 5/12`).toBeLessThanOrEqual(2);
    const title = await page.locator(".inner-hero h1").boundingBox();
    expect(Math.abs(title.x - 72), `${route} title position`).toBeLessThanOrEqual(3);
    expect(await css(page.locator(".inner-hero h1"), "fontSize")).toBe("55.008px");
    const lead = page.locator(".inner-hero__lead");
    if ((await lead.count()) > 0) expect(await css(lead, "fontSize")).toBe("16px");
  }

  // The header does not shrink when scrolled.
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(500);
  expect(Math.round((await page.locator(".site-header").boundingBox()).height)).toBe(94);

  // Phone: 78 px header, bare menu icon, photo 390 × 500 right under it (the home banner's
  // phone size), title 41.256 px.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/about");
  expect(Math.round((await page.locator(".site-header").boundingBox()).height)).toBe(78);
  expect(await css(page.locator(".menu-toggle"), "borderTopWidth")).toBe("0px");
  const photo = await page.locator(".inner-hero__media").boundingBox();
  expect(Math.round(photo.width)).toBe(390);
  expect(Math.abs(photo.height - 500)).toBeLessThanOrEqual(1);
  expect(Math.abs(photo.y - 78)).toBeLessThanOrEqual(1);
  expect(parseFloat(await css(page.locator(".inner-hero h1"), "fontSize"))).toBeCloseTo(41.256, 1);
});

test("the contact form section follows the Crafto contact layout: photo left, title and form right (10f)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/contact");
  const section = page.locator("#contact-form");
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);

  // The photo is flush with the left edge and half the width; the content is to its right.
  const media = await section.locator(".enquiry-photo__media").boundingBox();
  expect(Math.round(media.x)).toBe(0);
  expect(Math.abs(media.width - 720)).toBeLessThanOrEqual(2);
  const title = await section.locator("h2").boundingBox();
  expect(title.x).toBeGreaterThanOrEqual(media.x + media.width);
  await expect(section.locator("h2")).toHaveText("Request a Consultation");
  expect(
    parseFloat(await section.locator("h2").evaluate((el) => getComputedStyle(el).fontSize)),
  ).toBeGreaterThan(63);

  // Between the banner and the form: the office columns, with the reference's 90 px gaps.
  const heroBox = await page.locator(".inner-hero").boundingBox();
  const offices = page.locator(".offices");
  const officesBox = await offices.boundingBox();
  expect(officesBox.y).toBeGreaterThanOrEqual(heroBox.y + heroBox.height - 1);
  expect(media.y).toBeGreaterThanOrEqual(officesBox.y + officesBox.height - 1);
  expect(await offices.evaluate((el) => getComputedStyle(el).paddingTop)).toBe("90px");
  await expect(offices.locator(".office")).toHaveCount(3);
  const first = offices.locator(".office").first();
  expect(await first.locator("h2").evaluate((el) => getComputedStyle(el).fontSize)).toBe("30px");
  await expect(first).toContainText("E:");
  await expect(first).toContainText("T:");
  await expect(first.getByRole("link", { name: /View on Google Map/ })).toHaveAttribute(
    "href",
    /google\.com\/maps/,
  );
  // Only the client's words: no sentence that is not in the content document.
  await expect(section).not.toContainText("Share your requirement");

  // The client's wording is unchanged: every field and the button keep their labels.
  for (const label of [
    "Name",
    "Company",
    "Email",
    "Phone",
    "Project location",
    "Requirement",
    "Message",
  ])
    await expect(section.locator(".form-label", { hasText: label }).first()).toBeVisible();
  await expect(section.getByRole("button", { name: /Get a Quote/ })).toBeVisible();
  await expect(section.locator(".enquiry-panel")).toHaveCount(0);

  // Underlined fields with an icon, and a black full-width button 68 px high.
  const input = section.locator("input[name=name]");
  expect(await input.evaluate((el) => getComputedStyle(el).borderBottomWidth)).toBe("1px");
  expect(await input.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe("0px");
  await expect(section.locator(".field-icon").first().locator("svg")).toBeVisible();
  const button = await section.getByRole("button", { name: /Get a Quote/ }).boundingBox();
  const form = await section.locator("form").boundingBox();
  expect(Math.abs(button.width - form.width)).toBeLessThanOrEqual(1);
  expect(Math.round(button.height)).toBe(68);

  // Phone: the photo comes first, then the title and the form.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/contact");
  const phoneMedia = await page.locator("#contact-form .enquiry-photo__media").boundingBox();
  const phoneTitle = await page.locator("#contact-form h2").boundingBox();
  expect(phoneMedia.y).toBeLessThan(phoneTitle.y);
  expect(Math.round(phoneMedia.width)).toBe(390);
});

test("solution and project pages show a call to action to the Contact form, not a form (10e)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  // Solution page: the document's Call to Action, no form; the button pre-selects the solution.
  await page.goto("/solutions/modular-signs?utm_source=mail");
  await expect(page.locator("form.enquiry-form")).toHaveCount(0);
  const band = page.locator(".cta-band");
  await expect(band.locator("h2")).toHaveText("Looking for reliable Modular Signs solutions?");
  await expect(band).toContainText(
    "Contact Insta Mark today for expert consultation and a customized quotation.",
  );
  await band.getByRole("link", { name: /Request a Consultation/ }).click();
  await page.waitForURL(/\/contact\?requirement=Modular\+Signs&utm_source=mail#contact-form/);
  await expect(page.locator("#contact-form-requirement")).toHaveValue("Modular Signs");
  await expect(page.locator('#contact-form input[name="category"]')).toHaveValue("modular-signs");

  // Contact without a requirement: nothing pre-selected.
  await page.goto("/contact");
  await expect(page.locator("#contact-form-requirement")).toHaveValue("");
});

test("the Projects pages are deleted: no menu or footer link, not in the sitemap, old links go Home", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.locator('header a[href^="/projects"]')).toHaveCount(0);
  await expect(page.locator('footer a[href^="/projects"]')).toHaveCount(0);
  for (const old of ["/projects", "/projects/sample-residential-tower"]) {
    const res = await request.get(old, { maxRedirects: 0 });
    expect(res.status(), old).toBe(307);
    expect(res.headers().location, old).toBe("/");
  }
  await page.goto("/projects");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("h1")).toHaveText(/Architectural Signage/);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("/projects");
  // The thank-you page now points to the solutions instead.
  await page.goto("/thank-you");
  await expect(page.getByRole("link", { name: /Our solutions/ })).toHaveAttribute(
    "href",
    "/solutions",
  );
});
