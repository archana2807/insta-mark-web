// Solution pages (client feedback, 21–22 Oct 2026; Crafto "Branding Agency" counter columns).
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

test("What you get is shown as numbered columns, like the theme's counters (10e)", async ({
  page,
}) => {
  await page.goto("/solutions/tailor-made-signage");
  const section = page.locator("#features-title").locator("xpath=ancestor::section[1]");
  await expect(section.locator("#features-title")).toHaveText("What You Get");

  // One column per feature: the feature on top, a big number below, vertical rules between.
  const columns = section.locator(".counter-cols > div");
  const count = await columns.count();
  expect(count).toBeGreaterThanOrEqual(4);
  await expect(section.locator(".counter-cols dt").first()).toHaveText("Custom Design");
  await expect(section.locator(".counter-cols dd .visually-hidden").first()).toHaveText("01");
  await expect(section.locator(".check-list")).toHaveCount(0);
  expect(await columns.first().evaluate((el) => getComputedStyle(el).borderRightWidth)).toBe("1px");

  // The columns sit side by side on one row.
  // (offsetTop ignores the entrance animation's movement.)
  const tops = await columns.evaluateAll((els) => els.map((el) => el.offsetTop));
  expect(new Set(tops).size).toBe(1);

  // "Where it is used" follows as its own section.
  const used = page.locator("#used-title");
  await expect(used).toHaveText("Where It Is Used");
  const a = await section.boundingBox();
  const b = await used.boundingBox();
  expect(b.y).toBeGreaterThan(a.y + a.height - 1);
});

test("Where it is used: a fanned photo deck (auto-play, no cut-off cards) on the left, every industry with a + icon on the right (10e)", async ({
  page,
}) => {
  await page.goto("/solutions/tailor-made-signage");
  const section = page.locator("#used-title").locator("xpath=ancestor::section[1]");
  const deck = section.locator(".card-deck");
  await deck.scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Pause the photo deck" }).click();

  // The front card stands in the middle with one smaller card on each side, fully inside the
  // deck (no cut-off cards, client 24 Oct 2026).
  const cards = section.locator(".card-deck__card:not(.is-far)");
  expect(await cards.count()).toBe(3);
  await page.waitForTimeout(1000); // the cards have settled
  const boxes = await cards.evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, w: r.width, front: el.classList.contains("is-active") };
    }),
  );
  const front = boxes.find((b) => b.front);
  const d = await deck.boundingBox();
  expect(Math.abs(front.x - (d.x + d.width / 2))).toBeLessThan(4);
  for (const b of boxes.filter((b) => !b.front)) expect(b.w).toBeLessThan(front.w);
  expect(boxes.some((b) => b.x < front.x)).toBe(true);
  expect(boxes.some((b) => b.x > front.x)).toBe(true);
  const edges = await cards.evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return [r.left, r.right];
    }),
  );
  for (const [left, right] of edges) {
    expect(left).toBeGreaterThanOrEqual(d.x - 1);
    expect(right).toBeLessThanOrEqual(d.x + d.width + 1);
  }

  // Auto-play only: no arrows and no dots, just the pause/play button.
  await expect(deck.locator(".card-deck__dots")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Previous photo|Next photo/ })).toHaveCount(0);

  // The arrow keys (on the focused play button) and a click on a side card change it.
  const current = () => section.locator(".card-deck__card.is-active").getAttribute("aria-label");
  await expect.poll(current).toBe("1 of 7");
  await page.getByRole("button", { name: "Play the photo deck" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(current).toBe("2 of 7");
  await page.keyboard.press("ArrowRight");
  await expect.poll(current).toBe("3 of 7");
  await page.waitForTimeout(900);
  const right = boxes.reduce((a, b) => (b.x > a.x ? b : a));
  await page.mouse.click(right.x + right.w / 2 - 10, (await deck.boundingBox()).y + 120);
  await expect.poll(current).toBe("4 of 7");

  // A drag to the left brings the next card forward.
  const box = await section.locator(".card-deck__stage").boundingBox();
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.7, y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(box.x + box.width * (0.7 - i * 0.03), y);
  await page.mouse.up();
  await expect.poll(current).toBe("5 of 7");

  // The front card opens the full photo.
  await section.locator(".card-deck__card.is-active button").click();
  await expect(page.locator(".yarl__container")).toBeVisible();
  await page.keyboard.press("Escape");

  // All industries from the client's text, each with a + icon.
  const items = section.locator(".used-list li");
  expect(await items.count()).toBeGreaterThanOrEqual(8);
  await expect(items.first()).toContainText("Corporate offices");
  await expect(items.first().locator("svg, .bi").first()).toBeVisible();

  // Deck on the left, list on the right.
  const l = await section.locator(".used-list").boundingBox();
  expect(d.x + d.width).toBeLessThanOrEqual(l.x + 1);
});

test("Where it is used: the deck plays by itself, and stands still with reduced motion (10e)", async ({
  browser,
}) => {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    const context = await browser.newContext({ reducedMotion });
    const page = await context.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/solutions/tailor-made-signage");
    const deck = page.locator(".card-deck");
    await deck.scrollIntoViewIfNeeded();
    await page.mouse.move(5, 5); // not over the deck
    const current = () => deck.locator(".card-deck__card.is-active").getAttribute("aria-label");
    if (reducedMotion === "reduce") {
      await expect(deck.getByRole("button", { name: "Play the photo deck" })).toBeVisible();
      await page.waitForTimeout(4500);
      expect(await current()).toBe("1 of 7");
    } else {
      await expect.poll(current, { timeout: 8000 }).toBe("2 of 7");
    }
    await context.close();
  }
});

test("What you get stacks in two columns on a phone without sideways scroll (10e)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/solutions/tailor-made-signage");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("every solution hero is only the title and the photo; the client's Overview follows (10f)", async ({
  page,
}) => {
  await page.goto("/solutions");
  const slugs = await page
    .locator('a[href^="/solutions/"]')
    .evaluateAll((els) => [...new Set(els.map((a) => a.getAttribute("href")))]);
  expect(slugs.length).toBe(8);

  for (const href of slugs) {
    await page.goto(href);
    const hero = page.locator(".inner-hero");
    await expect(hero.locator("h1")).toHaveCount(1);
    await expect(hero.locator(".inner-hero__vertical")).toHaveCount(0); // like the home banner
    // No paragraph and no button in the hero.
    await expect(hero.locator("p")).toHaveCount(0);
    await expect(hero.locator("a.btn, button")).toHaveCount(0);

    // The Overview section comes right after the hero, before What you get.
    const overview = page.locator("#overview-title").locator("xpath=ancestor::section[1]");
    await expect(overview.locator("#overview-title")).toHaveText("Overview");
    expect((await overview.locator("p").first().innerText()).length, href).toBeGreaterThan(80);
    const heroBox = await hero.boundingBox();
    const overviewBox = await overview.boundingBox();
    const featuresBox = await page.locator("#features-title").boundingBox();
    expect(overviewBox.y).toBeGreaterThanOrEqual(heroBox.y + heroBox.height - 1);
    expect(featuresBox.y).toBeGreaterThan(overviewBox.y);
  }
});

test("the Tailor-made Overview is the client's paragraph, word for word (10f)", async ({
  page,
}) => {
  await page.goto("/solutions/tailor-made-signage");
  await expect(page.locator("#overview-title").locator("xpath=ancestor::section[1]")).toContainText(
    "Every space has unique communication and branding needs. Insta Mark designs and manufactures tailor-made signage solutions that seamlessly integrate with your architecture, brand identity, and operational requirements. From premium corporate offices and hospitals to retail destinations, airports, and residential developments, our bespoke signage systems are engineered for aesthetics, durability, and functionality.",
  );
});

// ── Our work on site: ring gallery (client, 24 Oct 2026) ──────────

/**
 * Centre x of every card that is on screen, and its width.
 * @param {import("@playwright/test").Page} page
 * @returns {Promise<{ i: number, x: number, w: number }[]>}
 */
async function ringCards(page) {
  return page.locator(".ring-gallery__card").evaluateAll((els) =>
    els
      .map((el, i) => {
        const r = el.getBoundingClientRect();
        return { i, x: r.left + r.width / 2, w: r.width, shown: getComputedStyle(el).opacity };
      })
      .filter((c) => c.shown === "1"),
  );
}

/**
 * Centre x of one card.
 * @param {import("@playwright/test").Page} page
 * @param {number} i
 * @returns {Promise<number>}
 */
async function cardX(page, i) {
  return page
    .locator(".ring-gallery__card")
    .nth(i)
    .evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.left + r.width / 2;
    });
}

test("Our work on site: photos stand on a ring, smallest in the middle and bigger towards both edges", async ({
  page,
}) => {
  await page.goto("/solutions/tailor-made-signage");
  const stage = page.locator(".ring-gallery__stage");
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute("aria-label", /executed projects/);
  await page.waitForTimeout(500);

  const cards = await ringCards(page);
  expect(cards.length).toBeGreaterThanOrEqual(6);
  const mid = 720;
  const centre = cards.reduce((a, b) => (Math.abs(a.x - mid) < Math.abs(b.x - mid) ? a : b));
  const left = cards.reduce((a, b) => (a.x < b.x ? a : b));
  const right = cards.reduce((a, b) => (a.x > b.x ? a : b));
  expect(left.w).toBeGreaterThan(centre.w);
  expect(right.w).toBeGreaterThan(centre.w);

  // Every photo opens in the lightbox; copies that fill the ring are hidden from screen readers.
  const count = await page.locator(".ring-gallery__card:not([aria-hidden]) button").count();
  expect(count).toBeGreaterThan(0);
});

test("Our work on site: the ring drifts slowly left to right, a drag moves it and sets its direction", async ({
  page,
}) => {
  await page.goto("/solutions/tailor-made-signage");
  const stage = page.locator(".ring-gallery__stage");
  await stage.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  // Drifts to the right by itself, slowly.
  const cards = await ringCards(page);
  const i = cards.reduce((a, b) => (Math.abs(a.x - 720) < Math.abs(b.x - 720) ? a : b)).i;
  const a = await cardX(page, i);
  await page.waitForTimeout(1500);
  const b = await cardX(page, i);
  expect(b).toBeGreaterThan(a + 2);
  expect(b).toBeLessThan(a + 120);

  // A drag to the left moves the cards left, and they keep drifting left afterwards.
  const box = await stage.boundingBox();
  const y = box.y + box.height / 2;
  await page.mouse.move(900, y);
  await page.mouse.down();
  for (let x = 900; x >= 600; x -= 30) await page.mouse.move(x, y);
  await page.mouse.up();
  await page.waitForTimeout(2000); // the fling has slowed down
  const c = await cardX(page, i);
  await page.waitForTimeout(1500);
  const d = await cardX(page, i);
  expect(d).toBeLessThan(c - 2);

  // The pause button stops it.
  await page.getByRole("button", { name: "Pause the photos" }).click();
  await page.waitForTimeout(300);
  const e = await cardX(page, i);
  await page.waitForTimeout(1000);
  expect(Math.abs((await cardX(page, i)) - e)).toBeLessThan(1);
  await expect(page.getByRole("button", { name: "Play the photos" })).toBeVisible();
});

test("Our work on site: a click opens the photo in the lightbox", async ({ page }) => {
  await page.goto("/solutions/tailor-made-signage");
  await page.locator(".ring-gallery__stage").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Pause the photos" }).click();
  await page.locator(".ring-gallery__card:not([aria-hidden]) button").first().focus();
  await page.waitForTimeout(800); // focus turns the photo to the middle
  await page.keyboard.press("Enter");
  await expect(page.locator(".yarl__container")).toBeVisible();
});

test("Our work on site: with reduced motion the ring stands still", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/solutions/tailor-made-signage");
  await page.locator(".ring-gallery__stage").scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Play the photos" })).toBeVisible();
  const a = await cardX(page, 0);
  await page.waitForTimeout(1000);
  expect(Math.abs((await cardX(page, 0)) - a)).toBeLessThan(1);
  await context.close();
});

// Client, 24 Oct 2026: every section heading starts each word with a capital letter
// (Title Case); short words (a, and, of, on, the, …) stay small inside a heading. Questions
// (FAQs, the call to action) and full sentences (statements of more than 8 words, such as
// the vision) keep sentence case, as they read better that way.
test("section headings on every public page are in Title Case", async ({ page }) => {
  await page.goto("/solutions");
  const slugs = await page
    .locator('a[href^="/solutions/"]')
    .evaluateAll((els) => [...new Set(els.map((a) => a.getAttribute("href")))]);
  const small = new Set([
    "a",
    "an",
    "and",
    "as",
    "at",
    "by",
    "for",
    "from",
    "in",
    "of",
    "on",
    "or",
    "the",
    "to",
    "&",
  ]);
  const wrong = [];
  for (const route of ["/", "/about", "/solutions", "/contact", "/privacy-policy", ...slugs]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    const headings = await page
      .locator("main h1, main h2, main h3")
      .evaluateAll((els) => els.map((el) => el.textContent.replace(/\s+/g, " ").trim()));
    for (const text of headings) {
      const words = text.split(" ");
      if (!text || text.endsWith("?") || words.length > 8) continue; // questions, sentences
      const bad = words.some((w, i) => /^[a-z]/.test(w) && !(i > 0 && small.has(w)));
      if (bad) wrong.push(`${route}: ${text}`);
    }
  }
  expect(wrong).toEqual([]);
});
