import { NextRequest } from "next/server";
import { handleSubmitCode } from "@/server/api/s/problem";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cid: string; pid: string }> }
) {
  const { cid, pid } = await params;
  return handleSubmitCode(request, cid, pid);
}
