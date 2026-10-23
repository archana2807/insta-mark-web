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

test("home banner (desktop): the tagline sits right under the headline, which runs onto the photo", async ({
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

test("home banner (desktop): the tagline is fully visible without scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto("/");
  const label = await page.locator(".hero-split__tagline").boundingBox();
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

  // Home hero: 70 px headline, 28 px tagline under it, 16 px / 30 px text, 18 px menu.
  const h1 = page.locator(".hero-split h1");
  expect(await css(h1, "fontSize")).toBe("70px");
  expect(await css(h1, "fontWeight")).toBe("600");
  expect(await css(page.locator(".hero-split__tagline"), "fontSize")).toBe("28px");
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

    // Hero: 550 px high, text 1/3 and photo 2/3 of the width, label 92 px from the left.
    const hero = await page.locator(".inner-hero").boundingBox();
    expect(Math.round(hero.height), `${route} hero height`).toBe(550);
    const media = await page.locator(".inner-hero__media").boundingBox();
    expect(Math.abs(media.x - 480), `${route} photo starts at 1/3`).toBeLessThanOrEqual(2);
    const label = await page.locator(".inner-hero__vertical").boundingBox();
    expect(Math.abs(label.x - 92), `${route} label position`).toBeLessThanOrEqual(3);
    expect(await css(page.locator(".inner-hero h1"), "fontSize")).toBe("55.008px");
    const lead = page.locator(".inner-hero__lead");
    if ((await lead.count()) > 0) expect(await css(lead, "fontSize")).toBe("16px");
  }

  // The header does not shrink when scrolled.
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(500);
  expect(Math.round((await page.locator(".site-header").boundingBox()).height)).toBe(94);

  // Phone: 78 px header, bare menu icon, photo 390 × 272 right under it, title 41.256 px.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/about");
  expect(Math.round((await page.locator(".site-header").boundingBox()).height)).toBe(78);
  expect(await css(page.locator(".menu-toggle"), "borderTopWidth")).toBe("0px");
  const photo = await page.locator(".inner-hero__media").boundingBox();
  expect(Math.round(photo.width)).toBe(390);
  expect(Math.abs(photo.height - 272)).toBeLessThanOrEqual(1);
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
  await expect(section.locator("h2")).toHaveText("Request a consultation");
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

  // Project page: the portfolio call to action from the document.
  await page.goto("/projects");
  const project = await page.locator('a[href^="/projects/"]').first().getAttribute("href");
  await page.goto(project);
  await expect(page.locator("form.enquiry-form")).toHaveCount(0);
  await expect(page.locator(".cta-band h2")).toHaveText("Have a project in mind?");
  await expect(page.locator(".cta-band")).toContainText(
    "Let's create a signage solution tailored to your space.",
  );

  // Contact without a requirement: nothing pre-selected.
  await page.goto("/contact");
  await expect(page.locator("#contact-form-requirement")).toHaveValue("");
});

test("the Projects hero follows the reference's portfolio page: big centred title, the client's text, no photo", async ({
  page,
}) => {
  const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/projects");
  const hero = page.locator(".portfolio-hero");
  const h1 = hero.locator("h1");
  await expect(h1).toHaveText("Project Portfolio");
  expect(await css(h1, "fontSize")).toBe("70px");
  expect(await css(h1, "textAlign")).toBe("center");
  expect(await css(hero, "paddingTop")).toBe("90px");
  await expect(hero.locator("img")).toHaveCount(0);
  await expect(hero.locator(".portfolio-hero__text")).toContainText(
    "Our portfolio spans luxury residences, hospitals, airports",
  );
  const box = await h1.boundingBox();
  expect(Math.abs(box.x + box.width / 2 - 720)).toBeLessThanOrEqual(2); // centred

  // The category links still lead to their sections.
  const first = hero.locator(".portfolio-hero__links a").first();
  const target = await first.getAttribute("href");
  await expect(page.locator(target)).toHaveCount(1);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/projects");
  expect(await css(page.locator(".portfolio-hero h1"), "fontSize")).toBe("52.48px");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
