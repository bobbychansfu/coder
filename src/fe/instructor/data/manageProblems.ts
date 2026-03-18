import type {
  ManagedProblemDifficulty,
  ManagedProblemStatus,
} from "@/fe/shared/constants/manageContent";

export interface ManagedProblemRecord {
  id: string;
  title: string;
  points: number;
  status: ManagedProblemStatus;
  difficulty: ManagedProblemDifficulty;
  tags: string[];
}

export const managedProblems: ManagedProblemRecord[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    points: 100,
    status: "active",
    difficulty: "easy",
    tags: ["arrays", "hash-table"],
  },
  {
    id: "binary-tree-traversal",
    title: "Binary Tree Traversal",
    points: 200,
    status: "active",
    difficulty: "medium",
    tags: ["trees", "recursion", "+1"],
  },
  {
    id: "merge-k-sorted-lists",
    title: "Merge K Sorted Lists",
    points: 300,
    status: "active",
    difficulty: "hard",
    tags: ["linked-list", "divide-conquer", "+1"],
  },
  {
    id: "valid-palindrome",
    title: "Valid Palindrome",
    points: 100,
    status: "active",
    difficulty: "easy",
    tags: ["strings", "two-pointers"],
  },
  {
    id: "longest-increasing-subsequence",
    title: "Longest Increasing Subsequence",
    points: 250,
    status: "active",
    difficulty: "medium",
    tags: ["dynamic-programming", "binary-search"],
  },
  {
    id: "graph-shortest-path",
    title: "Graph Shortest Path",
    points: 200,
    status: "active",
    difficulty: "medium",
    tags: ["graphs", "bfs", "+1"],
  },
];
