"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import FilterPanel from "@/fe/shared/components/filters/FilterPanel";
import ListPageLayout from "@/fe/shared/components/layout/ListPageLayout";
import SearchInput from "@/fe/shared/components/forms/SearchInput";
import ProblemCard from "@/fe/shared/components/problem/ProblemCard";
import { PRACTICE_FILTERS } from "@/fe/shared/constants/options";
import { trpc } from "@/lib/trpc/client";
import gridStyles from "@/fe/shared/styles/Grid.module.css";
import layoutStyles from "@/fe/shared/styles/ListPageLayout.module.css";

interface ProblemsPageProps {
  showCreateProblem: boolean;
}

export default function ProblemsPage({ showCreateProblem }: ProblemsPageProps) {
  const { data: problems, isLoading } = trpc.practice.listProblems.useQuery({});

  return (
    <ListPageLayout
      title="Problems"
      actionLabel={showCreateProblem ? "Create Problem" : undefined}
      actionHref={showCreateProblem ? "/problems/create" : undefined}
      sidebar={<FilterPanel groups={PRACTICE_FILTERS} />}
    >
      <div className={layoutStyles.searchBar}>
        <SearchInput placeholder="Search for ..." />
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
