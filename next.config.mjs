import { fileURLToPath } from "node:url";
import { withSentryConfig } from "@sentry/nextjs";
import { getEnv } from "./src/server/config/env.js";

// Refuse to build or start with a missing or invalid environment (R-11.8).
const env = getEnv();

// The browser may report errors to Sentry only when the browser DSN is set (D6).
const sentryIngest = env.NEXT_PUBLIC_SENTRY_DSN
  ? ` https://${new URL(env.NEXT_PUBLIC_SENTRY_DSN).host}`
  : "";

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
  `connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://challenges.cloudflare.com https://api.cloudinary.com${sentryIngest}`,
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
  // pino uses worker threads and dynamic requires; load it from node_modules.
  serverExternalPackages: ["pino"],
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

// Source maps go to Sentry only when the upload is configured (Vercel build); otherwise
// the build is exactly as before.
const uploadSourceMaps = Boolean(env.SENTRY_AUTH_TOKEN && env.SENTRY_ORG && env.SENTRY_PROJECT);

export default uploadSourceMaps
  ? withSentryConfig(nextConfig, {
      org: env.SENTRY_ORG,
      project: env.SENTRY_PROJECT,
      authToken: env.SENTRY_AUTH_TOKEN,
      silent: true,
      telemetry: false,
      widenClientFileUpload: true,
      sourcemaps: { deleteSourcemapsAfterUpload: true },
    })
  : nextConfig;
