import { type NextRequest } from "next/server";
import { authGuard } from "@/middlewares/authGuard";

export function middleware(request: NextRequest) {
  return authGuard(request);
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
