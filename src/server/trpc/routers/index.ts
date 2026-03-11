import { router } from "../init";
import { practiceRouter } from "./practice";

export const appRouter = router({ practice: practiceRouter });
export type AppRouter = typeof appRouter;
