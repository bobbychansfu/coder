import { AI_HINT_COOLDOWN_SECONDS, AI_HINT_DAILY_LIMIT } from "@/lib/aiHintLimits";

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
  // Keyed by VISIBILITY_OPTIONS value
  visibilityHelp: Record<string, string>;
  allowedUsersLabel: string;
  allowedUsersPlaceholder: string;
  joinLinkLabel: string;
  scoringRuleTitle: string;
  scoringRuleLabel: string;
  showDifficultyLabel: string;
  openForUpsolvingLabel: string;
  openForUpsolvingHelp: string;
  teamSizeLabel: string;
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

export interface ContestProblemRecord {
  id: string;
  title: string;
  difficulty: ContestDifficulty;
  points: number;
  tags: string[];
  source?: "public" | "contest-only";
}

export type ContestScoringRule = "points" | "icpc";

export const CONTEST_SCORING_RULE_OPTIONS: { value: ContestScoringRule; label: string }[] = [
  { value: "points", label: "Problem score" },
  { value: "icpc", label: "ICPC" },
];

export interface ContestFormDraft {
  contestName: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  visibility: "course-only" | "public" | "private";
  scoringRule: ContestScoringRule;
  maxTeamSize: number;
  // Private contests: computing IDs or emails, as typed
  allowedUsers: string;
  groupAHintAfterMinutes: number;
  groupBHintAfterMinutes: number;
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
  cooldownLabel: `Hint limits per student: 1 every ${AI_HINT_COOLDOWN_SECONDS} seconds, ${AI_HINT_DAILY_LIMIT} per day`,
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
  visibilityHelp: {
    public: "Every signed-in student can see and register for it.",
    "course-only": "For now this works the same as Public; no course check is applied yet.",
    private:
      "Only students on the allowed users list, or who open the join link, can see and register for it.",
  },
  allowedUsersLabel: "Allowed users",
  allowedUsersPlaceholder: "Computing IDs or emails",
  joinLinkLabel: "Join link",
  scoringRuleTitle: "Scoring Rule",
  scoringRuleLabel: "Scoring rule *",
  showDifficultyLabel: "Show problem difficulty",
  openForUpsolvingLabel: "Open for upsolving after it ends",
  openForUpsolvingHelp:
    "After the contest ends, every student can open it and submit, even if they never registered " +
    "and even if it is private. Registered contestants can upsolve either way. Submissions after " +
    "the end never change the scoreboard.",
  teamSizeLabel: "Max team size",
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
  scoringRule: "points",
  maxTeamSize: 3,
  allowedUsers: "",
  groupAHintAfterMinutes: contestAiHintConfig.groupAHintAfterMinutes,
  groupBHintAfterMinutes: contestAiHintConfig.groupBHintAfterMinutes,
};
