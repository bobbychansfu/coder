export type AdminContestStatus = "upcoming" | "active" | "ended";
export type AdminContestVisibility = "public" | "private";

export interface AdminContest {
  id: string;
  name: string;
  classSection: string;
  instructor: string;
  startDate: string;
  duration: string;
  status: AdminContestStatus;
  participants: number;
  visibility: AdminContestVisibility;
}

export const adminContestStatusOptions: Array<{
  value: "all" | AdminContestStatus;
  label: string;
}> = [
  { value: "all", label: "All Status" },
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "ended", label: "Ended" },
];

export const adminContests: AdminContest[] = [
  {
    id: "week-3-lab-contest",
    name: "Week 3 Lab Contest",
    classSection: "Section A",
    instructor: "Dr. Sarah Johnson",
    startDate: "1/25/2026",
    duration: "2 hours",
    status: "upcoming",
    participants: 0,
    visibility: "private",
  },
  {
    id: "trees-graphs-challenge",
    name: "Trees & Graphs Challenge",
    classSection: "Section B",
    instructor: "Prof. Michael Chen",
    startDate: "1/23/2026",
    duration: "3 hours",
    status: "active",
    participants: 67,
    visibility: "public",
  },
  {
    id: "arrays-strings-basics",
    name: "Arrays and Strings Basics",
    classSection: "Section A",
    instructor: "Dr. Sarah Johnson",
    startDate: "1/18/2026",
    duration: "2 hours",
    status: "ended",
    participants: 118,
    visibility: "private",
  },
  {
    id: "sorting-algorithms-sprint",
    name: "Sorting Algorithms Sprint",
    classSection: "Section B",
    instructor: "Prof. Michael Chen",
    startDate: "1/11/2026",
    duration: "2.5 hours",
    status: "ended",
    participants: 92,
    visibility: "private",
  },
  {
    id: "dynamic-programming-fundamentals",
    name: "Dynamic Programming Fundamentals",
    classSection: "Section C",
    instructor: "Dr. Emily Wong",
    startDate: "1/4/2026",
    duration: "4 hours",
    status: "ended",
    participants: 68,
    visibility: "private",
  },
];
