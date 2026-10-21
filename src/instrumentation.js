// Server and Edge start-up (Next.js instrumentation hook): turns Sentry on when
// SENTRY_DSN is set (D6). Without it nothing is initialised and nothing is sent.
import * as Sentry from "@sentry/nextjs";
import { getEnv } from "@/server/config/env";

/** Called once per runtime when the server starts. */
export async function register() {
  const env = getEnv();
  if (!env.SENTRY_DSN) return;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.VERCEL_ENV ?? env.NODE_ENV,
    // Errors only; no performance tracing for now (lean, free tier).
    tracesSampleRate: 0,
    // Never send visitors' personal data, cookies or request bodies.
    sendDefaultPii: false,
  });
}

/** Errors thrown while rendering or in route handlers / server actions. */
export const onRequestError = Sentry.captureRequestError;
