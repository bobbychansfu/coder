"use client";

import FilterPanel from "@/fe/shared/components/filters/FilterPanel";
import ListPageLayout from "@/fe/shared/components/layout/ListPageLayout";
import SearchInput from "@/fe/shared/components/forms/SearchInput";
import { practiceProblems } from "@/fe/practice/data/practiceProblems";
import PracticeCard from "@/fe/practice/components/PracticeCard";
import gridStyles from "@/fe/shared/styles/Grid.module.css";
import layoutStyles from "@/fe/shared/styles/ListPageLayout.module.css";

const filters = [
  {
    label: "Category",
    options: [
      { label: "All", active: true },
      { label: "Arrays" },
      { label: "Strings" },
      { label: "Trees" },
      { label: "Graphs" },
      { label: "Dynamic Programming" },
      { label: "Sorting" },
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
    label: "Location",
    options: [
      { label: "All" },
      { label: "Remote" },
      { label: "Burnaby" },
      { label: "Surrey" },
      { label: "Vancouver" },
    ],
  },
];

export default function PracticePage() {
  return (
    <ListPageLayout
      title="Practice Problems"
      actionLabel="Create Problem"
      sidebar={<FilterPanel groups={filters} />}
    >
      <div className={layoutStyles.searchBar}>
        <SearchInput placeholder="Search for ..." />
      </div>
      <div className={gridStyles.grid}>
        {practiceProblems.map((problem) => (
          <PracticeCard
            key={problem.id}
            title={problem.title}
            difficulty={problem.difficulty}
            points={problem.points}
            solved={problem.solved}
            size={problem.size || "compact"}
          />
        ))}
      </div>
    </ListPageLayout>
  );
}
