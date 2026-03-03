import { NextResponse } from "next/server";
import { handleLogout } from "@/server/api/auth/logout";

export const runtime = "nodejs";

export function POST(): NextResponse {
  return handleLogout();
}
