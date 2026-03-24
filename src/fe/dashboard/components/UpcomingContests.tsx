"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { mockUpcomingContests } from "@/fe/dashboard/data/contests";
import DashboardWidget from "./DashboardWidget";
import styles from "../styles/UpcomingContests.module.css";

export default function UpcomingContests() {
  return (
    <DashboardWidget title="Upcoming Contests" icon={AccessTimeIcon}>
      <div className={styles.list}>
        {mockUpcomingContests.map((contest) => (
          <div key={contest.id}>
            <div className={styles.contestTitle}>{contest.title}</div>
            <div className={styles.courseCode}>{contest.courseCode}</div>
            <div className={styles.date}>{contest.date}</div>
            <div className={styles.timeUntil}>{contest.timeUntil}</div>
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
}
