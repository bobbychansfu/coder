"use client";

import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import type { AdminDashboardContestItem } from "@/lib/types/adminDashboard";
import styles from "@/fe/dashboard/styles/AdminContestOverviewSection.module.css";

interface AdminContestOverviewSectionProps {
  contests: AdminDashboardContestItem[];
}

export default function AdminContestOverviewSection({
  contests,
}: AdminContestOverviewSectionProps) {
  return (
    <section className={styles.sectionBlock}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Platform Contest Watch</h2>
      </div>
      <div className={styles.contestList}>
        {contests.length === 0 && (
          <div className={styles.emptyState}>No platform contests are available yet.</div>
        )}
        {contests.map((contest) => (
          <article key={contest.id} className={styles.contestCard}>
            <div className={styles.contestHeader}>
              <div className={styles.contestIconWrapper}>
                <ShieldOutlinedIcon className={styles.contestIcon} />
              </div>
              <div className={styles.contestHeaderContent}>
                <div className={styles.contestTitleRow}>
                  <h3 className={styles.contestTitle}>{contest.title}</h3>
                  <span className={styles.statusChip} data-status={contest.status.toLowerCase()}>
                    {contest.status}
                  </span>
                  <span
                    className={styles.visibilityChip}
                    data-visibility={contest.visibility.toLowerCase().replaceAll(" ", "-")}
                  >
                    {contest.visibility}
                  </span>
                </div>
                <div className={styles.contestMeta}>
                  <div className={styles.contestMetaItem}>
                    <CalendarTodayIcon className={styles.contestMetaIcon} />
                    <span>{contest.date}</span>
                  </div>
                  <div className={styles.contestMetaItem}>
                    <PeopleOutlineIcon className={styles.contestMetaIcon} />
                    <span>{contest.owner}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.contestStats}>
              <div className={styles.contestStat}>
                <span className={styles.contestStatLabel}>Participants</span>
                <span className={styles.contestStatValue}>{contest.participants}</span>
              </div>
              <div className={styles.contestStat}>
                <span className={styles.contestStatLabel}>Problems</span>
                <span className={styles.contestStatValue}>{contest.problemsCount}</span>
              </div>
              <div className={styles.contestStat}>
                <span className={styles.contestStatLabel}>Announcements</span>
                <span className={styles.contestStatValue}>{contest.announcementsCount}</span>
              </div>
              <div className={styles.contestStat}>
                <span className={styles.contestStatLabel}>Published</span>
                <span className={styles.contestStatValue}>
                  {contest.published ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
