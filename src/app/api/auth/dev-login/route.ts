import { NextRequest, NextResponse } from "next/server";
import { handleDevLogin } from "@/server/api/auth/devLogin";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleDevLogin(request);
}
