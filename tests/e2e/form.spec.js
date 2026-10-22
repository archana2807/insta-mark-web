// Enquiry form: the 16 browser checks of 13 Oct (form-e2e.mjs), the no-JavaScript
// server path, and what is actually stored in the test database.
import { test, expect } from "@playwright/test";
import { resetLimits, testPrisma } from "./db.js";

const P = "#contact-form-";
const FORM = "form.enquiry-form";
const SUBMIT = `${FORM} button[type=submit]`;

test.beforeAll(() => resetLimits());

test.describe.serial("enquiry form (browser, JavaScript on)", () => {
  /** @type {import("@playwright/test").Page} */
  let page;
  /** @type {import("@playwright/test").Page} */
  let fastPage;
  const jsErrors = [];

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on("pageerror", (e) => jsErrors.push(e.message));
    page.on("console", (m) => m.type() === "error" && jsErrors.push(m.text()));
    await page.goto("/contact?utm_source=e2e", { waitUntil: "networkidle" });
  });
  test.afterAll(() => page.close());

  test("1. form is noValidate after hydration", async () => {
    await expect(page.locator(`${FORM}[novalidate]`)).toHaveCount(1);
  });

  test("2. empty submit is blocked client-side: 3 errors, focus on name", async () => {
    await page.click(SUBMIT);
    await expect(page.locator(".alert-danger li")).toHaveCount(3);
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("contact-form-name");
  });

  test("3. blur validation on a bad name", async () => {
    await page.fill(`${P}name`, "R2D2");
    await page.press(`${P}name`, "Tab");
    await expect(page.locator(`${P}name-error`)).toContainText("letters only");
  });

  test("4. aria-invalid is set on the invalid field", async () => {
    await expect(page.locator(`${P}name`)).toHaveAttribute("aria-invalid", "true");
  });

  test("5. error clears while typing", async () => {
    await page.fill(`${P}name`, "Ravi Kumar");
    await expect(page.locator(`${P}name-error`)).toHaveCount(0);
  });

  test("6. email typo suggestion can be applied", async () => {
    await page.fill(`${P}email`, "ravi@gmial.com");
    await page.press(`${P}email`, "Tab");
    await expect(page.locator(`${P}email-suggest`)).toContainText("ravi@gmail.com");
    await page.click(`${P}email-suggest button`);
    await expect(page.locator(`${P}email`)).toHaveValue("ravi@gmail.com");
  });

  test("7. dummy phone number is rejected", async () => {
    await page.fill(`${P}phone`, "9876543210");
    await page.press(`${P}phone`, "Tab");
    await expect(page.locator(`${P}phone-error`)).toHaveCount(1);
  });

  test("8. message counter counts characters", async () => {
    await page.fill(`${P}message`, "Hello there");
    await expect(page.locator(`${P}message-count`)).toContainText("11 /");
  });

  test("9. message with 3 links is rejected", async () => {
    await page.fill(`${P}message`, "see http://a.com http://b.com http://c.com");
    await page.press(`${P}message`, "Tab");
    await expect(page.locator(`${P}message-error`)).toHaveCount(1);
  });

  test("10. tampered requirement value is rejected", async () => {
    await page.fill(`${P}phone`, "98200 12345");
    await page.fill(`${P}message`, "Need 30 wayfinding signs for a hospital in Thane.");
    await page.$eval(`${P}requirement`, (s) => {
      const o = document.createElement("option");
      o.value = "Hacked";
      o.textContent = "x";
      s.appendChild(o);
      s.value = "Hacked";
    });
    await page.waitForTimeout(2600); // the form's time trap
    await page.click(SUBMIT);
    await expect(page.locator(`${P}requirement-error`)).toContainText("choose a solution");
  });

  test("11. values are kept after an error", async () => {
    await expect(page.locator(`${P}name`)).toHaveValue("Ravi Kumar");
  });

  test("12. valid submit goes to the thank-you page", async () => {
    await page.selectOption(`${P}requirement`, { index: 1 });
    await page.fill(`${P}company`, "  Acme​   Infra  ");
    await page.waitForTimeout(2600);
    await Promise.all([page.waitForURL("**/thank-you"), page.click(SUBMIT)]);
  });

  test("13. too-fast submit is rejected, never a fake success", async ({ browser }) => {
    fastPage = await browser.newPage();
    await fastPage.goto("/contact", { waitUntil: "load" });
    await fastPage.waitForSelector(`${FORM}[novalidate]`, { state: "attached" });
    await fastPage.fill(`${P}name`, "Fast Bot");
    await fastPage.fill(`${P}email`, "bot@example.com");
    await fastPage.fill(`${P}phone`, "98200 54321");
    await fastPage.click(SUBMIT);
    await expect(fastPage.locator(".alert-danger")).toContainText("very quick");
    expect(fastPage.url()).not.toContain("thank-you");
  });

  test("14. error summary is focused after a server error", async () => {
    // Same page as test 13: its error came back from the server.
    await expect(fastPage.locator(".alert-danger")).toBeFocused();
    await fastPage.close();
  });

  test("15. without JavaScript the native required attributes are present", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const p3 = await ctx.newPage();
    await p3.goto("/contact");
    await expect(p3.locator(`${FORM} [required]`)).toHaveCount(3);
    await ctx.close();
  });

  test("16. error view has no overflow at 390 px", async ({ browser }) => {
    const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await m.goto("/contact", { waitUntil: "networkidle" });
    await m.click(SUBMIT);
    await m.waitForSelector(".alert-danger");
    expect(await m.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await m.close();
    expect(jsErrors, "JavaScript errors on the form page").toEqual([]);
  });
});

/**
 * Posts the contact form the way a browser without JavaScript does
 * (server-action fields copied from the server-rendered HTML).
 * @param {string} baseURL
 * @param {Record<string, string>} fields
 * @returns {Promise<{ status: number, location: string | null, errors: string[] }>}
 */
async function postWithoutJs(baseURL, fields) {
  const html = await (await fetch(`${baseURL}/contact`)).text();
  const form = html.match(/<form class="enquiry-form[^"]*"[\s\S]*?<\/form>/)[0];
  const body = new FormData();
  for (const m of form.matchAll(/<(?:input|select|textarea)([^>]*)>/g)) {
    const name = m[1].match(/name="([^"]+)"/)?.[1];
    if (!name) continue;
    const value = (m[1].match(/value="([^"]*)"/)?.[1] ?? "")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&");
    body.append(name, value);
  }
  for (const [k, v] of Object.entries(fields)) body.set(k, v);
  const res = await fetch(`${baseURL}/contact`, {
    method: "POST",
    body,
    redirect: "manual",
    headers: { origin: baseURL }, // browsers always send it
  });
  const text = await res.text();
  const errors = [...text.matchAll(/id="contact-form-([a-zA-Z]+)-error"/g)].map((m) => m[1]);
  return { status: res.status, location: res.headers.get("location"), errors };
}

test.describe.serial("enquiry form (server path, no JavaScript)", () => {
  test.beforeAll(() => resetLimits());

  test("server rejects bad name, email, phone and a tampered requirement", async ({ baseURL }) => {
    const r = await postWithoutJs(baseURL, {
      name: "Bob1",
      email: "bob@gmail",
      phone: "1111111111",
      requirement: "Hacked",
    });
    expect(r.status).toBe(200);
    expect(r.errors.sort()).toEqual(["email", "name", "phone", "requirement"]);
  });

  test("valid post without JavaScript redirects to /thank-you", async ({ baseURL }) => {
    const r = await postWithoutJs(baseURL, {
      name: "Asha Patil",
      email: "Asha@Company.in",
      phone: "+91 22 2345 6789",
      requirement: "Modular Signs",
      message: "Need   signs.\n\n \n\n \nThanks",
    });
    expect(r.status).toBe(303);
    expect(r.location).toContain("/thank-you");
  });
});

test("stored enquiries are sanitised and normalised in the test database", async () => {
  const prisma = testPrisma();
  try {
    const rows = await prisma.enquiry.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        name: true,
        company: true,
        email: true,
        phone: true,
        utmSource: true,
        message: true,
      },
    });
    const ravi = rows.find((r) => r.name === "Ravi Kumar");
    expect(ravi, "browser enquiry stored").toBeTruthy();
    expect(ravi.company).toBe("Acme Infra"); // zero-width char and extra spaces removed
    expect(ravi.phone).toBe("+919820012345");
    expect(ravi.utmSource).toBe("e2e");
    const asha = rows.find((r) => r.name === "Asha Patil");
    expect(asha, "no-JS enquiry stored").toBeTruthy();
    expect(asha.email).toBe("asha@company.in");
    expect(asha.phone).toBe("+912223456789");
    expect(asha.message).toBe("Need signs.\n\nThanks");
    expect(
      rows.some((r) => r.name === "Fast Bot"),
      "too-fast submit not stored",
    ).toBe(false);
  } finally {
    await prisma.$disconnect();
  }
});
