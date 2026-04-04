import type { SvgIconComponent } from "@mui/icons-material";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";

export type ManageContentTab = "contests" | "problems";

export type ManagedContestStatus = "active" | "upcoming" | "draft" | "ended" | "archived";

export type ManagedContestStatusFilter = "all" | ManagedContestStatus;
export type ManagedProblemStatus = "public" | "contest-only" | "draft" | "archived";
export type ManagedProblemStatusFilter = "all" | ManagedProblemStatus;
export type ManagedProblemDifficulty = "easy" | "medium" | "hard";

export interface ManageContentTabOption {
  value: ManageContentTab;
  label: string;
  icon?: SvgIconComponent;
  disabled?: boolean;
}

export interface ManageContentViewConfig {
  searchPlaceholder: string;
  emptyTitle: string;
  emptyDescription: string;
  tableHeaders: string[];
}

export interface FilterChipOption<T extends string = string> {
  value: T;
  label: string;
}

export const MANAGE_CONTENT_TABS: ManageContentTabOption[] = [
  {
    value: "contests",
    label: "Contests",
    icon: EmojiEventsOutlinedIcon,
  },
  {
    value: "problems",
    label: "Problems",
    icon: CodeRoundedIcon,
  },
];

export const MANAGE_CONTEST_STATUS_FILTERS: FilterChipOption<ManagedContestStatusFilter>[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "upcoming", label: "Upcoming" },
  { value: "draft", label: "Draft" },
  { value: "ended", label: "Ended" },
  { value: "archived", label: "Archived" },
];

export const MANAGED_CONTEST_STATUS_LABELS: Record<ManagedContestStatus, string> = {
  active: "Active",
  upcoming: "Upcoming",
  draft: "Draft",
  ended: "Ended",
  archived: "Archived",
};

export const MANAGE_PROBLEM_STATUS_FILTERS: FilterChipOption<ManagedProblemStatusFilter>[] = [
  { value: "all", label: "All" },
  { value: "public", label: "Public" },
  { value: "contest-only", label: "Contest-only" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

export const MANAGED_PROBLEM_STATUS_LABELS: Record<ManagedProblemStatus, string> = {
  public: "Public",
  "contest-only": "Contest-only",
  draft: "Draft",
  archived: "Archived",
};

export const DEFAULT_MANAGE_CONTENT_TAB: ManageContentTab = "problems";

export const MANAGE_CONTENT_VIEW_CONFIG: Record<ManageContentTab, ManageContentViewConfig> = {
  contests: {
    searchPlaceholder: "Search contests...",
    emptyTitle: "No contests found",
    emptyDescription: "Try a different search or pick another status filter.",
    tableHeaders: ["Contest", "Status", "Schedule", "Enrolled", "Submitted", "Actions"],
  },
  problems: {
    searchPlaceholder: "Search problems...",
    emptyTitle: "No problems found",
    emptyDescription: "Try a different search or pick another status filter.",
    tableHeaders: ["Problem", "Status", "Difficulty", "Tags", "Actions"],
  },
};
