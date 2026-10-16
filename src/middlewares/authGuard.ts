import { NextRequest, NextResponse } from "next/server";
import { REQUEST_PATH_HEADER } from "@/lib/loginPath";
import { withNextPath } from "@/lib/safeNextPath";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

function hasValidSessionCookie(request: NextRequest): boolean {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return Boolean(cookieValue && cookieValue !== "null" && cookieValue !== "undefined");
}

export function authGuard(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  if (
    pathname === "/login" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  if (hasValidSessionCookie(request)) {
    // The cookie may still be rejected (expired, revoked); pages read this to send
    // the visitor back here after signing in again.
    const headers = new Headers(request.headers);
    headers.set(REQUEST_PATH_HEADER, `${pathname}${search}`);
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.redirect(new URL(withNextPath("/login", `${pathname}${search}`), request.url));
}
