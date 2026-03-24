import { NextRequest } from "next/server";
import { handlePatchProblem } from "@/server/api/i/authoring";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ problemId: string }> },
) {
  const { problemId } = await context.params;
  return handlePatchProblem(request, problemId);
}
