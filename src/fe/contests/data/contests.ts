import type { DifficultyLevel, ContestStatus } from "@/fe/shared/types/contest";

export interface ContestListItem {
  id: string;
  title: string;
  status: ContestStatus;
  difficulty: DifficultyLevel;
}

export const contestList: ContestListItem[] = [
  {
    id: "contest-1",
    title: "Week 3 Lab Contest",
    status: "In Progress",
    difficulty: "Medium",
  },
  {
    id: "contest-2",
    title: "Trees & Graphs Challenge",
    status: "In Progress",
    difficulty: "Medium",
  },
  {
    id: "contest-3",
    title: "Arrays and Strings Basics",
    status: "Closed",
    difficulty: "Medium",
  },
  {
    id: "contest-4",
    title: "Sorting Algorithms Sprint",
    status: "Closed",
    difficulty: "Medium",
  },
  {
    id: "contest-5",
    title: "Dynamic Programming Fundamentals",
    status: "Closed",
    difficulty: "Medium",
  },
  {
    id: "contest-6",
    title: "Advanced Data Structures",
    status: "Closed",
    difficulty: "Hard",
  },
  {
    id: "contest-7",
    title: "Binary Search Mastery",
    status: "In Progress",
    difficulty: "Easy",
  },
  {
    id: "contest-8",
    title: "Backtracking & Recursion",
    status: "Closed",
    difficulty: "Medium",
  },
  {
    id: "contest-9",
    title: "Greedy Algorithms Workshop",
    status: "Closed",
    difficulty: "Medium",
  },
  {
    id: "contest-10",
    title: "Hash Tables Deep Dive",
    status: "Closed",
    difficulty: "Easy",
  },
  {
    id: "contest-11",
    title: "System Design Challenge",
    status: "Closed",
    difficulty: "Hard",
  },
  {
    id: "contest-12",
    title: "Linked Lists & Stacks",
    status: "In Progress",
    difficulty: "Easy",
  },
  {
    id: "contest-13",
    title: "Bit Manipulation Bootcamp",
    status: "Closed",
    difficulty: "Medium",
  },
  {
    id: "contest-14",
    title: "Graph Algorithms Advanced",
    status: "Closed",
    difficulty: "Hard",
  },
  {
    id: "contest-15",
    title: "String Algorithms Sprint",
    status: "Closed",
    difficulty: "Medium",
  },
  {
    id: "contest-16",
    title: "Heap & Priority Queue Challenge",
    status: "Closed",
    difficulty: "Medium",
  },
  {
    id: "contest-17",
    title: "Two Pointers Techniques",
    status: "Closed",
    difficulty: "Easy",
  },
  {
    id: "contest-18",
    title: "Segment Trees & Fenwick Trees",
    status: "Closed",
    difficulty: "Hard",
  },
  {
    id: "contest-19",
    title: "Matrix Operations Challenge",
    status: "Closed",
    difficulty: "Medium",
  },
  {
    id: "contest-20",
    title: "Trie & Prefix Tree Workshop",
    status: "Closed",
    difficulty: "Medium",
  },
];
