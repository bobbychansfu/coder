import type { ContestStatus } from "@/fe/shared/types/contest";

export interface ContestListItem {
  id: string;
  title: string;
  status: ContestStatus;
  startsAt?: string;
  endsAt?: string | null;
}

export const contestList: ContestListItem[] = [
  {
    id: "contest-1",
    title: "Week 3 Lab Contest",
    status: "In Progress",
  },
  {
    id: "contest-2",
    title: "Trees & Graphs Challenge",
    status: "In Progress",
  },
  {
    id: "contest-3",
    title: "Arrays and Strings Basics",
    status: "Closed",
  },
  {
    id: "contest-4",
    title: "Sorting Algorithms Sprint",
    status: "Closed",
  },
  {
    id: "contest-5",
    title: "Dynamic Programming Fundamentals",
    status: "Closed",
  },
  {
    id: "contest-6",
    title: "Advanced Data Structures",
    status: "Closed",
  },
  {
    id: "contest-7",
    title: "Binary Search Mastery",
    status: "In Progress",
  },
  {
    id: "contest-8",
    title: "Backtracking & Recursion",
    status: "Closed",
  },
  {
    id: "contest-9",
    title: "Greedy Algorithms Workshop",
    status: "Closed",
  },
  {
    id: "contest-10",
    title: "Hash Tables Deep Dive",
    status: "Closed",
  },
  {
    id: "contest-11",
    title: "System Design Challenge",
    status: "Closed",
  },
  {
    id: "contest-12",
    title: "Linked Lists & Stacks",
    status: "In Progress",
  },
  {
    id: "contest-13",
    title: "Bit Manipulation Bootcamp",
    status: "Closed",
  },
  {
    id: "contest-14",
    title: "Graph Algorithms Advanced",
    status: "Closed",
  },
  {
    id: "contest-15",
    title: "String Algorithms Sprint",
    status: "Closed",
  },
  {
    id: "contest-16",
    title: "Heap & Priority Queue Challenge",
    status: "Closed",
  },
  {
    id: "contest-17",
    title: "Two Pointers Techniques",
    status: "Closed",
  },
  {
    id: "contest-18",
    title: "Segment Trees & Fenwick Trees",
    status: "Closed",
  },
  {
    id: "contest-19",
    title: "Matrix Operations Challenge",
    status: "Closed",
  },
  {
    id: "contest-20",
    title: "Trie & Prefix Tree Workshop",
    status: "Closed",
  },
];
