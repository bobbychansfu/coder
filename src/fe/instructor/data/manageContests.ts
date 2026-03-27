import type { ManagedContestStatus } from "@/fe/shared/constants/manageContent";

export interface ManagedContestRecord {
  id: string;
  title: string;
  owner: string;
  section: string;
  status: ManagedContestStatus;
  startAt: string;
  endAt: string;
  problemsCount: number;
}

export const managedContests: ManagedContestRecord[] = [
  {
    id: "week-3-lab-contest",
    title: "Week 3 Lab Contest",
    owner: "Dr. Sarah Johnson",
    section: "Section A",
    status: "upcoming",
    startAt: "Jan 25, 2026, 02:00 p.m.",
    endAt: "Jan 25, 2026, 04:00 p.m.",
    problemsCount: 1,
  },
  {
    id: "trees-and-graphs-challenge",
    title: "Trees & Graphs Challenge",
    owner: "Prof. Michael Chen",
    section: "Section B",
    status: "active",
    startAt: "Jan 23, 2026, 10:00 a.m.",
    endAt: "Jan 23, 2026, 01:00 p.m.",
    problemsCount: 1,
  },
  {
    id: "arrays-and-strings-basics",
    title: "Arrays and Strings Basics",
    owner: "Dr. Sarah Johnson",
    section: "Section A",
    status: "ended",
    startAt: "Jan 18, 2026, 02:00 p.m.",
    endAt: "Jan 18, 2026, 04:00 p.m.",
    problemsCount: 1,
  },
  {
    id: "sorting-algorithms-sprint",
    title: "Sorting Algorithms Sprint",
    owner: "Prof. Michael Chen",
    section: "Section B",
    status: "ended",
    startAt: "Jan 11, 2026, 02:00 p.m.",
    endAt: "Jan 11, 2026, 04:30 p.m.",
    problemsCount: 1,
  },
  {
    id: "dynamic-programming-fundamentals",
    title: "Dynamic Programming Fundamentals",
    owner: "Dr. Emily Wong",
    section: "Section C",
    status: "archived",
    startAt: "Jan 4, 2026, 10:00 a.m.",
    endAt: "Jan 4, 2026, 02:00 p.m.",
    problemsCount: 2,
  },
];
