"use client";
import { FilterPanel, ListPageLayout, SearchInput } from "@/fe/shared";
import { practiceProblems } from "../data/practiceProblems";
import PracticeCard from "./PracticeCard";
import styles from "../styles/PracticeListPage.module.css";

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

export default function PracticeListPage() {
  return (
    <ListPageLayout
      title="Practice Problems"
      actionLabel="Create Problem"
      sidebar={<FilterPanel groups={filters} />}
    >
      <div className={styles.searchSticky}>
        <SearchInput placeholder="Search for ..." />
      </div>
      <div className={styles.grid}>
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
