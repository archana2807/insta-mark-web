import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/server/auth/token";

/**
 * Fast gate for /admin: unsigned/expired sessions never reach admin pages.
 * Full checks (user active, password unchanged, role) run in requireAdmin().
 */
export async function middleware(request) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  let session = null;
  try {
    session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  } catch {
    session = null; // AUTH_SECRET missing → treat as logged out
  }
  if (session) return NextResponse.next();

  const url = new URL("/admin/login", request.url);
  if (pathname !== "/admin") url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
