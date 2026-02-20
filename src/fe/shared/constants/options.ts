import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";

export const LANGUAGE_OPTIONS = [
  { value: "cpp", label: "C++" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
];

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
      { label: "Normal" },
      { label: "Hard" },
    ],
  },
];
