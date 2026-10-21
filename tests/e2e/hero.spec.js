// Home banner text (content swapped on 21 Oct 2026, owner's decision): the big H1 is
// "Architectural Signage & Road Safety"; the small label above it is the tagline
// "Signage That Guides. Safety That Lasts.". Styling is unchanged, so the H1 must stay
// clearly bigger than the label at every width.
import { test, expect } from "@playwright/test";

const HEADLINE = "Architectural Signage & Road Safety";
const LABEL = "Signage That Guides. Safety That Lasts.";

const WIDTHS = [
  ["desktop", 1440, 900],
  ["phone", 390, 844],
];

for (const [label, width, height] of WIDTHS) {
  test(`home banner: H1 "${HEADLINE}" is bigger than the tagline label (${label})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");

    const hero = page.locator(".hero-split");
    const headline = hero.locator("h1");
    const eyebrow = hero.locator(".eyebrow");
    await expect(headline).toHaveText(HEADLINE);
    await expect(eyebrow).toHaveText(LABEL); // the label shows in capitals via CSS only
    await expect(page.locator("h1")).toHaveCount(1); // the headline is the page's only H1
    await expect(eyebrow).not.toContainText(HEADLINE);
    await expect(headline).not.toContainText(LABEL);

    const px = (locator) =>
      locator.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
    const headlineSize = await px(headline);
    const eyebrowSize = await px(eyebrow);

    // At least twice the label's size at every width (today ≈ 3–6×).
    expect(headlineSize, `h1 ${headlineSize}px vs label ${eyebrowSize}px`).toBeGreaterThanOrEqual(
      eyebrowSize * 2,
    );
  });
}
