import type { ContestListItem } from "@/fe/contests/data/contests";
import { contestList } from "@/fe/contests/data/contests";

export type ContestDetailStatus = "upcoming" | "in progress" | "closed";

export interface ScoreboardCell {
  points?: number;
  time?: string;
  penalty?: number;
}

export interface ScoreboardRow {
  rank: number;
  name: string;
  solved: number;
  score: number;
  problems: Record<string, ScoreboardCell>;
  isCurrentUser?: boolean;
}

export interface ClarificationItem {
  question: string;
  status: "answered" | "pending";
  response?: string;
  timeAgo: string;
}

export interface ContestProblem {
  code: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  timeComplexity: string;
  spaceComplexity: string;
  solvedBy: number;
  points: number;
  solved?: boolean;
}

export interface ContestDetail {
  id: string;
  title: string;
  status: ContestDetailStatus;
  startTime: string;
  startTimeISO: string;
  durationMinutes: number;
  problemsCount: number;
  participantsLabel: string;
  problems: ContestProblem[];
  scoreboard: ScoreboardRow[];
  clarifications: ClarificationItem[];
}

const scoreboardRows: ScoreboardRow[] = [
  {
    rank: 1,
    name: "Alice Zhang",
    solved: 5,
    score: 850,
    problems: {
      A: { points: 100, time: "0:05:32" },
      B: { points: 180, time: "0:23:15" },
      C: { points: 250, time: "0:32:10" },
      D: { points: 100, time: "0:08:45" },
      E: { points: 220, time: "0:45:22" },
    },
  },
  {
    rank: 2,
    name: "Bob Kumar",
    solved: 4,
    score: 720,
    problems: {
      A: { points: 100, time: "0:07:12" },
      B: { points: 200, time: "0:18:33" },
      D: { points: 90, time: "0:12:45" },
      E: { penalty: -5 },
    },
  },
  {
    rank: 3,
    name: "Charlie Lee",
    solved: 4,
    score: 650,
    problems: {
      A: { points: 90, time: "0:11:20" },
      B: { points: 160, time: "0:35:42" },
      D: { points: 100, time: "0:06:15" },
      E: { points: 230, time: "0:52:30" },
    },
  },
  {
    rank: 4,
    name: "Diana Martinez",
    solved: 4,
    score: 620,
    problems: {
      A: { points: 100, time: "0:08:15" },
      B: { points: 170, time: "0:28:45" },
      D: { points: 90, time: "0:15:20" },
      E: { points: 240, time: "0:58:12" },
    },
  },
  {
    rank: 5,
    name: "Ethan Wilson",
    solved: 3,
    score: 580,
    isCurrentUser: true,
    problems: {
      A: { points: 100, time: "0:09:30" },
      B: { points: 180, time: "0:32:15" },
      D: { points: 100, time: "0:18:45" },
      E: { penalty: -3 },
    },
  },
  {
    rank: 6,
    name: "Fiona Chen",
    solved: 3,
    score: 550,
    problems: {
      A: { points: 90, time: "0:12:40" },
      B: { points: 190, time: "0:25:30" },
      E: { points: 220, time: "0:48:15" },
    },
  },
  {
    rank: 7,
    name: "George Park",
    solved: 3,
    score: 520,
    problems: {
      A: { points: 100, time: "0:06:45" },
      B: { points: 160, time: "0:40:20" },
      D: { points: 100, time: "0:20:10" },
      C: { penalty: -2 },
    },
  },
  {
    rank: 8,
    name: "Hannah Smith",
    solved: 3,
    score: 490,
    problems: {
      A: { points: 90, time: "0:14:25" },
      D: { points: 100, time: "0:10:30" },
      E: { points: 230, time: "0:55:40" },
    },
  },
  {
    rank: 9,
    name: "Ivan Petrov",
    solved: 2,
    score: 450,
    problems: {
      A: { points: 100, time: "0:07:50" },
      B: { points: 200, time: "0:22:15" },
      D: { penalty: -4 },
    },
  },
  {
    rank: 10,
    name: "Julia Anderson",
    solved: 2,
    score: 420,
    problems: {
      A: { points: 90, time: "0:15:35" },
      E: { points: 240, time: "1:02:20" },
    },
  },
  {
    rank: 11,
    name: "Kevin Nguyen",
    solved: 2,
    score: 390,
    problems: {
      B: { points: 180, time: "0:38:45" },
      D: { points: 100, time: "0:16:30" },
    },
  },
  {
    rank: 12,
    name: "Laura Thompson",
    solved: 2,
    score: 360,
    problems: {
      A: { points: 100, time: "0:11:20" },
      D: { points: 90, time: "0:24:15" },
    },
  },
  {
    rank: 13,
    name: "Michael Brown",
    solved: 1,
    score: 280,
    problems: {
      B: { points: 190, time: "0:42:30" },
      A: { penalty: -2 },
    },
  },
  {
    rank: 14,
    name: "Nina Patel",
    solved: 1,
    score: 250,
    problems: {
      A: { points: 100, time: "0:18:45" },
      D: { penalty: -3 },
    },
  },
  {
    rank: 15,
    name: "Oscar Rodriguez",
    solved: 1,
    score: 220,
    problems: {
      E: { points: 230, time: "1:05:15" },
    },
  },
];

const clarifications: ClarificationItem[] = [
  {
    question: "Problem A: Can we use built-in sorting?",
    status: "answered",
    response:
      "Yes, you may use any built-in functions from the standard library.",
    timeAgo: "2 hours ago",
  },
  {
    question: "What is the maximum value of N for Problem C?",
    status: "pending",
    timeAgo: "30 minutes ago",
  },
];

const week3LabContest: ContestDetail = {
  id: "a",
  title: "Week 3 Lab Contest",
  status: "upcoming",
  startTime: "1/25/2026, 2:00:00 PM",
  startTimeISO: "2026-01-25T14:00:00",
  durationMinutes: 120,
  problemsCount: 5,
  participantsLabel: "0 registered",
  problems: [
    {
      code: "A",
      title: "Two Sum",
      difficulty: "easy",
      tags: ["arrays", "hash-table"],
      timeComplexity: "O(n)",
      spaceComplexity: "O(n)",
      solvedBy: 2847,
      points: 100,
      solved: true,
    },
    {
      code: "B",
      title: "Binary Tree Traversal",
      difficulty: "medium",
      tags: ["trees", "recursion", "dfs"],
      timeComplexity: "O(n)",
      spaceComplexity: "O(h)",
      solvedBy: 1523,
      points: 200,
    },
    {
      code: "C",
      title: "Merge K Sorted Lists",
      difficulty: "hard",
      tags: ["linked-list", "divide-conquer", "heap"],
      timeComplexity: "O(n log k)",
      spaceComplexity: "O(k)",
      solvedBy: 421,
      points: 300,
    },
    {
      code: "D",
      title: "Valid Palindrome",
      difficulty: "easy",
      tags: ["strings", "two-pointers"],
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
      solvedBy: 3421,
      points: 100,
      solved: true,
    },
    {
      code: "E",
      title: "Longest Increasing Subsequence",
      difficulty: "medium",
      tags: ["dynamic-programming", "binary-search"],
      timeComplexity: "O(n log n)",
      spaceComplexity: "O(n)",
      solvedBy: 892,
      points: 250,
    },
  ],
  scoreboard: scoreboardRows,
  clarifications,
};

const parseStatus = (status: string): ContestDetailStatus => {
  const normalized = status.toLowerCase();
  if (normalized.includes("progress") || normalized.includes("active") || normalized.includes("live")) {
    return "in progress";
  }
  if (normalized.includes("closed") || normalized.includes("ended")) {
    return "closed";
  }
  return "upcoming";
};

const buildContestDetail = (item: ContestListItem): ContestDetail => {
  const status = parseStatus(item.status);
  const participantsLabel =
    status === "in progress"
      ? "67 registered"
      : status === "closed"
        ? "118 registered"
        : "0 registered";

  return {
    ...week3LabContest,
    id: item.id,
    title: item.title,
    status,
    startTime: week3LabContest.startTime,
    startTimeISO: week3LabContest.startTimeISO,
    durationMinutes: week3LabContest.durationMinutes,
    participantsLabel,
  };
};

const generatedContestDetails = contestList.reduce<Record<string, ContestDetail>>(
  (acc, item) => {
    acc[item.id] = buildContestDetail(item);
    return acc;
  },
  {},
);

const treesGraphsChallenge: ContestDetail = {
  ...week3LabContest,
  id: "b",
  title: "Trees & Graphs Challenge",
  status: "in progress",
  startTime: "1/23/2026, 1:00:00 PM",
  startTimeISO: "2026-01-23T13:00:00",
  durationMinutes: 180,
  participantsLabel: "67 registered",
};

const arraysBasics: ContestDetail = {
  ...week3LabContest,
  id: "c",
  title: "Arrays and Strings Basics",
  status: "closed",
  startTime: "1/18/2026, 12:00:00 PM",
  startTimeISO: "2026-01-18T12:00:00",
  durationMinutes: 90,
  participantsLabel: "118 registered",
};

export const contestDetailsById: Record<string, ContestDetail> = {
  ...generatedContestDetails,
  a: week3LabContest,
  b: treesGraphsChallenge,
  c: arraysBasics,
  "contest-1": week3LabContest,
  "contest-2": treesGraphsChallenge,
  "contest-3": arraysBasics,
};
