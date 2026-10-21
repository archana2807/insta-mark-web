// Home banner text (client feedback, 21 Oct 2026): the big H1 "Architectural Signage &
// Road Safety", then the tagline "Signage That Guides. Safety That Lasts." as a smaller
// line UNDER it. No small label above the headline.
import { test, expect } from "@playwright/test";

const HEADLINE = "Architectural Signage & Road Safety";
const TAGLINE = "Signage That Guides. Safety That Lasts.";

const WIDTHS = [
  ["desktop", 1440, 900],
  ["phone", 390, 844],
];

for (const [label, width, height] of WIDTHS) {
  test(`home banner: big H1, smaller tagline under it, no label above (${label})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");

    const hero = page.locator(".hero-split");
    const headline = hero.locator("h1");
    const tagline = hero.locator(".hero-split__tagline");
    await expect(headline).toHaveText(HEADLINE);
    await expect(tagline).toHaveText(TAGLINE);
    await expect(page.locator("h1")).toHaveCount(1); // the headline is the page's only H1
    await expect(hero.locator(".eyebrow")).toHaveCount(0); // no small label above it

    // The tagline comes right after the headline, below it on screen.
    await expect(headline.locator("xpath=following-sibling::*[1]")).toHaveText(TAGLINE);
    const h = await headline.boundingBox();
    const t = await tagline.boundingBox();
    expect(t.y).toBeGreaterThanOrEqual(h.y + h.height - 1);

    const px = (locator) =>
      locator.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
    const headlineSize = await px(headline);
    const taglineSize = await px(tagline);
    // Clearly bigger at every width (today ≈ 2–2.8×).
    expect(headlineSize, `h1 ${headlineSize}px vs tagline ${taglineSize}px`).toBeGreaterThanOrEqual(
      taglineSize * 1.5,
    );
  });
}
