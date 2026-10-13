import { NextRequest, NextResponse } from "next/server";
import { handleSignup } from "@/server/api/auth/signup";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleSignup(request);
}
