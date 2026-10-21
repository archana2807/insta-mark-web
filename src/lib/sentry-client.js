// Browser error reporting (D6). Sentry's browser SDK is about 80 KB, so it is loaded
// only when NEXT_PUBLIC_SENTRY_DSN is set, and lazily: it never slows the first paint
// (Lighthouse ≥ 90 goal). Without the DSN this file does nothing.

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

let sentry;

/** @returns {Promise<typeof import("@sentry/nextjs") | null>} */
export function loadSentry() {
  if (!dsn) return Promise.resolve(null);
  sentry ??= import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      // Errors only: no performance tracing and no session replay (privacy, free tier).
      tracesSampleRate: 0,
      sendDefaultPii: false,
    });
    return Sentry;
  });
  return sentry;
}

/**
 * Sends an error to Sentry when it is on.
 * @param {unknown} error
 * @returns {void}
 */
export function reportClientError(error) {
  loadSentry().then((Sentry) => Sentry?.captureException(error));
}
