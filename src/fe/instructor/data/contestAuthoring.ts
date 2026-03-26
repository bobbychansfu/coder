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
  contestProblemsTitle: string;
  contestProblemsDescription: string;
  addProblemsLabel: string;
  emptyProblemsTitle: string;
  emptyProblemsDescription: string;
  aiHintTitle: string;
  aiHintDescription: string;
  aiHintEnabledLabel: string;
  aiHintDisabledLabel: string;
  aiHintDisabledTitle: string;
  aiHintDisabledDescription: string;
  groupConfigurationTitle: string;
  groupAHintLabel: string;
  groupBHintLabel: string;
  cooldownLabel: string;
  assignmentTitle: string;
  assignmentBadge: string;
  assignmentDescription: string;
  assignmentFootnote: string;
  draftsTitle: string;
  draftsDescription: string;
  contestStatusTitle: string;
  visibilityTitle: string;
  visibilityDescription: string;
  visibilityLabel: string;
  publishLabel: string;
  selectProblemsTitle: string;
  selectProblemsDescription: string;
  selectedCountSuffix: string;
  previewModalTitle: string;
  previewBadgeLabel: string;
  previewCloseLabel: string;
  previewReadonlyCopy: string;
  previewProblemsTitle: string;
}

export type ContestDifficulty = "easy" | "medium" | "hard";

export interface ContestDraftRecord {
  id: string;
  title: string;
  date: string;
  status: string;
  problemsCount: number;
  durationMinutes: number;
}

export interface ContestProblemRecord {
  id: string;
  title: string;
  difficulty: ContestDifficulty;
  points: number;
  tags: string[];
}

export interface ContestFormDraft {
  contestName: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  visibility: "course-only" | "public" | "private";
}

export interface ContestPreviewFallback {
  title: string;
  description: string;
  start: string;
  end: string;
}

export interface ContestAiHintConfig {
  groupAHintAfterMinutes: number;
  groupBHintAfterMinutes: number;
  cooldownMinutes: number;
  groupsSummary: string;
  assignmentLabel: string;
  assignmentDescription: string;
  assignmentFootnote: string;
}

export const contestAuthoringCopy: ContestAuthoringCopy = {
  backButtonLabel: "Back",
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
  scheduleDescription: "Fill any two of start, end",
  startLabel: "Start",
  endLabel: "End",
  contestProblemsTitle: "Contest Problems",
  contestProblemsDescription: "Select problems to include in this contest",
  addProblemsLabel: "Add Problems",
  emptyProblemsTitle: "No problems added yet",
  emptyProblemsDescription: 'Click "Add Problems" to get started',
  aiHintTitle: "AI Hint Experiment",
  aiHintDescription: "Configure AI hint timing and student group assignment",
  aiHintEnabledLabel: "Enabled",
  aiHintDisabledLabel: "Disabled",
  aiHintDisabledTitle: "AI Hint Experiment is disabled",
  aiHintDisabledDescription:
    "Enable the toggle above to configure hint timing and group assignment.",
  groupConfigurationTitle: "Group Configuration",
  groupAHintLabel: "Hints available after (min)",
  groupBHintLabel: "Hints available after (min)",
  cooldownLabel: "Cooldown between hint requests: 2 minutes",
  assignmentTitle: "Assignment Method",
  assignmentBadge: "Only method",
  assignmentDescription: "Students are evenly and automatically split across groups",
  assignmentFootnote:
    "Students will be randomly and evenly assigned to Group A and Group B.",
  draftsTitle: "My Contest Drafts",
  draftsDescription: "Previously saved contest drafts - not yet published",
  contestStatusTitle: "Contest Status",
  visibilityTitle: "Visibility",
  visibilityDescription: "Control who can see this contest",
  visibilityLabel: "Visibility *",
  publishLabel: "Publish Contest",
  selectProblemsTitle: "Select Problems",
  selectProblemsDescription: "Choose problems from your problem bank to include in this contest",
  selectedCountSuffix: "selected",
  previewModalTitle: "Contest Preview",
  previewBadgeLabel: "Student View",
  previewCloseLabel: "Close Preview",
  previewReadonlyCopy: "This is a read-only preview of the student-facing contest page.",
  previewProblemsTitle: "Problems",
};

export const contestDrafts: ContestDraftRecord[] = [
  {
    id: "draft-week5-lab",
    title: "Week 5 Lab Contest",
    date: "2/19/2026",
    status: "Draft",
    problemsCount: 4,
    durationMinutes: 120,
  },
  {
    id: "draft-recursion-challenge",
    title: "Recursion Challenge",
    date: "2/17/2026",
    status: "Draft",
    problemsCount: 0,
    durationMinutes: 90,
  },
];

export const contestProblemLibrary: ContestProblemRecord[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "easy",
    points: 100,
    tags: ["arrays", "hash-table"],
  },
  {
    id: "binary-tree-traversal",
    title: "Binary Tree Traversal",
    difficulty: "medium",
    points: 200,
    tags: ["trees", "recursion"],
  },
  {
    id: "merge-k-sorted-lists",
    title: "Merge K Sorted Lists",
    difficulty: "hard",
    points: 300,
    tags: ["linked-list", "divide-conquer"],
  },
  {
    id: "valid-palindrome",
    title: "Valid Palindrome",
    difficulty: "easy",
    points: 100,
    tags: ["strings", "two-pointers"],
  },
  {
    id: "longest-increasing-subsequence",
    title: "Longest Increasing Subsequence",
    difficulty: "medium",
    points: 250,
    tags: ["dynamic-programming", "binary-search"],
  },
  {
    id: "graph-shortest-path",
    title: "Graph Shortest Path",
    difficulty: "medium",
    points: 200,
    tags: ["graphs", "bfs"],
  },
];

export const contestPreviewFallback: ContestPreviewFallback = {
  title: "week5 lab",
  description: "hello",
  start: "Mar 5, 2026, 1:07 PM",
  end: "Mar 28, 2026, 5:10 PM",
};

export const contestAiHintConfig: ContestAiHintConfig = {
  groupAHintAfterMinutes: 5,
  groupBHintAfterMinutes: 10,
  cooldownMinutes: 2,
  groupsSummary: "A, B",
  assignmentLabel: "Random",
  assignmentDescription: "Students are evenly and automatically split across groups",
  assignmentFootnote:
    "Students will be randomly and evenly assigned to Group A and Group B.",
};

export const contestFormDraft: ContestFormDraft = {
  contestName: "",
  description: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  visibility: "public",
};
