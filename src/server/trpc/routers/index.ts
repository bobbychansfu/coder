import { router } from "../init";
import { adminDashboardRouter } from "./adminDashboard";
import { adminTeamsRouter } from "./adminTeams";
import { adminUsersRouter } from "./adminUsers";
import { contestAuthoringRouter } from "./contestAuthoring";
import { contestTeamsRouter } from "./contestTeams";
import { dashboardMetadataRouter } from "./dashboardMetadata";
import { instructorAnalysisRouter } from "./instructorAnalysis";
import { instructorManageContentRouter } from "./instructorManageContent";
import { problemAuthoringRouter } from "./problemAuthoring";
import { instructorDashboardRouter } from "./instructorDashboard";
import { practiceRouter } from "./practice";
import { practiceExecutionRouter } from "./practiceExecution";

export const appRouter = router({
  practice: practiceRouter,
  practiceExecution: practiceExecutionRouter,
  adminDashboard: adminDashboardRouter,
  adminTeams: adminTeamsRouter,
  adminUsers: adminUsersRouter,
  dashboardMetadata: dashboardMetadataRouter,
  instructorDashboard: instructorDashboardRouter,
  instructorAnalysis: instructorAnalysisRouter,
  contestAuthoring: contestAuthoringRouter,
  contestTeams: contestTeamsRouter,
  problemAuthoring: problemAuthoringRouter,
  instructorManageContent: instructorManageContentRouter,
});
export type AppRouter = typeof appRouter;
