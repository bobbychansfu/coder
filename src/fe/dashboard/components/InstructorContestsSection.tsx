"use client";

import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import type { InstructorDashboardContestItem } from "@/lib/types/instructorDashboard";
import styles from "@/fe/dashboard/styles/InstructorContestsSection.module.css";

interface InstructorContestsSectionProps {
  contests: InstructorDashboardContestItem[];
}

export default function InstructorContestsSection({
  contests,
}: InstructorContestsSectionProps) {
  return (
    <section className={styles.sectionBlock}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>My Contests</h2>
      </div>
      <div className={styles.contestList}>
        {contests.length === 0 && (
          <div className={styles.emptyState}>No instructor contests to show yet.</div>
        )}
        {contests.map((contest) => (
          <article key={contest.id} className={styles.contestCard}>
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
                    <span>{contest.participants} participants</span>
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
          </article>
        ))}
      </div>
    </section>
  );
}
