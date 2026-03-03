import type { NextRequest } from "next/server";
import { authMiddleware } from "./middlewares/middleware";

export function middleware(request: NextRequest) {
  return authMiddleware(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/contests/:path*",
    "/practice/:path*",
    "/instructor/:path*",
    "/admin/:path*",
  ],
};
