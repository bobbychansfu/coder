"use client";

import { FilterPanel, ListPageLayout, SearchInput } from "@/fe/shared";
import { contestList } from "../data/contests";
import ContestCard from "./ContestCard";
import styles from "../styles/ContestsListPage.module.css";

const filters = [
  {
    label: "Category",
    options: [
      { label: "All", active: true },
      { label: "Course Contest" },
      { label: "Practice Contest" },
      { label: "Weekly Challenge" },
    ],
  },
  {
    label: "Difficulty",
    options: [
      { label: "All", active: true },
      { label: "Easy" },
      { label: "Normal" },
      { label: "Hard" },
    ],
  },
  {
    label: "Status",
    options: [
      { label: "All", active: true },
      { label: "Upcoming" },
      { label: "Active" },
      { label: "Ended" },
    ],
  },
];

export default function ContestsListPage() {
  return (
    <ListPageLayout
      title="Contests"
      actionLabel="Create Contest"
      sidebar={<FilterPanel groups={filters} />}
    >
      <div className={styles.searchSticky}>
        <SearchInput placeholder="Search for ..." />
      </div>
      <div className={styles.grid}>
        {contestList.map((contest) => (
          <ContestCard
            key={contest.id}
            title={contest.title}
            status={contest.status}
            badge={contest.badge}
          />
        ))}
      </div>
    </ListPageLayout>
  );
}
