import { prisma } from "@/lib/prisma";

type PrismaClient = typeof prisma;

export interface InstructorDashboardSnapshot {
  instructor: {
    id: string;
    computingId: string;
  };
  authoredProblemsCount: number;
  contests: Array<{
    id: string;
    name: string;
    classSection: string | null;
    status: "DRAFT" | "UPCOMING" | "ACTIVE" | "ENDED";
    startsAt: Date;
    endsAt: Date | null;
    published: boolean;
    aiHintEnabled: boolean;
    participants: number;
    updatedAt: Date;
    contestProblems: Array<{
      ordering: number;
      problem: {
        id: string;
        starterCodes: Array<{ id: string }>;
      };
    }>;
    experimentGroups: Array<{
      groupName: "A" | "B" | "C";
      aiHintEnabled: boolean;
      hintDelayMinutes: number | null;
    }>;
    participations: Array<{
      userId: string;
      role: string;
      experimentGroup: "A" | "B" | "C" | null;
    }>;
    problemStatuses: Array<{
      userId: string;
      status: string;
      score: number;
      tries: number;
    }>;
    contestProblemSessions: Array<{
      userId: string;
      hintEligibleAt: Date | null;
      hintTriggeredAt: Date | null;
      solved: boolean;
    }>;
    announcements: Array<{
      id: string;
      title: string;
      createdAt: Date;
      updatedAt: Date;
      author: {
        firstName: string;
        lastName: string;
        role: "ADMIN" | "INSTRUCTOR" | "TA" | "STUDENT";
      } | null;
    }>;
  }>;
  recentAnnouncements: Array<{
    id: string;
    contestName: string;
    title: string;
    createdAt: Date;
    author: {
      firstName: string;
      lastName: string;
      role: "ADMIN" | "INSTRUCTOR" | "TA";
    };
  }>;
}

export async function loadInstructorDashboardSnapshot(
  client: PrismaClient,
  computingId: string,
): Promise<InstructorDashboardSnapshot | null> {
  const instructor = await client.user.findUnique({
    where: { computingId },
    select: {
      id: true,
      computingId: true,
    },
  });

  if (!instructor) {
    return null;
  }

  const contests = await client.contest.findMany({
    where: { instructorId: instructor.id },
    orderBy: [{ startsAt: "asc" }],
    select: {
      id: true,
      name: true,
      classSection: true,
      status: true,
      startsAt: true,
      endsAt: true,
      published: true,
      aiHintEnabled: true,
      participants: true,
      updatedAt: true,
      contestProblems: {
        select: {
          ordering: true,
          problem: {
            select: {
              id: true,
              starterCodes: {
                select: { id: true },
              },
            },
          },
        },
      },
      experimentGroups: {
        select: {
          groupName: true,
          aiHintEnabled: true,
          hintDelayMinutes: true,
        },
      },
      participations: {
        select: {
          userId: true,
          role: true,
          experimentGroup: true,
        },
      },
      problemStatuses: {
        select: {
          userId: true,
          status: true,
          score: true,
          tries: true,
        },
      },
      contestProblemSessions: {
        select: {
          userId: true,
          hintEligibleAt: true,
          hintTriggeredAt: true,
          solved: true,
        },
      },
      announcements: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      },
    },
  });

  const authoredProblemsCount = await client.problem.count({
    where: {
      OR: [
        { author: computingId },
        {
          contestLinks: {
            some: {
              contest: {
                instructorId: instructor.id,
              },
            },
          },
        },
      ],
    },
  });

  const recentAnnouncements = contests
    .flatMap((contest) =>
      contest.announcements
        .filter((announcement) => {
          const role = announcement.author?.role;
          return role === "TA" || role === "INSTRUCTOR" || role === "ADMIN";
        })
        .map((announcement) => ({
          id: announcement.id,
          contestName: contest.name,
          title: announcement.title,
          createdAt: announcement.createdAt,
          author: {
            firstName: announcement.author?.firstName ?? "Course",
            lastName: announcement.author?.lastName ?? "",
            role: announcement.author?.role ?? "TA",
          },
        })),
    )
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 5);

  return {
    instructor,
    authoredProblemsCount,
    contests,
    recentAnnouncements,
  };
}
