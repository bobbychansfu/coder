"use client";

import Link from "next/link";
import ContestResultCard from "./ContestResultCard";
import type { MouseEvent } from "react";
import { buildContestRoute } from "@/fe/shared/constants/routes";
import type { DashboardContestHistoryItem } from "@/fe/dashboard/services/dashboardContests";
import styles from "../styles/PastContests.module.css";

interface PastContestsProps {
  contests?: DashboardContestHistoryItem[];
  emptyMessage?: string;
  onContestEntry?: (contestId: string) => void;
}

export default function PastContests({
  contests = [],
  emptyMessage = "No contest activity yet.",
  onContestEntry,
}: PastContestsProps) {
  function handleContestClick(
    event: MouseEvent<HTMLAnchorElement>,
    contest: DashboardContestHistoryItem,
  ): void {
    if (contest.actionLabel) {
      event.preventDefault();
      onContestEntry?.(contest.id);
    }
  }

  return (
    <div className={styles.container} data-testid="my-contests">
      <div className={styles.header}>
        <h2 className={styles.title}>My Contests</h2>
        <Link href="/contests" className={styles.viewAll}>
          View All
        </Link>
      </div>
      {contests.length === 0 ? (
        <div className={styles.empty}>{emptyMessage}</div>
      ) : (
        <div className={styles.list}>
          {contests.map((contest) => (
            <Link
              key={contest.id}
              href={buildContestRoute(contest.id)}
              className={styles.cardLink}
              aria-label={`Open contest ${contest.title}`}
              data-testid={`my-contest-${contest.id}`}
              onClick={(event) => handleContestClick(event, contest)}
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
