import { NextRequest, NextResponse } from "next/server";

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
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}
