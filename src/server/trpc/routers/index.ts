import { router } from "../init";
import { dashboardMetadataRouter } from "./dashboardMetadata";
import { practiceRouter } from "./practice";

export const appRouter = router({
  practice: practiceRouter,
  dashboardMetadata: dashboardMetadataRouter,
});
export type AppRouter = typeof appRouter;
