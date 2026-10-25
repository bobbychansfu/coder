import { z } from "zod";
import { adminProcedure, router } from "../init";
import { getAiHintsEnabled, setAiHintsEnabled } from "@/server/siteSettings";

export const adminSettingsRouter = router({
  get: adminProcedure.query(async () => ({
    aiHintsEnabled: await getAiHintsEnabled(),
  })),

  setAiHintsEnabled: adminProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await setAiHintsEnabled(input.enabled, ctx.user.computingId);
      return { aiHintsEnabled: input.enabled };
    }),
});
