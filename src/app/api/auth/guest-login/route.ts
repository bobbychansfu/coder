import { NextRequest, NextResponse } from "next/server";
import { handleGuestLogin } from "@/server/api/auth/guestLogin";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleGuestLogin(request);
}
