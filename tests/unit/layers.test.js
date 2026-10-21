// Task 04 "Done when": Prisma only in repositories, no cross-module repository imports,
// shared schemas used by browser and server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ESLint } from "eslint";

const ROOT = new URL("../..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const eslint = new ESLint({ cwd: ROOT });

/**
 * @param {string} code
 * @param {string} filePath relative to the project root
 * @returns {Promise<string[]>} rule ids reported
 */
async function lint(code, filePath) {
  const [result] = await eslint.lintText(code, { filePath: join(ROOT, filePath) });
  return result.messages.map((m) => m.ruleId);
}

test("Prisma imported outside a repository fails lint", async () => {
  const code = 'import { PrismaClient } from "@prisma/client";\nexport const x = PrismaClient;\n';
  assert.ok(
    (await lint(code, "src/server/modules/faqs/faq.service.js")).includes("no-restricted-imports"),
  );
  assert.ok((await lint(code, "src/app/(site)/page.js")).includes("no-restricted-imports"));
  assert.deepEqual(await lint(code, "src/server/modules/faqs/faq.repository.js"), []);
});

test("src/server/db.js imported outside a repository fails lint", async () => {
  const code = 'import { getPrisma } from "@/server/db";\nexport const x = getPrisma;\n';
  assert.ok(
    (await lint(code, "src/server/modules/faqs/faq.service.js")).includes("no-restricted-imports"),
  );
  assert.deepEqual(await lint(code, "src/server/modules/faqs/faq.repository.js"), []);
});

test("a module importing another module's repository fails lint", async () => {
  const code =
    'import * as r from "@/server/modules/categories/category.repository";\nexport const x = r;\n';
  assert.ok(
    (await lint(code, "src/server/modules/faqs/faq.service.js")).includes("no-restricted-imports"),
  );
  assert.ok((await lint(code, "src/app/admin/(panel)/page.js")).includes("no-restricted-imports"));
  assert.deepEqual(await lint(code, "src/server/modules/categories/category.service.js"), []);
});

test("every module has controller/service/repository files and controllers are server actions", () => {
  const dir = join(ROOT, "src/server/modules");
  for (const mod of readdirSync(dir)) {
    const files = readdirSync(join(dir, mod));
    assert.ok(
      files.some((f) => f.endsWith(".service.js")),
      `${mod} has a service`,
    );
    for (const f of files.filter((f) => f.endsWith(".controller.js"))) {
      const src = readFileSync(join(dir, mod, f), "utf8");
      assert.match(src, /^"use server";/, `${f} starts with "use server"`);
    }
  }
});

test("browser enquiry form and server schema share the same rules", async () => {
  const form = readFileSync(join(ROOT, "src/components/forms/EnquiryForm.jsx"), "utf8");
  assert.match(form, /from "@\/shared\/schemas\/enquiry-rules"/);
  const { enquirySchema } = await import("../../src/shared/schemas/enquiry.schema.js");
  const { validateField } = await import("../../src/shared/schemas/enquiry-rules.js");
  const bad = enquirySchema.safeParse({ name: "A", email: "x@gmail.com", phone: "9820012345" });
  assert.equal(bad.success, false);
  assert.equal(bad.error.flatten().fieldErrors.name[0], validateField("name", "A"));
  const ok = enquirySchema.safeParse({ name: "Asha Rao", email: "a@b.com", phone: "98200 12345" });
  assert.equal(ok.success, true);
  assert.equal(ok.data.phone, "+919820012345");
});
