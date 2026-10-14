import { prisma } from "@/lib/prisma";

// Case-insensitive, so "Ada" and "ada" cannot both be handles.
export async function nicknameTaken(nickname: string, exceptUserId?: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: {
      nickname: { equals: nickname, mode: "insensitive" },
      ...(exceptUserId ? { id: { not: exceptUserId } } : {}),
    },
    select: { id: true },
  });
  return user !== null;
}
