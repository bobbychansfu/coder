import { NextRequest } from "next/server";
import { handleGetProblemDetails } from "@/server/api/s/problem";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cid: string; pid: string }> }
) {
  const { cid, pid } = await params;
  return handleGetProblemDetails(request, cid, pid);
}
