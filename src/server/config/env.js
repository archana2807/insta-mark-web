// Server configuration. Task 06 turns this into the Zod-validated env module.
import "server-only";

/**
 * The database is optional: without it the site reads /content (Vercel previews, D14).
 * @returns {boolean}
 */
export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
