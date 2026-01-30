export type InstructorActionTone = "primary" | "secondary" | "accent";

export interface InstructorAction {
  id: string;
  title: string;
  description: string;
  tone: InstructorActionTone;
}

export const instructorActions: InstructorAction[] = [
  {
    id: "analytics",
    title: "Analytics Dashboard",
    description:
      "View student performance, submission statistics, and course analytics",
    tone: "primary",
  },
  {
    id: "create-problem",
    title: "Create Problem",
    description:
      "Author new programming problems with test cases and solutions",
    tone: "secondary",
  },
  {
    id: "create-contest",
    title: "Create Contest",
    description:
      "Set up a new contest with multiple problems and time constraints",
    tone: "accent",
  },
];
