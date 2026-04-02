import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import {
  findDbUserIdByComputingId,
  getPracticeSubmissionRecordForUser,
  mapPracticeRunRecordToSubmissionPayload,
} from "@/server/practice/submissionService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dbUserId = await findDbUserIdByComputingId(user.computingId);
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { submissionId } = await params;
  const record = await getPracticeSubmissionRecordForUser({
    submissionId,
    userId: dbUserId,
  });

  if (!record) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  return NextResponse.json(mapPracticeRunRecordToSubmissionPayload(record));
}
