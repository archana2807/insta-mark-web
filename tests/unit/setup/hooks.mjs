// Test-only resolve hooks so plain Node can load server modules:
//   "server-only"   → an empty module (Next.js provides the real guard at build time)
//   "@/content/…"  → content/…   and   "@/…" → src/…   (jsconfig.json paths)
//   bare relative / alias paths without an extension → ".js", "next/x" → "next/x.js"
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../../../", import.meta.url);

/** @param {string} url */
function withJs(url) {
  if (existsSync(fileURLToPath(url))) return url;
  for (const ext of [".js", ".jsx", "/index.js"]) {
    if (existsSync(fileURLToPath(url + ext))) return url + ext;
  }
  return url;
}

export async function resolve(specifier, context, next) {
  if (specifier === "server-only") {
    return { url: "data:text/javascript,export {};", shortCircuit: true };
  }
  if (specifier.startsWith("@/")) {
    const rel = specifier.startsWith("@/content/")
      ? specifier.slice(2)
      : `src/${specifier.slice(2)}`;
    return { url: withJs(new URL(rel, ROOT).href), shortCircuit: true };
  }
  // next has no "exports" map: plain Node ESM needs "next/navigation.js".
  if (/^next\/[a-z-]+$/.test(specifier)) return next(`${specifier}.js`, context);
  if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    const url = new URL(specifier, context.parentURL).href;
    if (!/\.[cm]?jsx?$/.test(specifier)) return { url: withJs(url), shortCircuit: true };
  }
  return next(specifier, context);
}
