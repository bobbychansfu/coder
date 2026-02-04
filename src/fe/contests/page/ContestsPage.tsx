"use client";

import FilterPanel from "@/fe/shared/components/filters/FilterPanel";
import ListPageLayout from "@/fe/shared/components/layout/ListPageLayout";
import SearchInput from "@/fe/shared/components/forms/SearchInput";
import type { ContestListItem } from "@/fe/contests/data/contests";
import ContestSummaryCard from "@/fe/contests/components/ContestSummaryCard";
import gridStyles from "@/fe/shared/styles/Grid.module.css";
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
      { label: "Medium" },
      { label: "Hard" },
    ],
  },
  {
    label: "Status",
    options: [
      { label: "All", active: true },
      { label: "In Progress" },
      { label: "Closed" },
    ],
  },
];

interface ContestsPageProps {
  initialContests: ContestListItem[];
}

export default function ContestsPage({ initialContests }: ContestsPageProps) {
  return (
    <ListPageLayout
      title="Contests"
      actionLabel="Create Contest"
      sidebar={<FilterPanel groups={filters} />}
    >
      <div className={layoutStyles.searchBar}>
        <SearchInput placeholder="Search for ..." />
      </div>
      <div className={gridStyles.grid}>
        {initialContests.map((contest) => (
          <ContestSummaryCard
            key={contest.id}
            title={contest.title}
            status={contest.status}
            difficulty={contest.difficulty}
            href={`/contests/${contest.id}`}
          />
        ))}
      </div>
    </ListPageLayout>
  );
}
