import { NextRequest, NextResponse } from "next/server";
import { handleCasLoginStart } from "@/server/api/auth/casLogin";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleCasLoginStart(request, "redirect");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleCasLoginStart(request, "json");
}
