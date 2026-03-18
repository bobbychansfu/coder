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
  type ViewMode,
} from "@/fe/instructor/data/liveInstructorAnalytics";
import styles from "@/fe/instructor/styles/LiveInstructorAnalyticsCard.module.css";

function formatNumber(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "N/A";
  return `${value}`;
}

function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "N/A";
  return `${value}%`;
}

export default function LiveInstructorAnalyticsCard() {
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [selectedContestId, setSelectedContestId] = useState("all");
  const [showAllContestRows, setShowAllContestRows] = useState(false);
  const [showAllProblemRows, setShowAllProblemRows] = useState(false);

  async function refreshDemo(): Promise<void> {
    setLoading(true);
    try {
      await Promise.resolve();
    } finally {
      setLoading(false);
    }
  }

  const activeBundle = useMemo(() => {
    return MOCK_INSTRUCTOR_ANALYTICS.segmented_metrics[viewMode] || {
      contest_metrics: [],
      problem_metrics: [],
    };
  }, [viewMode]);

  const contestOptions = useMemo(() => {
    const catalog = MOCK_INSTRUCTOR_ANALYTICS.contests_catalog;
    return [{ id: "all", name: "All Contests" }, ...catalog];
  }, []);

  const activeContest: ContestCatalogRow | null = useMemo(() => {
    if (selectedContestId === "all") return null;
    return (
      MOCK_INSTRUCTOR_ANALYTICS.contests_catalog.find((contest) => contest.id === selectedContestId) ||
      null
    );
  }, [selectedContestId]);

  const contestRows =
    selectedContestId === "all"
      ? activeBundle.contest_metrics
      : activeBundle.contest_metrics.filter((row) => row.contest_id === selectedContestId);

  const problemRows =
    selectedContestId === "all"
      ? activeBundle.problem_metrics
      : activeBundle.problem_metrics.filter((row) => row.contest_id === selectedContestId);
  const orderedProblemRows = useMemo(
    () =>
      [...problemRows].sort((left, right) => {
        const contestCompare = left.contest_name.localeCompare(right.contest_name);
        if (contestCompare !== 0) return contestCompare;
        return left.problem_code.localeCompare(right.problem_code);
      }),
    [problemRows],
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

  return (
    <Box className={styles.card}>
      <Box className={styles.headerRow}>
        <Box>
          <h3 className={styles.title}>Live Contest & Problem Metrics</h3>
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
          <select value={selectedContestId} onChange={(e) => setSelectedContestId(e.target.value)}>
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
              setViewMode(e.target.value as ViewMode);
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

      {loading && <p className={styles.info}>Refreshing UI demo metrics...</p>}
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
            {activeContest?.gamificationNote ||
              "A group members already know each other. B group is randomly assigned and fully unfamiliar. C group members know each other through the platform friend list."}
          </p>
        </Box>

        <Box className={styles.focusCard}>
          <Box className={styles.focusHeader}>
            <AutoAwesomeOutlinedIcon className={styles.focusIcon} />
            <span className={styles.focusLabel}>AI Hint Note</span>
          </Box>
          <p className={styles.focusTitle}>
            {activeContest?.hintNote ||
              "A group has no AI hint. B group can access AI hints after 1 minute. C group can access AI hints after 30 minutes."}
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
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Contest</th>
              <th>Solve Rate</th>
              <th>Mean Solve Time</th>
              <th>Median Solve Time</th>
              <th>Attempts to Solve</th>
            </tr>
          </thead>
          <tbody>
            {visibleContestRows.map((row) => (
              <tr key={row.contest_id}>
                <td>{row.contest_name}</td>
                <td>{formatPercent(row.solve_rate)}</td>
                <td>{formatNumber(row.mean_solve_time_minutes)} min</td>
                <td>{formatNumber(row.median_solve_time_minutes)} min</td>
                <td>{formatNumber(row.attempts_to_solve)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!showAllContestRows && contestRows.length > 10 ? (
          <div className={styles.tableFade} />
        ) : null}
      </div>
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
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Contest</th>
              <th>Problem</th>
              <th>First Submission</th>
              <th>First Correct</th>
              <th>Post-Hint Solve Prob.</th>
              <th>Attempts Before Hint</th>
              <th>Attempts After Hint</th>
              <th>Time to Solve After Hint</th>
            </tr>
          </thead>
          <tbody>
            {visibleProblemRows.map((row) => (
              <tr key={`${row.contest_id}:${row.problem_id}`}>
                <td>{row.contest_name}</td>
                <td>
                  {row.problem_code} - {row.problem_title}
                </td>
                <td>{formatNumber(row.time_to_first_submission_minutes)} min</td>
                <td>{formatNumber(row.time_to_first_correct_submission_minutes)} min</td>
                <td>{formatPercent(row.post_hint_solve_probability)}</td>
                <td>{formatNumber(row.attempts_before_hint)}</td>
                <td>{formatNumber(row.attempts_after_hint)}</td>
                <td>{formatNumber(row.time_to_solve_after_hint_minutes)} min</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!showAllProblemRows && orderedProblemRows.length > 10 ? (
          <div className={styles.tableFade} />
        ) : null}
      </div>
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
