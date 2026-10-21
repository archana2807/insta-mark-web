// ESLint 9 flat config. `eslint-config-next` 15.x ships the legacy format, so it is
// loaded through FlatCompat. Run with `npm run lint`; `next build` lints too.
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/**",
      "test-results/**",
      "playwright-report/**",
      "blob-report/**",
      "components/ui/icons.generated.js",
      "components/ui/icons.client.generated.js",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
];

export default config;
