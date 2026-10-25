import { prisma } from "@/lib/prisma";

// Admin-controlled switches (Admin -> System Settings). A missing row means the default.
const AI_HINTS_ENABLED = "aiHintsEnabled";

// Off unless an admin turns it on. A contest also needs its own AI hint setting.
export async function getAiHintsEnabled() {
  const row = await prisma.siteSetting.findUnique({ where: { key: AI_HINTS_ENABLED } });
  return row?.value === "true";
}

export async function setAiHintsEnabled(enabled: boolean, updatedBy: string) {
  const value = String(enabled);
  await prisma.siteSetting.upsert({
    where: { key: AI_HINTS_ENABLED },
    create: { key: AI_HINTS_ENABLED, value, updatedBy },
    update: { value, updatedBy },
  });
}
