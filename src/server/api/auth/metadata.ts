import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { buildInstructorMetadataPayload } from "./metadata/instructor";
import { recordDailyLogin, recordSyntheticSubmission } from "./metadata/persistence";
import { buildStudentMetadataPayload, syncStudentGamification } from "./metadata/student";

type Trigger = "login" | "submission" | "unknown";

function parseTrigger(body: unknown): Trigger {
  if (!body || typeof body !== "object") {
    return "unknown";
  }

  const value = (body as Record<string, unknown>).trigger;
  return value === "login" || value === "submission" ? value : "unknown";
}

function parseTargetComputingId(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const value = (body as Record<string, unknown>).targetComputingId;
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function buildStudentResponse(computingId: string) {
  const payload = await buildStudentMetadataPayload(computingId);
  if (!payload) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(payload, { status: 200 });
}

export async function handleMetadataGet(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (user.role === "student") {
      const dbUser = await prisma.user.findUnique({
        where: { computingId: user.computingId },
        select: { id: true },
      });

      if (dbUser) {
        await recordDailyLogin(dbUser.id);
      }

      return buildStudentResponse(user.computingId);
    }

    if (user.role === "instructor" || user.role === "admin") {
      return NextResponse.json(await buildInstructorMetadataPayload(user.role), { status: 200 });
    }

    return NextResponse.json({ role: user.role, message: "No metadata view for this role yet." });
  } catch (error) {
    console.error("[metadata GET] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function handleMetadataPost(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as unknown;
    const trigger = parseTrigger(body);
    const targetComputingId = parseTargetComputingId(body);

    if (user.role !== "student") {
      if (process.env.AUTH_MODE !== "dev" || !targetComputingId || trigger === "unknown") {
        return NextResponse.json({ ok: true, trigger, role: user.role }, { status: 200 });
      }

      const targetUser = await prisma.user.findUnique({
        where: { computingId: targetComputingId },
        select: { id: true, computingId: true, role: true },
      });

      if (!targetUser || targetUser.role !== "STUDENT") {
        return NextResponse.json({ error: "Target student not found" }, { status: 404 });
      }

      if (trigger === "login") {
        await recordDailyLogin(targetUser.id);
      }
      if (trigger === "submission") {
        await recordSyntheticSubmission(targetUser.id);
      }

      await syncStudentGamification(targetUser.computingId);
      const updated = await buildStudentMetadataPayload(targetUser.computingId);
      return NextResponse.json({ ok: true, trigger, targetComputingId, updated }, { status: 200 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { computingId: user.computingId },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (trigger === "login") {
      await recordDailyLogin(dbUser.id);
    }
    if (trigger === "submission") {
      await recordSyntheticSubmission(dbUser.id);
    }

    await syncStudentGamification(user.computingId);
    const payload = await buildStudentMetadataPayload(user.computingId);
    return NextResponse.json({ ok: true, trigger, computing_id: user.computingId, ...payload }, { status: 200 });
  } catch (error) {
    console.error("[metadata POST] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
