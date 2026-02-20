export interface ContestAuthoringCopy {
  backButtonLabel: string;
  pageTitle: string;
  pageSubtitle: string;
  saveDraftLabel: string;
  previewLabel: string;
  basicInfoTitle: string;
  basicInfoDescription: string;
  contestNameLabel: string;
  contestNamePlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  scheduleTitle: string;
  scheduleDescription: string;
  startLabel: string;
  endLabel: string;
  durationLabel: string;
  durationPlaceholder: string;
  scheduleDividerLabel: string;
  scheduleHint: string;
  contestProblemsTitle: string;
  contestProblemsDescription: string;
  addProblemsLabel: string;
  emptyProblemsTitle: string;
  emptyProblemsDescription: string;
  draftsTitle: string;
  draftsDescription: string;
  contestStatusTitle: string;
  visibilityTitle: string;
  visibilityDescription: string;
  visibilityLabel: string;
  contestRulesTitle: string;
  publishLabel: string;
  scheduleLaterLabel: string;
  statusNewLabel: string;
  statusProblemsLabel: string;
  statusDurationLabel: string;
  statusScheduleLabel: string;
  statusDraftsLabel: string;
}

export interface ContestVisibilityOption {
  value: string;
  label: string;
}

export interface ContestDraftRecord {
  id: string;
  title: string;
  date: string;
  status: string;
  problemsCount: number;
  durationMinutes: number;
}

export interface ContestRule {
  id: string;
  text: string;
}

export interface ContestProblemRecord {
  id: string;
  title: string;
}

export interface ContestFormDraft {
  contestName: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  durationMinutes: string;
  visibility: string;
}

export const contestAuthoringCopy: ContestAuthoringCopy = {
  backButtonLabel: "Back to Contests",
  pageTitle: "Create Contest",
  pageSubtitle: "Set up a new programming contest for your students",
  saveDraftLabel: "Save Draft",
  previewLabel: "Preview",
  basicInfoTitle: "Basic Information",
  basicInfoDescription: "Set the contest name and description",
  contestNameLabel: "Contest Name *",
  contestNamePlaceholder: "e.g., Week 5 Lab Contest",
  descriptionLabel: "Description",
  descriptionPlaceholder: "Describe the contest objectives and rules...",
  scheduleTitle: "Schedule",
  scheduleDescription:
    "Fill any two of start, end, or duration - the third is auto-calculated",
  startLabel: "Start",
  endLabel: "End",
  durationLabel: "Duration (minutes)",
  durationPlaceholder: "e.g., 120",
  scheduleDividerLabel: "or just set duration",
  scheduleHint:
    "Set start + duration to auto-fill end, or start + end to auto-fill duration.",
  contestProblemsTitle: "Contest Problems",
  contestProblemsDescription: "Select problems to include in this contest",
  addProblemsLabel: "Add Problems",
  emptyProblemsTitle: "No problems added yet",
  emptyProblemsDescription: "Click \"Add Problems\" to get started",
  draftsTitle: "My Contest Drafts",
  draftsDescription: "Previously saved contest drafts - not yet published",
  contestStatusTitle: "Contest Status",
  visibilityTitle: "Visibility",
  visibilityDescription: "Control who can see this contest",
  visibilityLabel: "Visibility *",
  contestRulesTitle: "Contest Rules",
  publishLabel: "Publish Contest",
  scheduleLaterLabel: "Schedule for Later",
  statusNewLabel: "New",
  statusProblemsLabel: "Problems",
  statusDurationLabel: "Duration",
  statusScheduleLabel: "Schedule",
  statusDraftsLabel: "Drafts",
};

export const contestVisibilityOptions: ContestVisibilityOption[] = [
  { value: "course-only", label: "Course Only" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

export const contestRules: ContestRule[] = [
  { id: "submissions", text: "Students can see their submissions in real-time" },
  { id: "leaderboard", text: "Leaderboard is visible during contest" },
  { id: "late", text: "Late submissions accepted with penalty" },
];

export const contestDrafts: ContestDraftRecord[] = [
  {
    id: "draft-recursion-challenge",
    title: "Recursion Challenge",
    date: "2/17/2026",
    status: "Draft",
    problemsCount: 0,
    durationMinutes: 90,
  },
];

export const contestProblemsDraft: ContestProblemRecord[] = [];

export const contestFormDraft: ContestFormDraft = {
  contestName: "",
  description: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  durationMinutes: "",
  visibility: "course-only",
};
