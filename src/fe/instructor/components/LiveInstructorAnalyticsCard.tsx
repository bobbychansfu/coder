"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Button } from "@mui/material";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import TableViewOutlinedIcon from "@mui/icons-material/TableViewOutlined";
import QueryStatsOutlinedIcon from "@mui/icons-material/QueryStatsOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import styles from "@/fe/instructor/styles/LiveInstructorAnalyticsCard.module.css";

interface ContestMetricRow {
  contest_id: string;
  contest_name: string;
  solve_rate: number;
  mean_solve_time_minutes: number | null;
  median_solve_time_minutes: number | null;
  attempts_to_solve: number | null;
}

interface ProblemMetricRow {
  contest_id: string;
  contest_name: string;
  problem_id: string;
  problem_code: string;
  problem_title: string;
  time_to_first_submission_minutes: number | null;
  time_to_first_correct_submission_minutes: number | null;
  post_hint_solve_probability: number | null;
  attempts_before_hint: number | null;
  attempts_after_hint: number | null;
  time_to_solve_after_hint_minutes: number | null;
}

type SegmentKey = "all" | "groupA" | "groupB";
type ViewMode = "all" | "groupA" | "groupB" | "student";

interface MetricBundle {
  contest_metrics: ContestMetricRow[];
  problem_metrics: ProblemMetricRow[];
}

interface StudentCatalogRow {
  computingId: string;
  name: string;
  segment: "groupA" | "groupB";
}

interface InstructorMetadataPayload {
  segmented_metrics?: Record<SegmentKey, MetricBundle>;
  student_views?: Record<string, MetricBundle>;
  students_catalog?: StudentCatalogRow[];
  analytics_notes?: string[];
}

function formatNumber(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "N/A";
  }
  return `${value}`;
}

function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "N/A";
  }
  return `${value}%`;
}

export default function LiveInstructorAnalyticsCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<InstructorMetadataPayload | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [selectedStudent, setSelectedStudent] = useState("student01");
  const [selectedContestId, setSelectedContestId] = useState("all");

  async function fetchInstructorMetadata(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/metadata", { method: "GET", cache: "no-store" });
      const json = (await response.json()) as InstructorMetadataPayload & { error?: string };
      if (!response.ok) {
        setError(json.error || `Request failed (${response.status})`);
        setPayload(null);
      } else {
        setPayload(json);
        const firstStudent = json.students_catalog?.[0]?.computingId;
        if (firstStudent && !json.student_views?.[selectedStudent]) {
          setSelectedStudent(firstStudent);
        }
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unknown request error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const response = await fetch("/api/auth/metadata", {
          method: "GET",
          cache: "no-store",
        });
        const json = (await response.json()) as InstructorMetadataPayload & { error?: string };
        if (cancelled) {
          return;
        }
        if (!response.ok) {
          setError(json.error || `Request failed (${response.status})`);
          setPayload(null);
          return;
        }
        setPayload(json);
        const firstStudent = json.students_catalog?.[0]?.computingId;
        if (firstStudent) {
          setSelectedStudent(firstStudent);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Unknown request error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeBundle = useMemo(() => {
    if (!payload) {
      return { contest_metrics: [], problem_metrics: [] } as MetricBundle;
    }
    if (viewMode === "student") {
      return payload.student_views?.[selectedStudent] || { contest_metrics: [], problem_metrics: [] };
    }
    return payload.segmented_metrics?.[viewMode] || { contest_metrics: [], problem_metrics: [] };
  }, [payload, viewMode, selectedStudent]);

  const contestRows = activeBundle.contest_metrics;
  const contestOptions = useMemo(() => {
    const rows = activeBundle.contest_metrics;
    return [
      { id: "all", name: "All Contests" },
      ...rows.map((row) => ({ id: row.contest_id, name: row.contest_name })),
    ];
  }, [activeBundle.contest_metrics]);

  const filteredContestRows =
    selectedContestId === "all"
      ? contestRows
      : contestRows.filter((row) => row.contest_id === selectedContestId);

  const filteredProblemRows =
    selectedContestId === "all"
      ? activeBundle.problem_metrics
      : activeBundle.problem_metrics.filter((row) => row.contest_id === selectedContestId);

  const avgSolveRate =
    filteredContestRows.length === 0
      ? null
      : filteredContestRows.reduce((sum, row) => sum + row.solve_rate, 0) / filteredContestRows.length;
  const avgMedianTime =
    filteredContestRows.length === 0
      ? null
      : filteredContestRows.reduce((sum, row) => sum + (row.median_solve_time_minutes || 0), 0) /
        filteredContestRows.length;

  return (
    <Box className={styles.card}>
      <Box className={styles.headerRow}>
        <Box>
          <h3 className={styles.title}>Live Contest & Problem Metrics</h3>
          <p className={styles.subtitle}>Simple instructor view: all students, Group A/B, or one student.</p>
        </Box>
        <Box className={styles.actions}>
          <Button variant="outlined" size="small" onClick={() => void fetchInstructorMetadata()}>
            Refresh
          </Button>
        </Box>
      </Box>

      <Box className={styles.filterRow}>
        <label className={styles.filterField}>
          <span>View</span>
          <select
            value={viewMode}
            onChange={(e) => {
              setViewMode(e.target.value as ViewMode);
              setSelectedContestId("all");
            }}
          >
            <option value="all">All Students</option>
            <option value="groupA">Group A</option>
            <option value="groupB">Group B</option>
            <option value="student">Single Student</option>
          </select>
        </label>

        <label className={styles.filterField}>
          <span>Contest</span>
          <select
            value={selectedContestId}
            onChange={(e) => setSelectedContestId(e.target.value)}
          >
            {contestOptions.map((contest) => (
              <option key={contest.id} value={contest.id}>
                {contest.name}
              </option>
            ))}
          </select>
        </label>

        {viewMode === "student" && (
          <label className={styles.filterField}>
            <span>Student</span>
            <input
              className={styles.studentInput}
              list="student-catalog"
              value={selectedStudent}
              onChange={(e) => {
                setSelectedStudent(e.target.value);
                setSelectedContestId("all");
              }}
              placeholder="e.g. student01"
            />
            <datalist id="student-catalog">
              {(payload?.students_catalog || []).map((student) => (
                <option key={student.computingId} value={student.computingId}>
                  {student.name} ({student.segment})
                </option>
              ))}
            </datalist>
          </label>
        )}
      </Box>

      {loading && <p className={styles.info}>Loading...</p>}
      {error && <p className={styles.error}>{error}</p>}

      <Box className={styles.summaryRow}>
        <Box className={styles.summaryItem}>
          <Groups2OutlinedIcon className={styles.summaryIcon} />
          <Box>
            <p className={styles.summaryLabel}>Contests</p>
            <p className={styles.summaryValue}>{contestRows.length}</p>
          </Box>
        </Box>
        <Box className={styles.summaryItem}>
          <QueryStatsOutlinedIcon className={styles.summaryIcon} />
          <Box>
            <p className={styles.summaryLabel}>Avg Solve Rate</p>
            <p className={styles.summaryValue}>{formatPercent(avgSolveRate)}</p>
          </Box>
        </Box>
        <Box className={styles.summaryItem}>
          <TimerOutlinedIcon className={styles.summaryIcon} />
          <Box>
            <p className={styles.summaryLabel}>Avg Median Solve Time</p>
            <p className={styles.summaryValue}>{formatNumber(avgMedianTime)} min</p>
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
            {filteredContestRows.map((row) => (
              <tr key={row.contest_id}>
                <td>{row.contest_name}</td>
                <td>{formatPercent(row.solve_rate)}</td>
                <td>{formatNumber(row.mean_solve_time_minutes)} min</td>
                <td>{formatNumber(row.median_solve_time_minutes)} min</td>
                <td>{formatNumber(row.attempts_to_solve)}</td>
              </tr>
            ))}
            {filteredContestRows.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  No contest metrics yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h4 className={styles.sectionTitle}>
        <TableViewOutlinedIcon className={styles.sectionIcon} />
        Problem Metrics
      </h4>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Problem</th>
              <th>T1: First Submission</th>
              <th>T2: First Correct</th>
              <th>Post-Hint Solve Prob.</th>
              <th>Attempts Before Hint</th>
              <th>Attempts After Hint</th>
              <th>Time to Solve After Hint</th>
            </tr>
          </thead>
          <tbody>
            {filteredProblemRows.map((row) => (
              <tr key={`${row.contest_id}:${row.problem_id}`}>
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
            {filteredProblemRows.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  No problem metrics for selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Box>
  );
}
