// Task 06: a catalog error message, an empty state, and server-side pagination.
import { test, expect } from "@playwright/test";
import { hashPassword } from "../../src/server/auth/password.js";
import { ERRORS } from "../../src/shared/errors.js";
import { resetLimits, testPrisma } from "./db.js";

test.describe.configure({ mode: "serial" });

const ADMIN = { email: "errors-admin@test.local", name: "Errors Admin", role: "ADMIN" };
const PASSWORD = "Errors-Test-Pass-1";
const PREFIX = "E2E-Page-";

test.beforeAll(async () => {
  await resetLimits();
  const prisma = testPrisma();
  const passwordHash = await hashPassword(PASSWORD);
  await prisma.adminUser.upsert({
    where: { email: ADMIN.email },
    create: { ...ADMIN, passwordHash },
    update: { ...ADMIN, passwordHash, isActive: true },
  });
  await prisma.$disconnect();
});

test.beforeEach(async ({ page }) => {
  await resetLimits();
  await page.goto("/admin/login");
  await page.fill("#email", ADMIN.email);
  await page.fill("#password", PASSWORD);
  await Promise.all([page.waitForURL("**/admin"), page.click("button[type=submit]")]);
});

test("a duplicate user email shows the catalog message, nothing technical", async ({ page }) => {
  await page.goto("/admin/users");
  await page.fill("#u-name", "Someone Else");
  await page.fill("#u-email", ADMIN.email);
  await page.selectOption("#u-role", "EDITOR");
  await page.fill("#u-pw", "Another-Pass-123");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  const alert = page.locator(".alert-danger").first();
  await expect(alert).toContainText(ERRORS.USER_EMAIL_TAKEN.message);
  await expect(alert).not.toContainText(/prisma|unique constraint|stack|P2002/i);
});

test("an empty list shows the empty state", async ({ page }) => {
  await page.goto("/admin/clients");
  await expect(page.getByText("No logos yet — the strip is hidden on the website.")).toBeVisible();
  await page.goto("/admin/enquiries?q=no-such-enquiry-anywhere");
  await expect(page.getByText("No enquiries match these filters.")).toBeVisible();
});

test("a section shows the loading screen while it loads from the sidebar", async ({ page }) => {
  // Slow down only the FAQ section's data (also its prefetch) so the loading screen shows.
  await page.route(/\/admin\/faqs/, async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });
  await page.goto("/admin");
  const nav = page.getByRole("navigation", { name: "Admin" }).first();
  await nav.getByRole("link", { name: "FAQs" }).click();
  await expect(page.locator(".admin-loading [role=status]")).toContainText("Loading…");
  await expect(page.getByRole("heading", { level: 1, name: "FAQs" })).toBeVisible();
  await expect(page.locator(".admin-loading [role=status]")).toHaveCount(0);
});
