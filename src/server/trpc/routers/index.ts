import { router } from "../init";
import { adminDashboardRouter } from "./adminDashboard";
import { contestAuthoringRouter } from "./contestAuthoring";
import { dashboardMetadataRouter } from "./dashboardMetadata";
import { instructorManageContentRouter } from "./instructorManageContent";
import { problemAuthoringRouter } from "./problemAuthoring";
import { instructorDashboardRouter } from "./instructorDashboard";
import { practiceRouter } from "./practice";
import { practiceExecutionRouter } from "./practiceExecution";

export const appRouter = router({
  practice: practiceRouter,
  practiceExecution: practiceExecutionRouter,
  adminDashboard: adminDashboardRouter,
  dashboardMetadata: dashboardMetadataRouter,
  instructorDashboard: instructorDashboardRouter,
  contestAuthoring: contestAuthoringRouter,
  problemAuthoring: problemAuthoringRouter,
  instructorManageContent: instructorManageContentRouter,
});
export type AppRouter = typeof appRouter;
