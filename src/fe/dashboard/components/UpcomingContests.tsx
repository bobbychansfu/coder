"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { mockUpcomingContests } from "@/fe/dashboard/data/contests";
import type { UpcomingContest } from "@/fe/shared/types/contest";
import DashboardWidget from "./DashboardWidget";
import styles from "../styles/UpcomingContests.module.css";

interface UpcomingContestsProps {
  contests?: UpcomingContest[];
  title?: string;
  emptyMessage?: string;
  hideCourseCode?: boolean;
}

export default function UpcomingContests({
  contests = mockUpcomingContests,
  title = "Upcoming Contests",
  emptyMessage = "No upcoming contests right now.",
  hideCourseCode = false,
}: UpcomingContestsProps) {
  return (
    <DashboardWidget title={title} icon={AccessTimeIcon}>
      <div className={styles.list}>
        {contests.length === 0 && <div className={styles.emptyState}>{emptyMessage}</div>}
        {contests.map((contest) => (
          <article key={contest.id} className={styles.contestCard}>
            <div className={styles.contestHeader}>
              <div className={styles.contestHeaderText}>
                <div className={styles.contestTitle}>{contest.title}</div>
                {!hideCourseCode && contest.courseCode ? (
                  <div className={styles.courseCode}>{contest.courseCode}</div>
                ) : null}
              </div>
              {contest.readinessState ? (
                <span
                  className={styles.readinessChip}
                  data-state={contest.readinessState.toLowerCase().replaceAll(" ", "-")}
                >
                  {contest.readinessState}
                </span>
              ) : null}
            </div>
            <div className={styles.date}>{contest.date}</div>
            <div className={styles.timeUntil}>{contest.timeUntil}</div>
          </article>
        ))}
      </div>
    </DashboardWidget>
  );
}
