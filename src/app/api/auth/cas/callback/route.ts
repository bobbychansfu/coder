import { NextRequest, NextResponse } from "next/server";
import { handleCasCallback } from "@/server/api/auth/casLogin";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleCasCallback(request);
}
