import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { notificationEvents } from "@/server/notifications/notificationEvents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function writeSseEvent(event: string, payload: object): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}

// Live notifications for the signed-in user. The bell loads history over tRPC;
// this stream only pushes what arrives while the page is open.
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { computingId: user.computingId },
    select: { id: true },
  });
  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let close = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const unsubscribe = notificationEvents.subscribe(dbUser.id, (notification) => {
        if (!closed) {
          controller.enqueue(writeSseEvent("notification", notification));
        }
      });
      const heartbeatId = setInterval(() => {
        if (!closed) {
          controller.enqueue(new TextEncoder().encode(": keepalive\n\n"));
        }
      }, 15000);

      close = () => {
        if (closed) {
          return;
        }
        closed = true;
        clearInterval(heartbeatId);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Stream is already closed.
        }
      };

      controller.enqueue(writeSseEvent("connected", {}));
      request.signal.addEventListener("abort", () => close());
    },
    cancel() {
      close();
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
