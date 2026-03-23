import type { ManagementAction } from "@/fe/shared/types/management";

export type InstructorActionTone =
  | "success"
  | "info"
  | "purple"
  | "warning";

export type InstructorAction = ManagementAction<InstructorActionTone>;

export const instructorActions: InstructorAction[] = [
  {
    id: "manage-contests",
    title: "Manage Contests",
    description:
      "Review contest details, monitor activity, and update contest settings",
    tone: "success",
  },
  {
    id: "research-analytics",
    title: "Research Analytics",
    description:
      "A/B testing platform for hint timing systems with comprehensive research metrics",
    tone: "info",
  },
  {
    id: "create-problem",
    title: "Create Problem",
    description:
      "Author new programming problems with test cases and solutions",
    tone: "purple",
  },
  {
    id: "create-contest",
    title: "Create Contest",
    description:
      "Set up a new contest with multiple problems and time constraints",
    tone: "warning",
  },
];
