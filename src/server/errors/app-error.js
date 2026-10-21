// AppError: what services throw for an expected failure (a catalog code).
// attempt(): how controllers turn any error into a safe result. Unexpected errors
// are logged in full here and never reach the user.
import "server-only";
import { reportError } from "@/server/observability";
import { unstable_rethrow } from "next/navigation";
import { ERRORS, errorMessage } from "@/shared/errors";

export class AppError extends Error {
  /**
   * @param {import("@/shared/errors").ErrorCode} code catalog code
   * @param {{ field?: string, fieldErrors?: Record<string, string[]>, cause?: unknown }} [options]
   *   field: show the catalog message next to this form field
   */
  constructor(code, { field, fieldErrors, cause } = {}) {
    super(code, { cause });
    if (!ERRORS[code]) throw new Error(`Unknown error code ${code}`);
    this.name = "AppError";
    this.code = code;
    this.status = ERRORS[code].status;
    this.fieldErrors = field ? { [field]: [errorMessage(code)] } : fieldErrors;
  }
}

/**
 * Safe result for any error. Next.js redirects / notFound are re-thrown.
 * @param {unknown} err
 * @returns {{ ok: false, code: string, fieldErrors?: Record<string, string[]> }}
 */
export function toErrorResult(err) {
  unstable_rethrow(err);
  if (err instanceof AppError) {
    return err.fieldErrors
      ? { ok: false, code: err.code, fieldErrors: err.fieldErrors }
      : { ok: false, code: err.code };
  }
  reportError(err); // logs + Sentry; the user only gets the safe catalog message
  return { ok: false, code: "INTERNAL_ERROR" };
}

/**
 * Runs the controller's one service call and returns its result, or a safe error result.
 * @template T
 * @param {() => Promise<T>} fn
 * @returns {Promise<T | ReturnType<typeof toErrorResult>>}
 */
export async function attempt(fn) {
  try {
    return await fn();
  } catch (err) {
    return toErrorResult(err);
  }
}

/**
 * Result for input that failed its shared Zod schema.
 * @param {import("zod").ZodError} error
 * @returns {{ ok: false, code: "VALIDATION_FAILED", fieldErrors: Record<string, string[]> }}
 */
export function validationFailed(error) {
  return { ok: false, code: "VALIDATION_FAILED", fieldErrors: error.flatten().fieldErrors };
}

/**
 * Result for a one-line form whose first field-rule message is shown as is.
 * @param {import("zod").ZodError} error
 * @returns {{ ok: false, code: "VALIDATION_FAILED", message: string }}
 */
export function firstIssue(error) {
  return { ok: false, code: "VALIDATION_FAILED", message: error.issues[0].message };
}
