"use client";

import ContestCard from "./ContestCard";
import Link from "next/link";
import { mockPastContests } from "@/fe/dashboard/data";
import styles from "../styles/PastContests.module.css";

export default function PastContests() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Past Contests</h2>
        <Link href="/contests" className={styles.viewAll}>
          View All
        </Link>
      </div>
      <div className={styles.list}>
        {mockPastContests.map((contest) => (
          <ContestCard
            key={contest.id}
            title={contest.title}
            date={contest.date}
            participants={contest.participants}
            difficulty={contest.difficulty}
            rank={contest.rank}
            problemsSolved={contest.problemsSolved}
            score={contest.score}
            timeTaken={contest.timeTaken}
          />
        ))}
      </div>
    </div>
  );
}
