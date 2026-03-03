import { NextResponse } from "next/server";
import { handleCasLogin } from "@/server/api/auth/casLogin";

export const runtime = "nodejs";

export async function POST(): Promise<NextResponse> {
  return handleCasLogin();
}
