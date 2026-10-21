// The admin access-token cookie. Edge-safe (the middleware imports it), so no
// `server-only` marker and no Next.js imports.
import { isProduction } from "../config/env.js";

export const TOKEN_COOKIE = "im_admin_token";

/** One working day (D3). No refresh token. */
export const ACCESS_TOKEN_TTL = 8 * 60 * 60;

/**
 * HttpOnly, Secure in production, SameSite=Lax — never readable by page scripts.
 * @returns {{ httpOnly: true, secure: boolean, sameSite: "lax", path: string, maxAge: number }}
 */
export function tokenCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_TTL,
  };
}
