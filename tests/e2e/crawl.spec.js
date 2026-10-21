// Crawl of the public site + admin pages: broken links, #anchors, SEO basics, JSON-LD,
// JavaScript errors and accessibility (axe, WCAG 2.1 AA + best practice).
// Ported from the 13 Oct QA script (qa.mjs).
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { USERS } from "./fixtures.js";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"];

// reducedMotion: our motion turns off, so axe measures the final state, not a half
// faded-in element (which gave false contrast failures on 14 Oct).
// bypassCSP: only so axe can be injected; the CSP itself is not under test here.
test.use({ bypassCSP: true, reducedMotion: "reduce", viewport: { width: 1366, height: 900 } });

/**
 * Runs axe on the current page and returns readable violations.
 * @param {import("@playwright/test").Page} page
 * @param {string} path
 * @returns {Promise<string[]>}
 */
async function axeViolations(page, path) {
  const result = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  return result.violations.map(
    (v) => `${path}: [${v.impact}] ${v.id} → ${v.nodes[0]?.target?.join(" ")}`,
  );
}

test.describe.serial("public site crawl", () => {
  /** @type {string[]} */
  const seen = [];
  const report = { broken: [], anchors: [], seo: [], jsErrors: [], axe: [] };

  test("crawl every public page from the home page", async ({ page }) => {
    page.on("pageerror", (e) => report.jsErrors.push(e.message));
    const queue = ["/"];
    const titles = new Map();
    const descriptions = new Map();

    while (queue.length) {
      const path = queue.shift();
      if (seen.includes(path)) continue;
      seen.push(path);
      const resp = await page.goto(path, { waitUntil: "load" });
      const status = resp?.status() ?? 0;
      if (status >= 400) {
        report.broken.push(`${path} → ${status}`);
        continue;
      }
      const info = await page.evaluate(() => {
        const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
        const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => {
          try {
            return JSON.parse(s.textContent)["@type"];
          } catch {
            return "INVALID";
          }
        });
        return {
          links: [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")),
          ids,
          title: document.title,
          desc: document.querySelector('meta[name="description"]')?.content ?? "",
          canonical: document.querySelector('link[rel="canonical"]')?.href ?? "",
          h1: document.querySelectorAll("h1").length,
          lang: document.documentElement.lang,
          imgNoAlt: document.querySelectorAll("img:not([alt])").length,
          robots: document.querySelector('meta[name="robots"]')?.content ?? "",
          ld,
        };
      });
      for (const href of info.links) {
        if (href.startsWith("#")) {
          if (href.length > 1 && !info.ids.includes(href.slice(1)))
            report.anchors.push(`${path} → ${href}`);
          continue;
        }
        if (!href.startsWith("/") || href.startsWith("//")) continue;
        const [clean, hash] = href.split("#");
        if (hash && clean === path && !info.ids.includes(hash))
          report.anchors.push(`${path} → ${href}`);
        if (!seen.includes(clean) && !clean.startsWith("/admin") && !clean.startsWith("/_next"))
          queue.push(clean);
      }
      const issues = [];
      if (!info.title) issues.push("no <title>");
      if (titles.has(info.title) && !info.robots.includes("noindex"))
        issues.push(`duplicate title with ${titles.get(info.title)}`);
      titles.set(info.title, path);
      if (!info.desc) issues.push("no meta description");
      else if (info.desc.length > 170) issues.push(`description ${info.desc.length} chars`);
      if (descriptions.has(info.desc) && !info.robots.includes("noindex"))
        issues.push(`duplicate description with ${descriptions.get(info.desc)}`);
      descriptions.set(info.desc, path);
      const canonicalOk =
        path === "/" ? /\/$|3100$/.test(info.canonical) : info.canonical.endsWith(path);
      if (!canonicalOk) issues.push(`canonical ${info.canonical}`);
      if (info.h1 !== 1) issues.push(`${info.h1} <h1>`);
      if (info.lang !== "en-IN") issues.push(`lang=${info.lang}`);
      if (info.imgNoAlt) issues.push(`${info.imgNoAlt} img without alt`);
      if (info.ld.includes("INVALID")) issues.push("invalid JSON-LD");
      if (issues.length) report.seo.push(`${path}: ${issues.join("; ")}`);
      report.axe.push(...(await axeViolations(page, path)));
    }

    await page.goto("/this-page-does-not-exist");
    report.axe.push(...(await axeViolations(page, "/404")));

    // Every page a visitor can reach must be found by following links from the home page.
    const mustFind = [
      "/",
      "/solutions",
      "/projects",
      "/about",
      "/contact",
      "/privacy-policy",
      "/projects/sample-residential-tower",
      ...[
        "tailor-made-signage",
        "modular-signs",
        "general-signs",
        "braille-signs",
        "fire-safety-signs",
        "emergency-lights",
        "road-signs",
        "road-safety-products",
      ].map((slug) => `/solutions/${slug}`),
    ];
    expect(
      mustFind.filter((path) => !seen.includes(path)),
      "pages not reachable by links",
    ).toEqual([]);
  });

  test("no broken links or pages", () => expect(report.broken).toEqual([]));
  test("no missing #anchor targets", () => expect([...new Set(report.anchors)]).toEqual([]));
  test("no SEO issues (title, description, canonical, one h1, lang, alt, JSON-LD)", () =>
    expect(report.seo).toEqual([]));
  test("no JavaScript errors", () => expect(report.jsErrors).toEqual([]));
  test("public pages: axe WCAG 2.1 AA 0 violations", () => expect(report.axe).toEqual([]));
});

test("admin pages: axe WCAG 2.1 AA 0 violations", async ({ page }) => {
  const violations = [];
  await page.goto("/admin/login");
  violations.push(...(await axeViolations(page, "/admin/login")));
  await page.fill("#email", USERS.admin.email);
  await page.fill("#password", USERS.admin.password);
  await Promise.all([page.waitForURL("**/admin"), page.click("button[type=submit]")]);

  const paths = [
    "/admin",
    "/admin/enquiries",
    "/admin/categories",
    "/admin/projects",
    "/admin/projects/new",
    "/admin/clients",
    "/admin/faqs",
    "/admin/settings",
    "/admin/users",
    "/admin/audit",
    "/admin/account",
  ];
  const firstCategory = await page.evaluate(async () => {
    const html = await (await fetch("/admin/categories")).text();
    return (html.match(/\/admin\/categories\/(c[a-z0-9]+)/) || [])[0];
  });
  if (firstCategory) paths.push(firstCategory);

  const broken = [];
  for (const path of paths) {
    const resp = await page.goto(path);
    if ((resp?.status() ?? 0) >= 400) broken.push(`${path} → ${resp.status()}`);
    violations.push(...(await axeViolations(page, path)));
  }
  expect(broken, "admin pages load").toEqual([]);
  expect(violations).toEqual([]);
});
