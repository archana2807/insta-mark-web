// End-to-end tests. Run through `npm run test:e2e` (tests/e2e/run.js), which seals the
// environment, starts the PGlite test database and builds the app first.
import { defineConfig, devices } from "@playwright/test";
import { TEST_APP_PORT } from "./tests/e2e/env.js";

const isCI = Boolean(process.env.CI);
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;
const chromium = { ...devices["Desktop Chrome"], launchOptions: { executablePath } };

// Suites run one after another, in this order: the crawl sees pristine data, and the
// admin suite (which edits content) runs last.
const order = ["crawl", "overflow", "form", "admin", "auth", "errors", "client-fixes"];

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.js",
  fullyParallel: false,
  workers: 1,
  retries: isCI ? 1 : 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: isCI
    ? [["list"], ["html", { open: "never" }], ["github"]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${TEST_APP_PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: order.map((name, i) => ({
    name,
    testMatch: `${name}.spec.js`,
    dependencies: i > 0 ? [order[i - 1]] : [],
    use: chromium,
  })),
  webServer: {
    command: `npx next start -p ${TEST_APP_PORT}`,
    url: `http://localhost:${TEST_APP_PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: process.env, // already sealed by tests/e2e/run.js
  },
});
