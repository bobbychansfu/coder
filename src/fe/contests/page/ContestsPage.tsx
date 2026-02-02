"use client";

import { FilterPanel, ListPageLayout, SearchInput } from "@/fe/shared";
import { contestList } from "@/fe/contests/data/contests";
import ContestCard from "@/fe/contests/components/ContestCard";
import styles from "@/fe/contests/styles/ContestsPage.module.css";
import layoutStyles from "@/fe/shared/styles/ListPageLayout.module.css";

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

export default function ContestsPage() {
  return (
    <ListPageLayout
      title="Contests"
      actionLabel="Create Contest"
      sidebar={<FilterPanel groups={filters} />}
    >
      <div className={layoutStyles.searchBar}>
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
