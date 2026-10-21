// Reporting unexpected server errors: always to the logs, and to Sentry when it is on
// (SENTRY_DSN set). Expected errors (catalog codes) are never reported here.
import "server-only";
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/server/logger";

/** Replaceable in unit tests. */
export const reporters = {
  /** @param {unknown} err */
  sentry: (err) => Sentry.captureException(err),
};

/**
 * @param {unknown} err
 * @param {string} [what] short description for the log line
 * @returns {void}
 */
export function reportError(err, what = "unexpected error") {
  logger.error({ err }, what);
  reporters.sentry(err); // a no-op when Sentry was never initialised
}
