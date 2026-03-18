import { router } from "../init";
import { dashboardMetadataRouter } from "./dashboardMetadata";
import { practiceRouter } from "./practice";
import { practiceExecutionRouter } from "./practiceExecution";

export const appRouter = router({
  practice: practiceRouter,
  practiceExecution: practiceExecutionRouter,
  dashboardMetadata: dashboardMetadataRouter,
});
export type AppRouter = typeof appRouter;
