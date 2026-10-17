"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Box, CircularProgress, Dialog, IconButton, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { LANGUAGE_OPTIONS, SUBMISSION_STATUS_CONFIG } from "@/fe/shared/constants/options";
import {
  formatTimeAgo,
  mapSubmissionStatus,
  type SubmissionStatus,
} from "@/fe/contests/services/contestProblem";
import styles from "@/fe/contests/styles/ProblemSubmissionPage.module.css";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

interface SubmissionCode {
  id: string;
  code: string;
  status: SubmissionStatus;
  language: string;
  languageLabel: string;
  createdAt: string;
  author: string;
  team: string | null;
  isOwn: boolean;
}

interface SubmissionCodeDialogProps {
  contestId: string;
  // The submission to show; null keeps the dialog closed
  submissionId: string | null;
  title: string;
  onClose: () => void;
}

type LoadState =
  | { submissionId: string; submission: SubmissionCode; error: null }
  | { submissionId: string; submission: null; error: string };

export default function SubmissionCodeDialog({
  contestId,
  submissionId,
  title,
  onClose,
}: SubmissionCodeDialogProps) {
  const [loaded, setLoaded] = useState<LoadState | null>(null);

  useEffect(() => {
    if (!submissionId) {
      return;
    }

    let cancelled = false;
    fetch(`/api/s/submission/${encodeURIComponent(contestId)}/${encodeURIComponent(submissionId)}`, {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | { submission?: SubmissionCode; error?: string }
          | null;
        if (cancelled) {
          return;
        }
        setLoaded(
          response.ok && payload?.submission
            ? { submissionId, submission: payload.submission, error: null }
            : { submissionId, submission: null, error: payload?.error ?? "Couldn't load this submission." },
        );
      })
      .catch(() => {
        if (!cancelled) {
          setLoaded({ submissionId, submission: null, error: "Couldn't load this submission." });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [contestId, submissionId]);

  // Whatever is loaded belongs to an earlier submission until this one arrives
  const current = loaded?.submissionId === submissionId ? loaded : null;
  const submission = current?.submission ?? null;
  const status = submission ? SUBMISSION_STATUS_CONFIG[mapSubmissionStatus(submission.status)] : null;
  const StatusIcon = status?.icon;
  const editorLanguage =
    LANGUAGE_OPTIONS.find((option) => option.value === submission?.language)?.monacoLanguage ??
    "plaintext";
  const by = submission
    ? [submission.isOwn ? "You" : submission.author, submission.team !== submission.author ? submission.team : null]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <Dialog
      open={submissionId !== null}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      slotProps={{ paper: { className: styles.submitDialogPaper } }}
    >
      <Box className={styles.submitDialogHeader}>
        <Typography className={styles.submitDialogTitle}>{title}</Typography>
        <IconButton aria-label="Close" size="small" onClick={onClose}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box className={styles.submissionCodeBody}>
        {submission && status && StatusIcon ? (
          <>
            <Box className={styles.submissionCodeMeta}>
              <Box className={styles.submissionStatusCell}>
                <StatusIcon sx={{ fontSize: 16, color: status.color }} />
                <Typography className={styles.submissionStatusText} sx={{ color: status.color }}>
                  {status.label}
                </Typography>
              </Box>
              <Typography className={styles.submissionsCell}>{submission.languageLabel}</Typography>
              <Typography className={styles.submissionsCell}>{by}</Typography>
              <Typography
                className={styles.submissionsCellMuted}
                title={new Date(submission.createdAt).toLocaleString()}
              >
                {formatTimeAgo(submission.createdAt)}
              </Typography>
            </Box>
            <Box className={styles.codeEditorWrapper}>
              <Box className={styles.codeEditorSurface}>
                <MonacoEditor
                  height="100%"
                  language={editorLanguage}
                  value={submission.code}
                  theme="vs-light"
                  options={{
                    readOnly: true,
                    domReadOnly: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: "\"JetBrains Mono\", \"Fira Code\", monospace",
                    lineHeight: 26,
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    glyphMargin: false,
                    lineNumbers: "on",
                    lineNumbersMinChars: 3,
                    lineDecorationsWidth: 8,
                    renderLineHighlight: "none",
                    overviewRulerBorder: false,
                    scrollbar: {
                      verticalScrollbarSize: 10,
                      horizontalScrollbarSize: 10,
                      useShadows: false,
                    },
                    padding: { top: 18, bottom: 24 },
                  }}
                />
              </Box>
            </Box>
          </>
        ) : current?.error ? (
          <Typography className={styles.emptyState}>{current.error}</Typography>
        ) : (
          <Box display="flex" justifyContent="center" py="48px">
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>
    </Dialog>
  );
}
