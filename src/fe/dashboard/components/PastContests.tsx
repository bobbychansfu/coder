"use client";

import ContestResultCard from "./ContestResultCard";
import Link from "next/link";
import { buildContestRoute } from "@/fe/shared/constants/routes";
import type { DashboardContestHistoryItem } from "@/fe/dashboard/services/dashboardContests";
import styles from "../styles/PastContests.module.css";

interface PastContestsProps {
  contests?: DashboardContestHistoryItem[];
}

export default function PastContests({ contests = [] }: PastContestsProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>My Contests</h2>
        <Link href="/contests" className={styles.viewAll}>
          View All
        </Link>
      </div>
      {contests.length === 0 ? (
        <div className={styles.empty}>No contest activity yet.</div>
      ) : (
        <div className={styles.list}>
          {contests.map((contest) => (
            <Link
              key={contest.id}
              href={buildContestRoute(contest.id)}
              className={styles.cardLink}
              aria-label={`Open contest ${contest.title}`}
            >
              <ContestResultCard
                title={contest.title}
                date={contest.date}
                participants={contest.participants}
                status={contest.status}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
