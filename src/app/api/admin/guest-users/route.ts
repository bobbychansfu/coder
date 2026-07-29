import { NextRequest, NextResponse } from "next/server";
import { handleCreateGuestUser } from "@/server/api/admin/guestUsers";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleCreateGuestUser(request);
}
