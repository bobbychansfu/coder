"use client";

import FilterPanel from "@/fe/shared/components/filters/FilterPanel";
import ListPageLayout from "@/fe/shared/components/layout/ListPageLayout";
import SearchInput from "@/fe/shared/components/forms/SearchInput";
import { practiceProblems } from "@/fe/practice/data/practiceProblems";
import ProblemCard from "@/fe/shared/components/problem/ProblemCard";
import { PRACTICE_FILTERS } from "@/fe/shared/constants/options";
import gridStyles from "@/fe/shared/styles/Grid.module.css";
import layoutStyles from "@/fe/shared/styles/ListPageLayout.module.css";

interface PracticePageProps {
  showCreateProblem: boolean;
}

export default function PracticePage({ showCreateProblem }: PracticePageProps) {
  return (
    <ListPageLayout
      title="Practice Problems"
      actionLabel={showCreateProblem ? "Create Problem" : undefined}
      actionHref={showCreateProblem ? "/problems/create" : undefined}
      sidebar={<FilterPanel groups={PRACTICE_FILTERS} />}
    >
      <div className={layoutStyles.searchBar}>
        <SearchInput placeholder="Search for ..." />
      </div>
      <div className={gridStyles.grid}>
        {practiceProblems.map((problem) => (
          <ProblemCard
            key={problem.id}
            variant="tile"
            title={problem.title}
            difficulty={problem.difficulty.toLowerCase() as "easy" | "medium" | "hard"}
            points={problem.points}
            solved={problem.solved}
            size={problem.size}
            href={`/practice/${problem.id}`}
          />
        ))}
      </div>
    </ListPageLayout>
  );
}
