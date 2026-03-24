"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { mockUpcomingContests } from "@/fe/dashboard/data/contests";
import type { UpcomingContest } from "@/fe/shared/types/contest";
import DashboardWidget from "./DashboardWidget";
import styles from "../styles/UpcomingContests.module.css";

interface UpcomingContestsProps {
  contests?: UpcomingContest[];
  emptyMessage?: string;
  hideCourseCode?: boolean;
}

export default function UpcomingContests({
  contests = mockUpcomingContests,
  emptyMessage = "No upcoming contests right now.",
  hideCourseCode = false,
}: UpcomingContestsProps) {
  return (
    <DashboardWidget title="Upcoming Contests" icon={AccessTimeIcon}>
      <div className={styles.list}>
        {contests.length === 0 && <div className={styles.empty}>{emptyMessage}</div>}
        {contests.map((contest) => (
          <div key={contest.id}>
            <div className={styles.contestTitle}>{contest.title}</div>
            {!hideCourseCode && contest.courseCode && (
              <div className={styles.courseCode}>{contest.courseCode}</div>
            )}
            <div className={styles.date}>{contest.date}</div>
            <div className={styles.timeUntil}>{contest.timeUntil}</div>
            {contest.readinessState && (
              <span
                className={styles.readinessBadge}
                data-readiness={contest.readinessState.toLowerCase().replace(/\s+/g, "-")}
              >
                {contest.readinessState}
              </span>
            )}
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
}
