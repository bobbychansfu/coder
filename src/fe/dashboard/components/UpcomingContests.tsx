"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { mockUpcomingContests } from "@/fe/dashboard/data";
import styles from "../styles/UpcomingContests.module.css";

export default function UpcomingContests() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <AccessTimeIcon className={styles.icon} />
        <h3 className={styles.title}>Upcoming Contests</h3>
      </div>
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
    </div>
  );
}
