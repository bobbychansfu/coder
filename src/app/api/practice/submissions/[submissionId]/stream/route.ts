import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { practiceSubmissionEvents } from "@/server/practice/submissionEvents";
import {
  findDbUserIdByComputingId,
  getPracticeSubmissionRecordForUser,
  mapPracticeRunRecordToSubmissionPayload,
} from "@/server/practice/submissionService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function writeSseEvent(event: string, payload: object): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}

export async function GET(
  request: NextRequest,
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

  const initialPayload = mapPracticeRunRecordToSubmissionPayload(record);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let heartbeatId: ReturnType<typeof setInterval> | null = null;
      let unsubscribe = () => {};
      const close = () => {
        if (closed) {
          return;
        }
        closed = true;
        if (heartbeatId) {
          clearInterval(heartbeatId);
        }
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Stream is already closed.
        }
      };

      const send = (event: string, payload: object) => {
        if (closed) {
          return;
        }
        controller.enqueue(writeSseEvent(event, payload));
      };

      console.info("[practice-judge] SSE client connected", { submissionId });
      send("connected", initialPayload);
      send(initialPayload.status, initialPayload);

      if (initialPayload.status === "done" || initialPayload.status === "failed") {
        close();
        return;
      }

      unsubscribe = practiceSubmissionEvents.subscribe(submissionId, (eventName, payload) => {
        send(eventName, payload);
        if (payload.status === "done" || payload.status === "failed") {
          close();
        }
      });

      heartbeatId = setInterval(() => {
        if (!closed) {
          controller.enqueue(new TextEncoder().encode(": keepalive\n\n"));
        }
      }, 15000);

      request.signal.addEventListener("abort", () => {
        console.info("[practice-judge] SSE client disconnected", { submissionId });
        close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
