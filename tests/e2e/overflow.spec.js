// No sideways scroll at phone width (390 px) and no console errors.
// Motion stays ON here: the scroll drift effects are what could widen the page.
import { test, expect } from "@playwright/test";

const PAGES = [
  "/",
  "/about",
  "/solutions",
  "/solutions/tailor-made-signage",
  "/contact",
  "/this-page-does-not-exist",
];

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

for (const path of PAGES) {
  test(`no horizontal overflow at 390 px: ${path}`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      // The 404 page's own document request is expected to log a 404.
      if (m.type() === "error" && !/status of 404/.test(m.text())) errors.push(m.text());
    });
    // "load", not "networkidle": a page full of lazy photos (e.g. a solution page on a phone) can
    // keep image requests open on a slow CI runner, and width does not depend on them (every
    // image has its width and height set). The scroll below still loads them all.
    await page.goto(path, { waitUntil: "load" });

    let widest = 0;
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y <= height; y += 500) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(80);
      widest = Math.max(widest, await page.evaluate(() => document.documentElement.scrollWidth));
    }

    expect(widest, "document scrollWidth while scrolling").toBeLessThanOrEqual(390);
    expect(errors, "console errors").toEqual([]);
  });
}
