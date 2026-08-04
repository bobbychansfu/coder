import { NextRequest, NextResponse } from "next/server";
import { handleCreateGuestUser, handleListGuestUsers } from "@/server/api/admin/guestUsers";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  return handleListGuestUsers();
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleCreateGuestUser(request);
}
