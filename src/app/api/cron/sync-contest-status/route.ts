import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Cron endpoint: keeps Contest.status in sync with wall-clock time.
 *
 * Called every minute by Vercel Cron (vercel.json) or an equivalent scheduler.
 * Secured with CRON_SECRET so it cannot be triggered by arbitrary clients.
 *
 * Rules applied to non-DRAFT, non-ARCHIVED, non-DELETED contests:
 *   startsAt > now              → UPCOMING
 *   startsAt <= now < endsAt    → ACTIVE
 *   endsAt <= now               → ENDED
 *
 * Contests with no endsAt and no durationMinutes are treated as never-ending
 * and are only flipped UPCOMING → ACTIVE (never ENDED).
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret") ?? request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const contests = await prisma.contest.findMany({
    where: {
      status: { notIn: ["DRAFT"] },
      manageStatus: { notIn: ["ARCHIVED", "DELETED"] },
    },
    select: {
      id: true,
      status: true,
      startsAt: true,
      endsAt: true,
      durationMinutes: true,
    },
  });

  let updated = 0;

  await Promise.all(
    contests.map(async (contest) => {
      const endsAt =
        contest.endsAt ??
        (contest.durationMinutes
          ? new Date(contest.startsAt.getTime() + contest.durationMinutes * 60 * 1000)
          : null);

      let nextStatus: "UPCOMING" | "ACTIVE" | "ENDED";

      if (contest.startsAt > now) {
        nextStatus = "UPCOMING";
      } else if (endsAt && endsAt <= now) {
        nextStatus = "ENDED";
      } else {
        nextStatus = "ACTIVE";
      }

      if (nextStatus === contest.status) return;

      await prisma.contest.update({
        where: { id: contest.id },
        data: { status: nextStatus },
      });
      updated++;
    }),
  );

  return NextResponse.json({ ok: true, checked: contests.length, updated, timestamp: now.toISOString() });
}
