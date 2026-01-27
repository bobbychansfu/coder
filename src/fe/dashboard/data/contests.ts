import { Contest, UpcomingContest, ContestAlert } from "@/fe/shared/types";

export const mockPastContests: Contest[] = [
  {
    id: "contest-1",
    title: "Week 3 Lab Contest",
    courseCode: "CMPT 120",
    date: "1/25/2026",
    participants: 0,
    difficulty: "Easy",
    rank: 4,
    problemsSolved: "5/5",
    score: "560 pts",
    timeTaken: "140m",
  },
  {
    id: "contest-2",
    title: "Trees & Graphs Challenge",
    courseCode: "CMPT 225",
    date: "1/23/2026",
    participants: 67,
    difficulty: "Medium",
    rank: 15,
    problemsSolved: "4/6",
    score: "587 pts",
    timeTaken: "192m",
  },
  {
    id: "contest-3",
    title: "Arrays and Strings Basics",
    courseCode: "CMPT 120",
    date: "1/18/2026",
    participants: 118,
    difficulty: "Easy",
    rank: 17,
    problemsSolved: "2/4",
    score: "328 pts",
    timeTaken: "74m",
  },
];

export const mockUpcomingContests: UpcomingContest[] = [
  {
    id: "upcoming-1",
    title: "Week 3 Lab Contest",
    courseCode: "CMPT 120",
    date: "1/25/2026",
    timeUntil: "2 hours",
  },
];

export const mockContestAlert: ContestAlert = {
  title: "Contest in Progress!",
  description: "Trees & Graphs Challenge is currently active",
  isActive: true,
};
