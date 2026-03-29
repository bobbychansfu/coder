"use client";

import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import Link from "next/link";
import type { InstructorDashboardContestItem } from "@/lib/types/instructorDashboard";
import { buildContestRoute } from "@/fe/shared/constants/routes";
import styles from "@/fe/dashboard/styles/InstructorContestsSection.module.css";

interface InstructorContestsSectionProps {
  contests: InstructorDashboardContestItem[];
}

function isVisibleContest(
  contest: InstructorDashboardContestItem,
): contest is InstructorDashboardContestItem & { status: "Active" | "Upcoming" } {
  return contest.status === "Active" || contest.status === "Upcoming";
}

export default function InstructorContestsSection({
  contests,
}: InstructorContestsSectionProps) {
  const visibleContests = contests
    .filter(isVisibleContest)
    .sort((left, right) => {
      const statusPriority = {
        Active: 0,
        Upcoming: 1,
      } as const;

      return statusPriority[left.status] - statusPriority[right.status];
    });

  return (
    <section className={styles.sectionBlock}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>My Contests</h2>
      </div>
      <div className={styles.contestList}>
        {visibleContests.length === 0 && (
          <div className={styles.emptyState}>No instructor contests to show yet.</div>
        )}
        {visibleContests.map((contest) => (
          <Link
            key={contest.id}
            href={buildContestRoute(contest.id)}
            className={styles.contestCard}
            aria-label={`Open contest ${contest.title}`}
          >
            <div className={styles.contestHeader}>
              <div className={styles.contestIconWrapper}>
                <EmojiEventsIcon className={styles.contestIcon} />
              </div>
              <div className={styles.contestHeaderContent}>
                <div className={styles.contestTitleRow}>
                  <h3 className={styles.contestTitle}>{contest.title}</h3>
                  <span className={styles.statusChip} data-status={contest.status.toLowerCase()}>
                    {contest.status}
                  </span>
                </div>
                <div className={styles.contestMeta}>
                  <div className={styles.contestMetaItem}>
                    <CalendarTodayIcon className={styles.contestMetaIcon} />
                    <span>{contest.date}</span>
                  </div>
                  <div className={styles.contestMetaItem}>
                    <PeopleOutlineIcon className={styles.contestMetaIcon} />
                    <span>{`${contest.participants} participant${contest.participants === 1 ? "" : "s"}`}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.contestStats}>
              <div className={styles.contestStat}>
                <span className={styles.contestStatLabel}>Problems</span>
                <span className={styles.contestStatValue}>{contest.problemsCount}</span>
              </div>
              <div className={styles.contestStat}>
                <span className={styles.contestStatLabel}>Groups Assigned</span>
                <span className={styles.contestStatValue}>{contest.groupsAssignedCount}</span>
              </div>
              <div className={styles.contestStat}>
                <span className={styles.contestStatLabel}>AI Hint</span>
                <span className={styles.contestStatValue}>
                  {contest.aiHintEnabled ? "Enabled" : "Off"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
