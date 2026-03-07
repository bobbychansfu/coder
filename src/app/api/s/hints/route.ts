import { NextRequest } from "next/server";
import { handleGetHints } from "@/server/api/s/hint";

export async function GET(request: NextRequest) {
  return handleGetHints(request);
}
