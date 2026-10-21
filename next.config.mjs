import { fileURLToPath } from "node:url";
import { getEnv } from "./src/server/config/env.js";

// Refuse to build or start with a missing or invalid environment (R-11.8).
getEnv();

const isDev = process.env.NODE_ENV !== "production";
// Pin the workspace root: a stray lockfile in a parent folder otherwise makes
// Next.js infer the wrong root for file tracing.
const projectRoot = fileURLToPath(new URL(".", import.meta.url));

// Content-Security-Policy: Next.js needs inline scripts/styles for hydration;
// 'unsafe-eval' only in dev (React Refresh). Extend hosts here when GA4 /
// Turnstile / maps embeds are enabled.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://www.googletagmanager.com https://*.google-analytics.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://challenges.cloudflare.com https://api.cloudinary.com",
  "frame-src https://www.google.com https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: projectRoot,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  sassOptions: {
    // Bootstrap 5.3 still uses @import and legacy colour functions; silence
    // the Dart Sass deprecation noise for dependencies only.
    quietDeps: true,
    silenceDeprecations: ["import", "global-builtin", "color-functions", "legacy-js-api"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
