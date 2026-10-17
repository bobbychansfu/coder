"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  Dialog,
  IconButton,
  Typography,
} from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import PageHeader from "@/fe/shared/components/PageHeader";
import TabSwitcher from "@/fe/shared/components/ui/TabSwitcher";
import { buildContestTabs } from "@/fe/shared/constants/routes";
import { useNotifications } from "@/fe/shared/components/notifications/NotificationsProvider";
import AiHintDialog from "@/fe/shared/components/problem/AiHintDialog";
import ProblemHeader from "@/fe/shared/components/problem/ProblemHeader";
import ProblemDetails from "@/fe/shared/components/problem/ProblemDetails";
import SolutionEditor from "@/fe/shared/components/problem/SolutionEditor";
import SubmissionCodeDialog from "@/fe/contests/components/SubmissionCodeDialog";
import type { ContestDetailStatus } from "@/fe/contests/data/contestDetails";
import {
  DEFAULT_CODE_LANGUAGE,
  usePersistedCodeDraft,
  type SupportedCodeLanguage,
} from "@/fe/shared/services/codeDraftStorage";
import type { ProblemDetail, SubmissionRecord } from "@/fe/contests/data/problemDetails";
import {
  adaptContestSubmissionRecords,
  type ContestProblemSubmissionsResponse,
} from "@/fe/contests/services/contestProblem";
import {
  ContestTimeLeftPopup,
  ContestTimer,
  useContestTimeLeftAlert,
} from "./ProblemSubmissionTiming";
import {
  getContestDraftStorageKey,
  useContestDraftPersistence,
} from "./ProblemSubmissionDraftTransfer";
import {
  buildRunResult,
  sleep,
  type ContestSubmitResponse,
  type RunResult,
} from "./ProblemSubmissionResult";
import styles from "@/fe/contests/styles/ProblemSubmissionPage.module.css";

interface ProblemNavigator {
  position: number;
  total: number;
  previousHref?: string;
  nextHref?: string;
}

interface ProblemSubmissionPageProps {
  contestId: string;
  computingId: string;
  contestStatus?: ContestDetailStatus;
  contestStartsAt?: string | null;
  contestEndsAt?: string | null;
  contestDurationMinutes?: number | null;
  aiHintEnabled?: boolean;
  detail: ProblemDetail;
  navigator?: ProblemNavigator;
}

type SupportedLanguage = SupportedCodeLanguage;

const DEFAULT_LANGUAGE: SupportedLanguage = DEFAULT_CODE_LANGUAGE;
const SUBMISSION_POLL_INTERVAL_MS = 1_500;
const SUBMISSION_POLL_ATTEMPTS = 40;

function getHintText(payload: unknown, depth = 0): string | null {
  if (depth > 5 || !payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  for (const key of ["hint", "feedback", "message", "response", "text"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return getHintText(record.data, depth + 1);
}

export default function ProblemSubmissionPage({
  contestId,
  computingId,
  contestStatus,
  contestStartsAt,
  contestEndsAt,
  contestDurationMinutes,
  aiHintEnabled = false,
  detail,
  navigator,
}: ProblemSubmissionPageProps) {
  return (
    <ProblemSubmissionPageContent
      key={`${computingId}:${contestId}:${detail.code}`}
      contestId={contestId}
      computingId={computingId}
      contestStatus={contestStatus}
      contestStartsAt={contestStartsAt}
      contestEndsAt={contestEndsAt}
      contestDurationMinutes={contestDurationMinutes}
      aiHintEnabled={aiHintEnabled}
      detail={detail}
      navigator={navigator}
    />
  );
}

function ProblemSubmissionPageContent({
  contestId,
  computingId,
  contestStatus,
  contestStartsAt,
  contestEndsAt,
  contestDurationMinutes,
  aiHintEnabled = false,
  detail,
  navigator,
}: ProblemSubmissionPageProps) {
  const router = useRouter();
  const storageKey = getContestDraftStorageKey(computingId, contestId, detail.code);
  const persistedDraft = usePersistedCodeDraft(storageKey);
  const [tab, setTab] = useState("description");
  const [editorOpen, setEditorOpen] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [drafts, setDrafts] = useState<Partial<Record<SupportedLanguage, string>>>({});
  const setViewedSubmissions = useNotifications()?.setViewedSubmissions;

  // This problem's verdicts are already visible on its Submissions tab, so no toast
  useEffect(() => {
    if (!setViewedSubmissions || tab !== "submissions" || !detail.problemId) {
      return;
    }
    setViewedSubmissions({ contestId, problemId: detail.problemId });
    return () => setViewedSubmissions(null);
  }, [setViewedSubmissions, tab, contestId, detail.problemId]);
  const [hasRun, setHasRun] = useState(false);
  const [hasLocalDraftState, setHasLocalDraftState] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "done" | "failed">(
    "idle",
  );
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [submissions, setSubmissions] = useState(detail.submissions);
  const [openSubmissionId, setOpenSubmissionId] = useState<string | null>(null);
  const [aiHintOpen, setAiHintOpen] = useState(false);
  const [aiHintMessage, setAiHintMessage] = useState<string | null>(null);
  const [aiHintError, setAiHintError] = useState<string | null>(null);
  const [aiHintLoading, setAiHintLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const effectiveLanguage =
    hasLocalDraftState ? language : (persistedDraft?.language ?? DEFAULT_LANGUAGE);
  const effectiveDrafts =
    hasLocalDraftState ? drafts : (persistedDraft?.drafts ?? drafts);
  const code = effectiveDrafts[effectiveLanguage] ?? detail.starterCodes?.[effectiveLanguage] ?? "";
  const hasCode = code.trim().length > 0;
  const isJudging = submitState === "submitting";
  const contestEndsAtTime = contestEndsAt ? new Date(contestEndsAt).getTime() : null;
  const contestEndedByTime =
    typeof contestEndsAtTime === "number" &&
    Number.isFinite(contestEndsAtTime) &&
    contestEndsAtTime <= currentTime;
  const aiHintLockedReason =
    contestStatus === "closed" || contestEndedByTime
      ? "AI hints are disabled after the contest ends."
      : null;
  const submissionsLockedReason =
    contestStatus === "upcoming" ? "Submissions open when this contest starts." : null;
  const submissionsLocked = submissionsLockedReason !== null;
  // After the end the problems stay open for upsolving, which doesn't count
  const submissionsNote =
    submissionsLockedReason ??
    (contestStatus === "closed" || contestEndedByTime
      ? "The contest has ended. New submissions don't count."
      : null);
  const displayedRunResult = runResult;
  const detailWithHistory = {
    ...detail,
    submissions,
  };

  const { activeTimeLeftAlert, closeTimeLeftAlert } = useContestTimeLeftAlert({
    contestStatus,
    contestStartsAt,
    contestEndsAt,
    contestDurationMinutes,
  });

  useContestDraftPersistence({
    storageKey,
    effectiveLanguage,
    effectiveDrafts,
    persistedDraft,
  });

  const refetchSubmissions = async (): Promise<SubmissionRecord[]> => {
    if (!detail.problemId) {
      return [];
    }

    const response = await fetch(`/api/s/submissions/${contestId}/${detail.problemId}`, {
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to refresh submissions.");
    }

    const payload = (await response.json()) as ContestProblemSubmissionsResponse;
    const records = adaptContestSubmissionRecords(payload);
    setSubmissions(records);
    return records;
  };

  // Teammates may have submitted since the page loaded
  useEffect(() => {
    if (tab !== "submissions" || isJudging || !detail.problemId) {
      return;
    }

    let cancelled = false;
    fetch(`/api/s/submissions/${contestId}/${detail.problemId}`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: ContestProblemSubmissionsResponse | null) => {
        if (!cancelled && payload) {
          setSubmissions(adaptContestSubmissionRecords(payload));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [tab, isJudging, contestId, detail.problemId]);

  const pollForSubmissionSettlement = async (submissionId: string) => {
    for (let attempt = 0; attempt < SUBMISSION_POLL_ATTEMPTS; attempt += 1) {
      await sleep(SUBMISSION_POLL_INTERVAL_MS);
      const records = await refetchSubmissions();
      const submittedRecord = records.find((record) => record.id === submissionId);

      if (submittedRecord && submittedRecord.status !== "pending") {
        return submittedRecord;
      }
    }

    return null;
  };

  const requestAiHint = async () => {
    if (aiHintLockedReason) {
      setAiHintOpen(true);
      setAiHintLoading(false);
      setAiHintMessage(null);
      setAiHintError(aiHintLockedReason);
      return;
    }

    const hintProblemId = detail.problemId ?? detail.practiceProblemCode ?? detail.code;

    setAiHintOpen(true);
    setAiHintLoading(true);
    setAiHintError(null);

    try {
      const response = await fetch("/api/s/request_hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          pid: hintProblemId,
          contest_id: contestId,
          problem_code: detail.code,
          problem_title: detail.title,
          language: effectiveLanguage,
          code,
        }),
      });

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const errorPayload = payload as { details?: string; error?: string } | null;
        throw new Error(
          errorPayload?.details ??
            errorPayload?.error ??
            ("Failed to generate hint (Status " + response.status + ").")
        );
      }

      const hintText = getHintText(payload);

      if (!hintText) {
        throw new Error("Hint service returned an empty response.");
      }

      setAiHintMessage(hintText);
    } catch (error) {
      setAiHintError(error instanceof Error ? error.message : "Failed to generate hint.");
    } finally {
      setAiHintLoading(false);
    }
  };

  const submitContestCode = async () => {
    if (!hasCode || !detail.problemId) {
      return;
    }

    setHasRun(true);
    setTab("submissions");
    setSubmitState("submitting");
    setRunResult(null);

    try {
      const response = await fetch(`/api/s/submit/${contestId}/${detail.problemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          language: effectiveLanguage,
          code,
        }),
      });

      const payload = (await response.json()) as ContestSubmitResponse | { error?: string };

      if (!response.ok || !("sid" in payload)) {
        const errorMessage = "error" in payload ? payload.error : undefined;
        throw new Error(errorMessage ?? "Failed to submit solution.");
      }

      const refreshedSubmissions = await refetchSubmissions();
      const submittedRecord = refreshedSubmissions.find((record) => record.id === payload.sid);
      const finalRecord =
        submittedRecord?.status === "pending"
          ? await pollForSubmissionSettlement(payload.sid)
          : submittedRecord ?? null;
      const finalVerdict = finalRecord?.status ?? payload.status ?? null;

      setSubmitState("done");
      setRunResult(
        buildRunResult({
          submissionId: payload.sid,
          status: "done",
          verdict: finalVerdict,
          feedback: navigator?.nextHref
            ? `${payload.message} You can use the navigator to continue to the next problem.`
            : payload.message,
          errorMessage: null,
          testcases: [],
        }),
      );
    } catch (error) {
      setSubmitState("failed");
      setRunResult(
        buildRunResult({
          submissionId: "",
          status: "failed",
          verdict: "failed",
          feedback: null,
          errorMessage: error instanceof Error ? error.message : "Failed to submit solution.",
          testcases: [],
        }),
      );
    }
  };

  const outputSection =
    hasRun ? (
      <div className={styles.outputSection}>
        <Typography className={styles.outputTitle}>Output</Typography>
        <div className={styles.outputBlock}>
          {isJudging ? (
            <Box display="flex" alignItems="center" gap="10px">
              <CircularProgress size={14} sx={{ color: "#f3f4f6" }} />
              <span className={styles.outputText}>Submitting your code...</span>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap="8px">
              <span className={styles.outputText}>
                {displayedRunResult?.feedback ??
                  displayedRunResult?.errorMessage ??
                  displayedRunResult?.verdict ??
                  "Submission recorded."}
              </span>
              {displayedRunResult && displayedRunResult.testcases.length > 0 ? (
                <Box display="flex" flexDirection="column" gap="6px">
                  {displayedRunResult.testcases.map((testcase) => (
                    <span key={testcase.name} className={styles.outputText}>
                      {`${testcase.passed ? "[pass]" : "[fail]"} ${testcase.name}: ${testcase.message}`}
                    </span>
                  ))}
                </Box>
              ) : null}
            </Box>
          )}
        </div>
      </div>
    ) : undefined;

  return (
    <Box className={styles.page}>
      {/* <PageHeader onBack={() => router.back()} /> */}
      <Box className={styles.timerHeaderRow}>
        <Box
          className={styles.timerHeaderLeft}
          display="inline-flex"
          flexDirection="row"
          alignItems="center"
          flexWrap="nowrap"
          gap="12px"
        >
          {/* Always this problem's contest: browser history may hold another page or nothing at all. */}
          <PageHeader onBack={() => router.push(`/contests/${contestId}`)} />
          <ContestTimer
            startsAt={contestStartsAt}
            endsAt={contestEndsAt}
            durationMinutes={contestDurationMinutes}
          />
        </Box>
        {activeTimeLeftAlert !== null ? (
          <ContestTimeLeftPopup
            threshold={activeTimeLeftAlert}
            onClose={closeTimeLeftAlert}
          />
        ) : null}
      </Box>

      <TabSwitcher
        value="problems"
        options={buildContestTabs(contestId)}
        ariaLabel="Contest navigation"
        className={styles.contestNav}
      />

      {/* The statement takes the full width; the editor opens from Submit, as on Kattis */}
      <Box className={`${styles.container} ${styles.containerSingle}`}>
        <Box className={styles.leftColumn}>
          <ProblemHeader
            // The contest letter, as on Codeforces: "A. Two Sum"
            title={`${detail.code}. ${detail.title}`}
            difficulty={detail.difficulty}
            tags={detail.tags}
            points={detail.points}
            showPoints={false}
            headerActions={
              <Box className={styles.problemHeaderActions}>
                {navigator ? (
                  <Box className={styles.problemNavigator}>
                    <ButtonBase
                      className={`${styles.problemNavButton} ${!navigator.previousHref ? styles.problemNavButtonDisabled : ""}`}
                      onClick={() => navigator.previousHref && router.push(navigator.previousHref)}
                      disabled={!navigator.previousHref}
                      aria-label="Previous problem"
                    >
                      <ChevronLeftRoundedIcon fontSize="small" />
                    </ButtonBase>
                    <span className={styles.problemNavCount}>
                      {navigator.position} / {navigator.total}
                    </span>
                    <ButtonBase
                      className={styles.problemNavButton}
                      onClick={() => navigator.nextHref && router.push(navigator.nextHref)}
                      disabled={!navigator.nextHref}
                      aria-label="Next problem"
                    >
                      <ChevronRightRoundedIcon fontSize="small" />
                    </ButtonBase>
                  </Box>
                ) : null}
                <Button
                  className={`${styles.submitButton} ${styles.openSubmitButton}`}
                  variant="contained"
                  disableElevation
                  startIcon={<SendRoundedIcon fontSize="small" />}
                  onClick={() => setEditorOpen(true)}
                  sx={{ backgroundColor: "#dc2626", "&:hover": { backgroundColor: "#ef4444" } }}
                >
                  Submit
                </Button>
              </Box>
            }
          />
          <ProblemDetails
            detail={detailWithHistory}
            tab={tab}
            onTabChange={setTab}
            hideEditorial
            compactSubmissions
            outputSection={outputSection}
            onSubmissionClick={setOpenSubmissionId}
          />
        </Box>
      </Box>

      <Dialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        fullWidth
        maxWidth="md"
        // Keeps the editor (and its undo history) between openings
        keepMounted
        // Lets the AI hint panel, which sits outside the dialog, take focus
        disableEnforceFocus
        slotProps={{ paper: { className: styles.submitDialogPaper } }}
      >
        <Box className={styles.submitDialogHeader}>
          <Typography className={styles.submitDialogTitle}>{detail.title}</Typography>
          <IconButton aria-label="Close" size="small" onClick={() => setEditorOpen(false)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box className={styles.submitDialogBody}>
          <SolutionEditor
            language={effectiveLanguage}
            code={code}
            onLanguageChange={(nextLanguage) => {
              setHasLocalDraftState(true);
              setLanguage(nextLanguage as SupportedLanguage);
              setDrafts((currentDrafts) =>
                hasLocalDraftState ? currentDrafts : (persistedDraft?.drafts ?? currentDrafts),
              );
            }}
            onCodeChange={(nextCode) => {
              setHasLocalDraftState(true);
              setDrafts((currentDrafts) => ({
                ...(hasLocalDraftState ? currentDrafts : (persistedDraft?.drafts ?? currentDrafts)),
                [effectiveLanguage]: nextCode,
              }));
            }}
            onSubmitCode={() => {
              // Close so the verdict is visible in the Submissions tab
              setEditorOpen(false);
              void submitContestCode();
            }}
            footerContent={
              submissionsNote ? (
                <Box px="20px" pb="4px">
                  <Typography variant="body2" color="text.secondary">
                    {submissionsNote}
                  </Typography>
                </Box>
              ) : undefined
            }
            submitButtonDisabled={!hasCode || isJudging || !detail.problemId || submissionsLocked}
            submitButtonLabel={submitState === "submitting" ? "Submitting..." : "Submit"}
            submitButtonStartIcon={<SendRoundedIcon fontSize="small" />}
            showAiHint={aiHintEnabled}
            aiHintDisabled={Boolean(aiHintLockedReason)}
            aiHintLoading={aiHintLoading}
            onRequestAiHint={requestAiHint}
          />
        </Box>
      </Dialog>

      <SubmissionCodeDialog
        contestId={contestId}
        submissionId={openSubmissionId}
        title={`${detail.code}. ${detail.title}`}
        onClose={() => setOpenSubmissionId(null)}
      />

      <AiHintDialog
        open={aiHintOpen}
        loading={aiHintLoading}
        hint={aiHintMessage}
        error={aiHintError}
        onClose={() => setAiHintOpen(false)}
        onRetry={() => void requestAiHint()}
      />
    </Box>
  );
}
