"use client";

import { useMemo, useState } from "react";
import { Box, Button } from "@mui/material";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import QueryStatsOutlinedIcon from "@mui/icons-material/QueryStatsOutlined";
import TableViewOutlinedIcon from "@mui/icons-material/TableViewOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import {
  MOCK_INSTRUCTOR_ANALYTICS,
  type ContestCatalogRow,
  type ContestMetricRow,
  type ProblemMetricRow,
  type ViewMode,
} from "@/fe/instructor/data/liveInstructorAnalytics";
import {
  DEFAULT_AI_HINT_NOTE,
  DEFAULT_GAMIFICATION_NOTE,
} from "@/fe/instructor/data/analysisConstants";
import LiveMetricsTable from "@/fe/instructor/components/LiveMetricsTable";
import styles from "@/fe/instructor/styles/LiveInstructorAnalyticsCard.module.css";

interface LiveInstructorAnalyticsCardProps {
  viewMode?: ViewMode;
  selectedContestId?: string;
  onViewModeChange?: (value: ViewMode) => void;
  onSelectedContestIdChange?: (value: string) => void;
}

export interface LiveInstructorAnalyticsResolvedData {
  activeContest: ContestCatalogRow | null;
  contestRows: ContestMetricRow[];
  problemRows: ProblemMetricRow[];
  orderedProblemRows: ProblemMetricRow[];
}

function formatNumber(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "N/A";
  return `${value}`;
}

function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "N/A";
  return `${value}%`;
}

function resolveLiveInstructorAnalyticsData(
  viewMode: ViewMode,
  selectedContestId: string,
): LiveInstructorAnalyticsResolvedData {
  const activeBundle = MOCK_INSTRUCTOR_ANALYTICS.segmented_metrics[viewMode] || {
    contest_metrics: [],
    problem_metrics: [],
  };

  const activeContest =
    selectedContestId === "all"
      ? null
      : MOCK_INSTRUCTOR_ANALYTICS.contests_catalog.find((contest) => contest.id === selectedContestId) ||
        null;

  const contestRows =
    selectedContestId === "all"
      ? activeBundle.contest_metrics
      : activeBundle.contest_metrics.filter((row) => row.contest_id === selectedContestId);

  const problemRows =
    selectedContestId === "all"
      ? activeBundle.problem_metrics
      : activeBundle.problem_metrics.filter((row) => row.contest_id === selectedContestId);

  const orderedProblemRows = [...problemRows].sort((left, right) => {
    const contestCompare = left.contest_name.localeCompare(right.contest_name);
    if (contestCompare !== 0) return contestCompare;
    return left.problem_code.localeCompare(right.problem_code);
  });

  return {
    activeContest,
    contestRows,
    problemRows,
    orderedProblemRows,
  };
}

export { resolveLiveInstructorAnalyticsData };

export default function LiveInstructorAnalyticsCard({
  viewMode: controlledViewMode,
  selectedContestId: controlledSelectedContestId,
  onViewModeChange,
  onSelectedContestIdChange,
}: LiveInstructorAnalyticsCardProps) {
  const [loading, setLoading] = useState(false);
  const [uncontrolledViewMode, setUncontrolledViewMode] = useState<ViewMode>("all");
  const [uncontrolledSelectedContestId, setUncontrolledSelectedContestId] = useState("all");
  const [showAllContestRows, setShowAllContestRows] = useState(false);
  const [showAllProblemRows, setShowAllProblemRows] = useState(false);

  const viewMode = controlledViewMode ?? uncontrolledViewMode;
  const selectedContestId = controlledSelectedContestId ?? uncontrolledSelectedContestId;

  async function refreshDemo(): Promise<void> {
    setLoading(true);
    try {
      await Promise.resolve();
    } finally {
      setLoading(false);
    }
  }

  const contestOptions = useMemo(() => {
    const catalog = MOCK_INSTRUCTOR_ANALYTICS.contests_catalog;
    return [{ id: "all", name: "All Contests" }, ...catalog];
  }, []);

  const { activeContest, contestRows, problemRows, orderedProblemRows } = useMemo(
    () => resolveLiveInstructorAnalyticsData(viewMode, selectedContestId),
    [viewMode, selectedContestId],
  );

  const avgSolveRate =
    contestRows.length === 0
      ? null
      : contestRows.reduce((sum, row) => sum + row.solve_rate, 0) / contestRows.length;
  const avgMedianTime =
    contestRows.length === 0
      ? null
      : contestRows.reduce((sum, row) => sum + (row.median_solve_time_minutes || 0), 0) /
        contestRows.length;
  const avgHintSolve =
    problemRows.length === 0
      ? null
      : problemRows.reduce((sum, row) => sum + (row.post_hint_solve_probability || 0), 0) /
        problemRows.length;
  const visibleContestRows = showAllContestRows ? contestRows : contestRows.slice(0, 10);
  const visibleProblemRows = showAllProblemRows ? orderedProblemRows : orderedProblemRows.slice(0, 10);
  const contestColumns = [
    {
      key: "contest",
      header: "Contest",
      render: (row: ContestMetricRow) => row.contest_name,
    },
    {
      key: "solveRate",
      header: "Solve Rate",
      render: (row: ContestMetricRow) => formatPercent(row.solve_rate),
    },
    {
      key: "meanSolveTime",
      header: "Mean Solve Time",
      render: (row: ContestMetricRow) => `${formatNumber(row.mean_solve_time_minutes)} min`,
    },
    {
      key: "medianSolveTime",
      header: "Median Solve Time",
      render: (row: ContestMetricRow) => `${formatNumber(row.median_solve_time_minutes)} min`,
    },
    {
      key: "attemptsToSolve",
      header: "Attempts to Solve",
      render: (row: ContestMetricRow) => formatNumber(row.attempts_to_solve),
    },
  ];
  const problemColumns = [
    {
      key: "contest",
      header: "Contest",
      render: (row: ProblemMetricRow) => row.contest_name,
    },
    {
      key: "problem",
      header: "Problem",
      render: (row: ProblemMetricRow) => `${row.problem_code} - ${row.problem_title}`,
    },
    {
      key: "firstSubmission",
      header: "First Submission",
      render: (row: ProblemMetricRow) => `${formatNumber(row.time_to_first_submission_minutes)} min`,
    },
    {
      key: "firstCorrect",
      header: "First Correct",
      render: (row: ProblemMetricRow) => `${formatNumber(row.time_to_first_correct_submission_minutes)} min`,
    },
    {
      key: "postHintSolveProbability",
      header: "Post-Hint Solve Prob.",
      render: (row: ProblemMetricRow) => formatPercent(row.post_hint_solve_probability),
    },
    {
      key: "attemptsBeforeHint",
      header: "Attempts Before Hint",
      render: (row: ProblemMetricRow) => formatNumber(row.attempts_before_hint),
    },
    {
      key: "attemptsAfterHint",
      header: "Attempts After Hint",
      render: (row: ProblemMetricRow) => formatNumber(row.attempts_after_hint),
    },
    {
      key: "timeToSolveAfterHint",
      header: "Time to Solve After Hint",
      render: (row: ProblemMetricRow) => `${formatNumber(row.time_to_solve_after_hint_minutes)} min`,
    },
  ];

  return (
    <Box className={styles.card}>
      <Box className={styles.headerRow}>
        <Box>
          <h3 className={styles.title}>Metrics Table</h3>
        </Box>
        <Box className={styles.actions}>
          <Button
            className={styles.secondaryButton}
            variant="outlined"
            size="small"
            onClick={() => void refreshDemo()}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Box className={styles.filterBar}>
        <Box className={styles.filterRow}>
          <label className={styles.filterField}>
            <span>Contest</span>
            <select
              value={selectedContestId}
              onChange={(e) => {
                const value = e.target.value;
                onSelectedContestIdChange?.(value);
                if (!onSelectedContestIdChange) setUncontrolledSelectedContestId(value);
              }}
            >
              {contestOptions.map((contest) => (
                <option key={contest.id} value={contest.id}>
                  {contest.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.filterField}>
            <span>View</span>
            <select
              value={viewMode}
              onChange={(e) => {
                const value = e.target.value as ViewMode;
                onViewModeChange?.(value);
                if (!onViewModeChange) setUncontrolledViewMode(value);
              }}
            >
              <option value="all">All Students</option>
              <option value="groupA">Group A</option>
              <option value="groupB">Group B</option>
              <option value="groupC">Group C</option>
            </select>
          </label>
        </Box>
      </Box>

      {loading && <p className={styles.info}>Refreshing metrics...</p>}
      {MOCK_INSTRUCTOR_ANALYTICS.analytics_notes[0] ? (
        <p className={styles.info}>{MOCK_INSTRUCTOR_ANALYTICS.analytics_notes[0]}</p>
      ) : null}

      <Box className={styles.focusGrid}>
        <Box className={styles.focusCard}>
          <Box className={styles.focusHeader}>
            <EmojiEventsOutlinedIcon className={styles.focusIcon} />
            <span className={styles.focusLabel}>Gamification Note</span>
          </Box>
          <p className={styles.focusTitle}>
            {activeContest?.gamificationNote || DEFAULT_GAMIFICATION_NOTE}
          </p>
        </Box>

        <Box className={styles.focusCard}>
          <Box className={styles.focusHeader}>
            <AutoAwesomeOutlinedIcon className={styles.focusIcon} />
            <span className={styles.focusLabel}>AI Hint Note</span>
          </Box>
          <p className={styles.focusTitle}>
            {activeContest?.hintNote || DEFAULT_AI_HINT_NOTE}
          </p>
        </Box>
      </Box>

      <Box className={styles.summaryRow}>
        <Box className={styles.summaryItem}>
          <Groups2OutlinedIcon className={styles.summaryIcon} />
          <Box>
            <p className={styles.summaryLabel}>Contests in view</p>
            <p className={styles.summaryValue}>{contestRows.length}</p>
          </Box>
        </Box>
        <Box className={styles.summaryItem}>
          <QueryStatsOutlinedIcon className={styles.summaryIcon} />
          <Box>
            <p className={styles.summaryLabel}>Average solve rate</p>
            <p className={styles.summaryValue}>{formatPercent(avgSolveRate)}</p>
          </Box>
        </Box>
        <Box className={styles.summaryItem}>
          <TimerOutlinedIcon className={styles.summaryIcon} />
          <Box>
            <p className={styles.summaryLabel}>Median solve time</p>
            <p className={styles.summaryValue}>{formatNumber(avgMedianTime)} min</p>
          </Box>
        </Box>
        <Box className={styles.summaryItem}>
          <AutoAwesomeOutlinedIcon className={styles.summaryIcon} />
          <Box>
            <p className={styles.summaryLabel}>Post-hint solve rate</p>
            <p className={styles.summaryValue}>{formatPercent(avgHintSolve)}</p>
          </Box>
        </Box>
      </Box>

      <h4 className={styles.sectionTitle}>
        <EmojiEventsOutlinedIcon className={styles.sectionIcon} />
        Contest Metrics
      </h4>
      <LiveMetricsTable
        rows={contestRows}
        visibleRows={visibleContestRows}
        rowKey={(row) => row.contest_id}
        columns={contestColumns}
      />
      {contestRows.length > 10 ? (
        <Box className={styles.tableActions}>
          <Button
            className={styles.ghostButton}
            variant="text"
            size="small"
            onClick={() => setShowAllContestRows((current) => !current)}
          >
            {showAllContestRows ? "Show Less" : "View All"}
          </Button>
        </Box>
      ) : null}

      <h4 className={styles.sectionTitle}>
        <TableViewOutlinedIcon className={styles.sectionIcon} />
        Problem Metrics
      </h4>
      <LiveMetricsTable
        rows={orderedProblemRows}
        visibleRows={visibleProblemRows}
        rowKey={(row) => `${row.contest_id}:${row.problem_id}`}
        columns={problemColumns}
      />
      {orderedProblemRows.length > 10 ? (
        <Box className={styles.tableActions}>
          <Button
            className={styles.ghostButton}
            variant="text"
            size="small"
            onClick={() => setShowAllProblemRows((current) => !current)}
          >
            {showAllProblemRows ? "Show Less" : "View All"}
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}
