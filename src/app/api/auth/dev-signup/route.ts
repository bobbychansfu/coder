import { NextRequest } from "next/server";
import { handleDevSignup } from "@/server/api/auth/devSignup";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return handleDevSignup(request);
}
