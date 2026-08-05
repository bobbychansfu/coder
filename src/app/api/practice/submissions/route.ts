import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import {
  createPracticeSubmission,
  findDbUserIdByComputingId,
  judgePracticeSubmissionEphemerally,
  parseSubmissionLanguage,
} from "@/server/practice/submissionService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(["student", "instructor", "admin"] as const).includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = body as {
    problemId?: string;
    language?: string;
    code?: string;
  };

  const problemId = payload.problemId?.trim();
  const language = parseSubmissionLanguage(payload.language);
  const code = payload.code ?? "";

  if (!problemId) {
    return NextResponse.json({ error: "Missing problemId" }, { status: 400 });
  }

  if (!language) {
    return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
  }

  if (!code.trim()) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  try {
    if (user.role === "instructor" || user.role === "admin") {
      const payload = await judgePracticeSubmissionEphemerally({
        problemId,
        language,
        code,
      });

      return NextResponse.json({
        ...payload,
        persisted: false,
      });
    }

    const dbUserId = await findDbUserIdByComputingId(user.computingId);
    if (!dbUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const submission = await createPracticeSubmission({
      userId: dbUserId,
      problemId,
      language,
      code,
    });

    return NextResponse.json({
      submissionId: submission.id,
      status: "queued",
      persisted: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create submission";
    const status = message === "Problem not found." ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
