import {
  contestDetailsById,
  type ContestProblem,
} from "@/fe/contests/data/contestDetails";
import {
  buildProblemDetail,
  type ProblemDetail,
} from "@/fe/contests/data/problemDetails";
import { practiceProblems } from "@/fe/practice/data/practiceProblems";

const templateProblems: ContestProblem[] = [
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
];

const normalizeDifficulty = (
  value: string,
): ContestProblem["difficulty"] => {
  const lowered = value.toLowerCase();
  if (lowered === "easy" || lowered === "medium" || lowered === "hard") {
    return lowered;
  }
  return "medium";
};

const getTemplateProblem = (index: number): ContestProblem => {
  if (!templateProblems.length) {
    return {
      code: "A",
      title: "Two Sum",
      difficulty: "easy",
      tags: ["arrays", "hash-table"],
      timeComplexity: "O(n)",
      spaceComplexity: "O(n)",
      solvedBy: 2847,
      points: 100,
      solved: false,
    };
  }

  return templateProblems[index % templateProblems.length];
};

const fallbackProblem: ContestProblem = {
  code: "A",
  title: "Two Sum",
  difficulty: "easy",
  tags: ["arrays", "hash-table"],
  timeComplexity: "O(n)",
  spaceComplexity: "O(n)",
  solvedBy: 2847,
  points: 100,
  solved: false,
};

const contest1PracticeProblem =
  contestDetailsById["contest-1"]?.problems.find((problem) => problem.code === "A") ??
  templateProblems[0] ??
  fallbackProblem;

export const practice1MockDetail = buildProblemDetail(contest1PracticeProblem);

export const practiceProblemDetailsById: Record<string, ProblemDetail> = practiceProblems.reduce(
  (acc, problem, index) => {
    const template = getTemplateProblem(index);
    if (problem.id === "problem-1") {
      acc[problem.id] = practice1MockDetail;
      return acc;
    }

    const contestProblem: ContestProblem = {
      ...template,
      title: problem.title,
      difficulty: normalizeDifficulty(problem.difficulty),
      points: problem.points,
      solved: problem.solved,
    };

    acc[problem.id] = buildProblemDetail(contestProblem);
    return acc;
  },
  {} as Record<string, ProblemDetail>,
);

practiceProblemDetailsById["practice-1"] = practice1MockDetail;

export const getPracticeProblemDetail = (id: string) =>
  practiceProblemDetailsById[id] ?? null;
