import { prisma } from "@/lib/prisma";
import { BADGE_DEFINITIONS } from "./shared";

export async function ensureBadgeCatalog(): Promise<Map<string, string>> {
  await Promise.all(
    BADGE_DEFINITIONS.map((badge) =>
      prisma.achievement.upsert({
        where: { code: badge.code },
        update: {
          name: badge.name,
          description: badge.description,
        },
        create: {
          code: badge.code,
          name: badge.name,
          description: badge.description,
        },
      }),
    ),
  );

  const achievements = await prisma.achievement.findMany({
    where: { code: { in: BADGE_DEFINITIONS.map((badge) => badge.code) } },
    select: { id: true, code: true },
  });

  return new Map(
    achievements
      .filter((achievement) => achievement.code)
      .map((achievement) => [achievement.code as string, achievement.id]),
  );
}
