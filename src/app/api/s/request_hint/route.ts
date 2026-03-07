import { NextRequest } from "next/server";
import { handleRequestHint } from "@/server/api/s/hint";

export async function POST(request: NextRequest) {
  return handleRequestHint(request);
}
