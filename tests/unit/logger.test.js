// Task 08: pino JSON logs with secrets and personal data redacted (D6).
import { test } from "node:test";
import assert from "node:assert/strict";
import { Writable } from "node:stream";

const { createLogger, scrubSecrets } = await import("../../src/server/logger.js");

/** A logger that writes into an array of parsed JSON lines. */
function capture() {
  const lines = [];
  const stream = new Writable({
    write(chunk, _enc, done) {
      lines.push(JSON.parse(String(chunk)));
      done();
    },
  });
  return { log: createLogger(stream), lines };
}

test("logs are one JSON object per line with level, time, service and message", () => {
  const { log, lines } = capture();
  log.info({ enquiryId: "c123" }, "enquiry stored");
  assert.equal(lines.length, 1);
  const [line] = lines;
  assert.equal(line.level, "info");
  assert.equal(line.service, "insta-mark-web");
  assert.equal(line.msg, "enquiry stored");
  assert.equal(line.enquiryId, "c123");
  assert.ok(!Number.isNaN(Date.parse(line.time)));
});

test("secrets and visitors' personal data are redacted", () => {
  const { log, lines } = capture();
  log.warn(
    {
      email: "asha@example.com",
      user: { password: "pw-123", passwordHash: "scrypt$x", email: "a@b.c" },
      headers: { cookie: "im_admin_token=abc", authorization: "Bearer xyz" },
      enquiry: { phone: "+919820011223", token: "t" },
    },
    "check",
  );
  const text = JSON.stringify(lines[0]);
  for (const leaked of [
    "asha@example.com",
    "pw-123",
    "scrypt$x",
    "a@b.c",
    "im_admin_token=abc",
    "Bearer xyz",
    "+919820011223",
  ]) {
    assert.ok(!text.includes(leaked), `${leaked} must not be logged`);
  }
});

test("errors keep their message and stack, without credentials", () => {
  const { log, lines } = capture();
  const err = new Error(
    "connect failed: postgresql://neondb_owner:S3cret@ep-x.neon.tech/neondb password=hunter2",
  );
  log.error({ err }, "db down");
  const logged = lines[0].err;
  assert.equal(logged.type, "Error");
  assert.match(logged.message, /connect failed: postgresql:\/\/\[redacted\]@ep-x\.neon\.tech/);
  assert.ok(!JSON.stringify(logged).includes("S3cret"));
  assert.ok(!JSON.stringify(logged).includes("hunter2"));
  assert.match(logged.stack, /logger\.test\.js/);
});

test("scrubSecrets leaves normal text alone", () => {
  assert.equal(scrubSecrets("Enquiry c123 saved"), "Enquiry c123 saved");
  assert.equal(scrubSecrets(undefined), undefined);
});
