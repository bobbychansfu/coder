import { router } from "../init";
import { dashboardMetadataRouter } from "./dashboardMetadata";
import { problemAuthoringRouter } from "./problemAuthoring";
import { instructorDashboardRouter } from "./instructorDashboard";
import { practiceRouter } from "./practice";
import { practiceExecutionRouter } from "./practiceExecution";

export const appRouter = router({
  practice: practiceRouter,
  practiceExecution: practiceExecutionRouter,
  dashboardMetadata: dashboardMetadataRouter,
  problemAuthoring: problemAuthoringRouter,
  instructorDashboard: instructorDashboardRouter,
});
export type AppRouter = typeof appRouter;
