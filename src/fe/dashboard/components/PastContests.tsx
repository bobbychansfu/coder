"use client";

import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ContestResultCard from "./ContestResultCard";
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
  const router = useRouter();

  function handleContestOpen(contest: DashboardContestHistoryItem): void {
    if (contest.actionLabel) {
      onContestEntry?.(contest.id);
      return;
    }

    router.push(buildContestRoute(contest.id));
  }

  function handleCardKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
    contest: DashboardContestHistoryItem,
  ): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleContestOpen(contest);
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
            <div
              key={contest.id}
              className={styles.cardLink}
              aria-label={`Open contest ${contest.title}`}
              data-testid={`my-contest-${contest.id}`}
              role="link"
              tabIndex={0}
              onClick={() => handleContestOpen(contest)}
              onKeyDown={(event) => handleCardKeyDown(event, contest)}
            >
              <ContestResultCard
                title={contest.title}
                date={contest.date}
                participants={contest.participants}
                status={contest.status}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
