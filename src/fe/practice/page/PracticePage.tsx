"use client";

import { useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import FilterPanel from "@/fe/shared/components/filters/FilterPanel";
import ListPageLayout from "@/fe/shared/components/layout/ListPageLayout";
import SearchInput from "@/fe/shared/components/forms/SearchInput";
import ProblemCard from "@/fe/shared/components/problem/ProblemCard";
import { PRACTICE_FILTERS } from "@/fe/shared/constants/options";
import { trpc } from "@/lib/trpc/client";
import gridStyles from "@/fe/shared/styles/Grid.module.css";
import layoutStyles from "@/fe/shared/styles/ListPageLayout.module.css";

interface PracticePageProps {
  showCreateProblem: boolean;
}

const INITIAL_FILTERS: Record<string, string> = {
  Category: "All",
  Difficulty: "All",
  Status: "All",
};

export default function PracticePage({ showCreateProblem }: PracticePageProps) {
  const [activeFilters, setActiveFilters] = useState(INITIAL_FILTERS);
  const [search, setSearch] = useState("");

  const handleFilterChange = (group: string, option: string) => {
    setActiveFilters((prev) => ({ ...prev, [group]: option }));
  };

  const selectedDifficulty =
    activeFilters["Difficulty"] !== "All" ? activeFilters["Difficulty"] : undefined;
  const selectedTag =
    activeFilters["Category"] !== "All"
      ? activeFilters["Category"].toLowerCase()
      : undefined;
  const selectedStatus =
    activeFilters["Status"] === "Completed"
      ? "completed"
      : activeFilters["Status"] === "Not Started"
        ? "not-started"
        : undefined;

  const { data: problems, isLoading } = trpc.practice.listProblems.useQuery({
    difficulty: selectedDifficulty,
    tag: selectedTag,
    search: search.trim() || undefined,
    status: selectedStatus,
  });

  return (
    <ListPageLayout
      title="Practice Problems"
      actionLabel={showCreateProblem ? "Create Problem" : undefined}
      actionHref={showCreateProblem ? "/problems/create" : undefined}
      sidebar={
        <FilterPanel
          groups={PRACTICE_FILTERS}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
        />
      }
    >
      <div className={layoutStyles.searchBar}>
        <SearchInput placeholder="Search for ..." value={search} onChange={setSearch} />
      </div>

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={28} />
        </Box>
      ) : !problems || problems.length === 0 ? (
        <Box display="flex" justifyContent="center" py={4}>
          <Typography color="text.secondary">No problems found.</Typography>
        </Box>
      ) : (
        <div className={gridStyles.grid}>
          {problems.map((problem) => (
            <ProblemCard
              key={problem.code}
              variant="tile"
              title={problem.title}
              difficulty={problem.difficulty}
              points={problem.points}
              solved={problem.solved}
              href={`/practice/${problem.code}`}
            />
          ))}
        </div>
      )}
    </ListPageLayout>
  );
}
