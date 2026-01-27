export type PracticeDifficulty = "Easy" | "Medium" | "Hard";

export interface PracticeProblem {
  id: string;
  title: string;
  difficulty: PracticeDifficulty;
  points: number;
  solved?: boolean;
}

export const practiceProblems: PracticeProblem[] = [
  {
    id: "problem-1",
    title: "Two Sum",
    difficulty: "Easy",
    points: 100,
    solved: true,
  },
  {
    id: "problem-2",
    title: "Binary Tree Traversal",
    difficulty: "Medium",
    points: 200,
  },
  {
    id: "problem-3",
    title: "Merge K Sorted Lists",
    difficulty: "Hard",
    points: 300,
  },
  {
    id: "problem-4",
    title: "Valid Palindrome",
    difficulty: "Easy",
    points: 100,
    solved: true,
  },
  {
    id: "problem-5",
    title: "Longest Increasing Subsequence",
    difficulty: "Medium",
    points: 250,
  },
  {
    id: "problem-6",
    title: "Graph Shortest Path",
    difficulty: "Medium",
    points: 200,
  },
];
