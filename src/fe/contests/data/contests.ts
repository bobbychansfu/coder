export interface ContestListItem {
  id: string;
  title: string;
  status: string;
  badge: string;
}

export const contestList: ContestListItem[] = [
  {
    id: "contest-1",
    title: "Week 3 Lab Contest",
    status: "Starts: 1/25/2026",
    badge: "Normal",
  },
  {
    id: "contest-2",
    title: "Trees & Graphs Challenge",
    status: "Contest is live now!",
    badge: "Normal",
  },
  {
    id: "contest-3",
    title: "Arrays and Strings Basics",
    status: "Ended: 1/18/2026",
    badge: "Normal",
  },
  {
    id: "contest-4",
    title: "Sorting Algorithms Sprint",
    status: "Ended: 1/11/2026",
    badge: "Normal",
  },
  {
    id: "contest-5",
    title: "Dynamic Programming Fundamentals",
    status: "Ended: 1/4/2026",
    badge: "Normal",
  },
];
