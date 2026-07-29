import ProfilePage, { type ProfileData } from "@/fe/profile/page/ProfilePage";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ProfilePageRoute() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const record = await prisma.user.findUnique({
    where: { computingId: user.computingId },
    select: {
      pointsAcquired: true,
      problemsSolved: true,
      competitionsParticipated: true,
      rank: true,
      achievements: {
        orderBy: { earnedAt: "desc" },
        select: {
          earnedAt: true,
          achievement: { select: { name: true, description: true } },
        },
      },
      participations: {
        orderBy: { contest: { startsAt: "desc" } },
        select: {
          rank: true,
          contest: { select: { name: true, startsAt: true } },
        },
      },
    },
  });

  if (!record) redirect("/login");

  const profile: ProfileData = {
    points: record.pointsAcquired,
    problemsSolved: record.problemsSolved,
    competitionsParticipated: record.competitionsParticipated,
    rank: record.rank ?? "Beginner",
    badges: record.achievements.map((entry) => ({
      title: entry.achievement.name,
      description: entry.achievement.description ?? "Achievement earned",
      earnedAt: entry.earnedAt.toISOString(),
    })),
    contests: record.participations.map((entry) => ({
      title: entry.contest.name,
      date: entry.contest.startsAt.toISOString(),
      rank: entry.rank,
    })),
  };

  return <ProfilePage user={user} profile={profile} />;
}
