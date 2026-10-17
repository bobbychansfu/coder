"use client";

import { useState } from "react";
import { Box } from "@mui/material";
import SubmissionCodeDialog from "@/fe/contests/components/SubmissionCodeDialog";
import type { ContestProblem } from "@/fe/contests/data/contestDetails";
import { SUBMISSION_STATUS_CONFIG } from "@/fe/shared/constants/options";
import {
  formatTimeAgo,
  mapSubmissionStatus,
  type SubmissionStatus,
} from "@/fe/contests/services/contestProblem";
import styles from "@/fe/contests/styles/ContestDetailPage.module.css";

export interface ContestSubmissionRow {
  id: string;
  problemId: string;
  status: SubmissionStatus;
  languageLabel: string;
  createdAt: string;
  by: string;
  isOwn: boolean;
}

interface SubmissionsTabProps {
  contestId: string;
  problems: ContestProblem[];
  submissions: ContestSubmissionRow[];
}

// The team's submissions to every problem, newest first; staff get every team's
export default function SubmissionsTab({ contestId, problems, submissions }: SubmissionsTabProps) {
  const [openSubmissionId, setOpenSubmissionId] = useState<string | null>(null);
  const problemById = new Map(problems.map((problem) => [problem.problemId, problem]));
  const showBy = submissions.some((submission) => !submission.isOwn);
  const gridTemplateColumns = [
    "56px",
    "minmax(0, 1fr)",
    showBy ? "minmax(0, 0.8fr)" : null,
    "150px",
    "100px",
    "130px",
  ]
    .filter(Boolean)
    .join(" ");
  const openSubmission = submissions.find((submission) => submission.id === openSubmissionId);
  const openProblem = openSubmission ? problemById.get(openSubmission.problemId) : undefined;

  return (
    <>
      <Box className={styles.problemTable}>
        <Box className={`${styles.problemTableRow} ${styles.problemTableHeader}`} sx={{ gridTemplateColumns }}>
          <span className={styles.problemTableCenter}>#</span>
          <span>Problem</span>
          {showBy ? <span>By</span> : null}
          <span>Status</span>
          <span>Language</span>
          <span>Submitted</span>
        </Box>

        {submissions.length === 0 ? (
          <Box className={styles.problemTableRow}>
            <span className={styles.submissionsEmpty}>No submissions yet.</span>
          </Box>
        ) : (
          submissions.map((submission) => {
            const problem = problemById.get(submission.problemId);
            const status = SUBMISSION_STATUS_CONFIG[mapSubmissionStatus(submission.status)];
            const StatusIcon = status.icon;
            return (
              <button
                key={submission.id}
                type="button"
                className={`${styles.problemTableRow} ${styles.problemTableButton}`}
                style={{ gridTemplateColumns }}
                onClick={() => setOpenSubmissionId(submission.id)}
              >
                <span className={`${styles.problemTableCenter} ${styles.problemTableCode}`}>
                  {problem?.code ?? "?"}
                </span>
                <span className={styles.problemTableName}>{problem?.title ?? ""}</span>
                {showBy ? (
                  <span className={styles.problemTableName}>
                    {submission.isOwn ? "You" : submission.by}
                  </span>
                ) : null}
                <span className={styles.submissionsStatus} style={{ color: status.color }}>
                  <StatusIcon sx={{ fontSize: 16 }} />
                  {status.label}
                </span>
                <span>{submission.languageLabel}</span>
                <span
                  className={styles.submissionsMuted}
                  title={new Date(submission.createdAt).toLocaleString()}
                >
                  {formatTimeAgo(submission.createdAt)}
                </span>
              </button>
            );
          })
        )}
      </Box>

      <SubmissionCodeDialog
        contestId={contestId}
        submissionId={openSubmissionId}
        title={openProblem ? `${openProblem.code}. ${openProblem.title}` : "Submission"}
        onClose={() => setOpenSubmissionId(null)}
      />
    </>
  );
}
