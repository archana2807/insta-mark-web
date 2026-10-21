import { NextResponse } from "next/server";
import { TOKEN_COOKIE } from "@/server/auth/cookies";
import { verifyAccessToken } from "@/server/auth/jwt";
import { can, permissionForPath } from "@/server/auth/permissions";

/**
 * Fast gate for /admin: no valid JWT → login; route not allowed for the role → denied.
 * The full check (user active, not locked, token version) runs in requireAuth().
 * @param {import("next/server").NextRequest} request
 */
export async function middleware(request) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const claims = await verifyAccessToken(request.cookies.get(TOKEN_COOKIE)?.value);
  if (!claims) {
    const url = new URL("/admin/login", request.url);
    if (pathname !== "/admin") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  const permission = permissionForPath(pathname);
  if (permission && !can(claims.role, permission)) {
    return NextResponse.redirect(new URL("/admin?denied=1", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
