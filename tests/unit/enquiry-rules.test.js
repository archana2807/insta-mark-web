import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cleanField,
  cleanLine,
  cleanText,
  normalizePhone,
  suggestEmail,
  validateField,
} from "../../src/shared/schemas/enquiry-rules.js";

const check = (name, value, opts) => validateField(name, cleanField(name, value), opts);

test("name accepts letters in any script and rejects digits or HTML", () => {
  for (const ok of ["Shristi Aggarwal", "D'Souza", "श्रुति शर्मा", "R. K. Mehta"]) {
    assert.equal(check("name", ok), null, ok);
  }
  for (const bad of ["", "a", "John123", "<script>", ".."]) {
    assert.ok(check("name", bad), `should reject ${JSON.stringify(bad)}`);
  }
});

test("email needs a strict format", () => {
  assert.equal(check("email", "a.b@company.co.in"), null);
  for (const bad of ["a@b", "a..b@x.com", "a@x.c", "name@gmail"]) {
    assert.ok(check("email", bad), bad);
  }
});

test("email typo suggestions fix common domains only", () => {
  assert.equal(suggestEmail("ravi@gmail.co"), "ravi@gmail.com");
  assert.equal(suggestEmail("ravi@gmial.com"), "ravi@gmail.com");
  assert.equal(suggestEmail("ravi@insta-mark.in"), null);
  assert.equal(suggestEmail("ravi@gmail.com"), null);
});

test("phone numbers are normalised to E.164 and dummy numbers are rejected", () => {
  assert.equal(normalizePhone("98200 12345"), "+919820012345");
  assert.equal(normalizePhone("022 2345 6789"), "+912223456789");
  assert.equal(normalizePhone("+91 22 2345 6789"), "+912223456789");
  assert.equal(normalizePhone("+44 20 7946 0958"), "+442079460958");
  for (const bad of [
    "9999999999",
    "9876543210",
    "1234567890",
    "+91 0000000000",
    "12345",
    "98200abc45",
    "5820012345",
    "+91 9820 0123",
  ]) {
    assert.equal(normalizePhone(bad), null, bad);
  }
});

test("message allows two links but rejects HTML links and link spam", () => {
  assert.equal(check("message", "Need 40 signs for a hospital.\n\nSee www.example.com"), null);
  assert.ok(check("message", "<a href=x>buy</a>"));
  assert.ok(check("message", "http://a http://b http://c"));
});

test("company and location reject links, every time (no stateful regex)", () => {
  assert.equal(check("company", "Lodha Group"), null);
  for (let i = 0; i < 3; i++) assert.ok(check("company", "www.x.com"), `run ${i + 1}`);
  assert.ok(check("company", "http://spam.biz"));
});

test("requirement must be one of the options or Other", () => {
  const opts = { requirementOptions: ["Modular Signs"] };
  assert.equal(check("requirement", ""), null);
  assert.equal(validateField("requirement", "Other", opts), null);
  assert.equal(validateField("requirement", "Modular Signs", opts), null);
  assert.ok(validateField("requirement", "Hacked", opts));
});

test("sanitising removes invisible characters and extra blank lines", () => {
  assert.equal(cleanLine("  a​  b‮ "), "a b");
  assert.equal(cleanText("a  \r\n\r\n\r\n\r\nb"), "a\n\nb");
});
