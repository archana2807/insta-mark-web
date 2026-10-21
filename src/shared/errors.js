// THE error catalog (2-ARCHITECTURE §9): every error code, its HTTP status and the
// message users see. Shared by the browser and the server. Field-rule texts
// ("Please enter your name.") live with their Zod schemas in ./schemas.

/** @type {Record<string, { status: number, message: string }>} */
export const ERRORS = {
  // General
  VALIDATION_FAILED: { status: 422, message: "Please correct the highlighted fields." },
  INVALID_INPUT: { status: 400, message: "Invalid input." },
  FORBIDDEN: { status: 403, message: "You don't have access to this." },
  NOT_FOUND: { status: 404, message: "We couldn't find what you were looking for." },
  INTERNAL_ERROR: { status: 500, message: "Something went wrong. Please try again." },

  // Enquiry form
  ENQUIRY_TOO_FAST: {
    status: 422,
    message: "That was very quick! Please check your details and submit again.",
  },
  CAPTCHA_FAILED: {
    status: 422,
    message: "We couldn't verify you're human. Please wait a moment and submit again.",
  },
  ENQUIRY_RATE_LIMITED: {
    status: 429,
    message: "Too many enquiries from your network. Please try again in a few minutes.",
  },
  ENQUIRY_NOT_SAVED: {
    status: 503,
    message:
      "Sorry, we couldn't submit your enquiry right now. Please try again shortly or contact us directly.",
  },

  // Login and account
  AUTH_INVALID_CREDENTIALS: { status: 401, message: "Invalid email or password." },
  AUTH_RATE_LIMITED: {
    status: 429,
    message: "Too many attempts. Please wait a few minutes and try again.",
  },
  AUTH_LOCKED: {
    status: 423,
    message: "This account is temporarily locked. Try again in 15 minutes.",
  },
  AUTH_CURRENT_PASSWORD_WRONG: { status: 422, message: "Current password is incorrect." },
  ADMIN_DB_NOT_CONFIGURED: {
    status: 503,
    message: "The admin panel needs a database (DATABASE_URL).",
  },
  AUTH_SECRET_NOT_CONFIGURED: {
    status: 503,
    message: "AUTH_SECRET is not configured on the server.",
  },

  // Users
  USER_NOT_FOUND: { status: 404, message: "User not found." },
  USER_EMAIL_TAKEN: { status: 409, message: "A user with this email already exists." },
  USER_SELF_LOCKOUT: {
    status: 422,
    message: "You cannot deactivate yourself or remove your own admin role.",
  },
  USER_LAST_ADMIN: { status: 422, message: "At least one active administrator is required." },

  // Content
  ENQUIRY_NOT_FOUND: { status: 404, message: "Enquiry not found." },
  CATEGORY_NOT_FOUND: { status: 404, message: "Category not found." },
  PROJECT_NOT_FOUND: { status: 404, message: "Project not found." },
  PROJECT_SLUG_TAKEN: { status: 409, message: "This URL is already used by another project." },
  FAQ_NOT_FOUND: { status: 404, message: "FAQ not found." },
  CLIENT_LOGO_NOT_FOUND: { status: 404, message: "Logo not found." },
  IMAGE_NOT_FOUND: { status: 404, message: "Image not found." },

  // Uploads
  UPLOAD_NOT_CONFIGURED: { status: 503, message: "Cloudinary is not configured." },
  UPLOAD_NOT_VERIFIED: { status: 422, message: "Upload could not be verified." },
  UPLOAD_MISSING: { status: 422, message: "Please upload the logo image first." },
};

/** @typedef {keyof typeof ERRORS} ErrorCode */

/**
 * The safe message for a code; unknown codes get the generic one.
 * @param {string | undefined | null} code
 * @returns {string}
 */
export function errorMessage(code) {
  return (ERRORS[code] ?? ERRORS.INTERNAL_ERROR).message;
}

/**
 * Message to show for a failed action result: a field-rule text when the server sent
 * one, otherwise the catalog message for the code.
 * @param {{ code?: string, message?: string } | null | undefined} result
 * @returns {string}
 */
export function resultMessage(result) {
  return result?.message ?? errorMessage(result?.code);
}
