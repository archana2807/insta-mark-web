// ESLint 9 flat config. `eslint-config-next` 15.x ships the legacy format, so it is
// loaded through FlatCompat. Run with `npm run lint`; `next build` lints too.
import { readdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const root = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: root });

// ── Layer rules (2-ARCHITECTURE §3.1, R-11.2, R-11.4) ─────────────────
// 1. Prisma and src/server/db.js only inside *.repository.js (and db.js itself).
// 2. A module never imports another module's repository — only its service.
// 3. Views (pages, components) never import a repository.
const PRISMA = {
  group: [
    "@prisma/client",
    "@prisma/client/*",
    "@/server/db",
    "@/server/db.js",
    "**/server/db",
    "**/server/db.js",
    "../db",
    "../db.js",
    "../../db",
    "../../db.js",
    "../../../db",
    "../../../db.js",
  ],
  message: "Prisma is only allowed in *.repository.js files (2-ARCHITECTURE §3.1).",
};
const ANY_REPOSITORY = {
  group: ["**/*.repository", "**/*.repository.js"],
  message: "Read data through the module's service, not its repository.",
};
/** @param {string} own module folder name */
const otherRepositories = (own) => ({
  group: [
    "@/server/modules/*/*.repository",
    "@/server/modules/*/*.repository.js",
    `!@/server/modules/${own}/*`,
    "../*/*.repository",
    "../*/*.repository.js",
  ],
  message: "Use the other module's service, never its repository (R-11.4).",
});
const restrict = (...patterns) => ({ "no-restricted-imports": ["error", { patterns }] });

const modules = readdirSync(`${root}/src/server/modules`, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/**",
      "test-results/**",
      "playwright-report/**",
      "blob-report/**",
      "tmp-visual/**",
      "src/components/ui/icons.generated.js",
      "src/components/ui/icons.client.generated.js",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
  { files: ["src/**/*.{js,jsx,mjs}"], rules: restrict(PRISMA, ANY_REPOSITORY) },
  { files: ["src/server/db.js"], rules: restrict(ANY_REPOSITORY) },
  ...modules.flatMap((m) => [
    { files: [`src/server/modules/${m}/**/*.js`], rules: restrict(PRISMA, otherRepositories(m)) },
    { files: [`src/server/modules/${m}/*.repository.js`], rules: restrict(otherRepositories(m)) },
  ]),
];

export default config;
