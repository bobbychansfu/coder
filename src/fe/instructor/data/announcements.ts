export interface InstructorAnnouncementRecord {
  id: string;
  contest: string;
  message: string;
  timeAgo: string;
  views: number;
}

export const instructorContestOptions: string[] = [
  "CMPT 307 - Assignment 3",
  "CMPT 307 - Midterm Practice",
  "CMPT 307 - Assignment 2",
];

export const instructorAnnouncementHistory: InstructorAnnouncementRecord[] = [
  {
    id: "announcement-1",
    contest: "CMPT 307 - Assignment 3",
    message:
      "Reminder: Contest ends in 2 hours. Make sure to submit your solutions!",
    timeAgo: "2 hours ago",
    views: 42,
  },
  {
    id: "announcement-2",
    contest: "CMPT 307 - Midterm Practice",
    message:
      "Problem C test case clarification: The array is guaranteed to be sorted.",
    timeAgo: "1 day ago",
    views: 67,
  },
  {
    id: "announcement-3",
    contest: "CMPT 307 - Assignment 2",
    message:
      "Time extension granted: Contest extended by 30 minutes due to technical issues.",
    timeAgo: "3 days ago",
    views: 55,
  },
];
