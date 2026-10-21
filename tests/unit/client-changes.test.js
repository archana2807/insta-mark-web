// Task 07 (part 1): banner size rules, auto-reply content, env safety.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BANNER } from "../../src/shared/constants.js";
import { checkBannerSize } from "../../src/shared/schemas/banner.schema.js";
import { parseEnv } from "../../src/server/config/env.js";

const { buildAutoReply } = await import("../../src/server/integrations/resend/resend.adapter.js");

test("banner sizes for the client: desktop 1920 × 1720, mobile 1080 × 1080 (R-3.2)", () => {
  assert.deepEqual([BANNER.desktop.width, BANNER.desktop.height], [1920, 1720]);
  assert.deepEqual([BANNER.mobile.width, BANNER.mobile.height], [1080, 1080]);
  assert.equal(BANNER.breakpoint, 992);
});

test("banner uploads below the minimum are refused with the recommended size", () => {
  assert.equal(checkBannerSize("desktop", 1920, 1720), null);
  assert.equal(checkBannerSize("desktop", 1600, 1400), null);
  assert.equal(checkBannerSize("mobile", 900, 900), null);
  assert.match(checkBannerSize("desktop", 1200, 1720), /at least 1600 × 1400 px.*1920 × 1720/);
  assert.match(checkBannerSize("mobile", 1080, 800), /at least 900 × 900 px.*1080 × 1080/);
});

test("auto-reply repeats the thank-you wording and what the visitor sent, escaped", () => {
  const mail = buildAutoReply({
    name: "Asha <script>",
    requirement: "Road Signs",
    message: "Need 20 signs\nfor Pune",
  });
  assert.equal(mail.subject, "We have received your enquiry — Insta Mark");
  assert.match(mail.text, /our team will review your requirement and get back to you shortly/);
  assert.match(mail.text, /Requirement: Road Signs/);
  assert.ok(!mail.html.includes("<script>"), "visitor input is escaped");
  assert.match(mail.html, /Need 20 signs<br>for Pune/);
  assert.ok(!/within \d+|hours|guarantee/i.test(mail.text), "no invented promises (R-1.5)");
});

test("RESEND_BASE_URL (tests only) is refused in production", () => {
  const prod = {
    VERCEL_ENV: "production",
    NEXT_PUBLIC_SITE_URL: "https://www.example.in",
    DATABASE_URL: "postgresql://u:p@db/x",
    DIRECT_URL: "postgresql://u:p@db/x",
    AUTH_SECRET: "x".repeat(32),
    CRON_SECRET: "c",
    IP_HASH_SALT: "s",
  };
  assert.deepEqual(parseEnv(prod).errors, []);
  assert.deepEqual(parseEnv({ ...prod, RESEND_BASE_URL: "http://127.0.0.1:3110" }).errors, [
    "RESEND_BASE_URL must not be set in production",
  ]);
});
