// Fixed-window rate limiting, shared by the enquiry form and the admin login.
import "server-only";
import * as rateLimitRepository from "./rate-limit.repository";

/**
 * Counts a hit for `key` in the current window.
 * @param {string} key
 * @param {{ max: number, windowMs: number }} limit
 * @returns {Promise<boolean>} true when the limit is exceeded
 */
export async function isRateLimited(key, { max, windowMs }) {
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  return (await rateLimitRepository.addHit(key, windowStart)) > max;
}

/**
 * Retention: delete windows older than `before`.
 * @param {Date} before
 * @returns {Promise<number>}
 */
export async function purgeOlderThan(before) {
  return rateLimitRepository.removeOlderThan(before);
}
