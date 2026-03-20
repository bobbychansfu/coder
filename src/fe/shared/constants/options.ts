import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";

export const LANGUAGE_OPTIONS = [
  { value: "cplusplus", label: "C++", monacoLanguage: "cpp" },
  { value: "java", label: "Java", monacoLanguage: "java" },
  { value: "python", label: "Python", monacoLanguage: "python" },
  { value: "typescript", label: "TypeScript", monacoLanguage: "typescript" },
  { value: "javascript", label: "JavaScript", monacoLanguage: "javascript" },
];

export const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export const VISIBILITY_OPTIONS = [
  { value: "contest-only", label: "contest-only" },
  { value: "public", label: "public" },
  { value: "draft", label: "draft" },
];

export const PROBLEM_TAG_GROUPS = [
  {
    label: "Data Structures",
    tags: ["arrays", "hash-table", "linked-list", "stack", "queue", "trees", "heap", "trie"],
  },
  {
    label: "Algorithms",
    tags: [
      "binary-search",
      "sorting",
      "two-pointers",
      "sliding-window",
      "recursion",
      "divide-conquer",
      "greedy",
      "backtracking",
      "dynamic-programming",
    ],
  },
  {
    label: "Graph",
    tags: ["graphs", "bfs", "dfs", "shortest-path"],
  },
  {
    label: "Other",
    tags: ["strings", "bit-manipulation", "math"],
  },
] as const;

export const SUBMISSION_STATUS_CONFIG = {
  accepted: {
    label: "Accepted",
    color: "#00a63e",
    icon: CheckCircleOutlineRoundedIcon,
  },
  wrong: {
    label: "Wrong Answer",
    color: "#e7000b",
    icon: CancelOutlinedIcon,
  },
  tle: {
    label: "Time Limit Exceeded",
    color: "#f54900",
    icon: AccessTimeOutlinedIcon,
  },
} as const;

export const CONTEST_STATUS_CONFIG = {
  upcoming: { label: "upcoming", background: "#eceef2", color: "#030213" },
  "in progress": { label: "in progress", background: "#f97316", color: "#ffffff" },
  closed: { label: "closed", background: "#f3f4f6", color: "#4b5563" },
} as const;

export const PRACTICE_FILTERS = [
  {
    label: "Category",
    options: [
      { label: "All", active: true },
      { label: "Arrays" },
      { label: "Strings" },
      { label: "Trees" },
      { label: "Graphs" },
      { label: "Dynamic Programming" },
      { label: "Sorting" },
    ],
  },
  {
    label: "Difficulty",
    options: [
      { label: "All", active: true },
      { label: "Easy" },
      { label: "Medium" },
      { label: "Hard" },
    ],
  },
  {
    label: "Status",
    options: [
      { label: "All" },
      { label: "Completed" },
      { label: "Not Started" },
    ],
  },
];
