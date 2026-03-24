import { NextRequest } from "next/server";
import { handlePatchContest } from "@/server/api/i/authoring";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ contestId: string }> },
) {
  const { contestId } = await context.params;
  return handlePatchContest(request, contestId);
}
