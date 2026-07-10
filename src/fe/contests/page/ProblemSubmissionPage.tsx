"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, ButtonBase, CircularProgress, Typography } from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import PageHeader from "@/fe/shared/components/PageHeader";
import AiHintDialog from "@/fe/shared/components/problem/AiHintDialog";
import ProblemHeader from "@/fe/shared/components/problem/ProblemHeader";
import ProblemDetails from "@/fe/shared/components/problem/ProblemDetails";
import SolutionEditor from "@/fe/shared/components/problem/SolutionEditor";
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
  type ContestPracticeProblemLink,
  useContestDraftPersistence,
  useContestPracticeRedirect,
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
  contestStatus?: ContestDetailStatus;
  contestStartsAt?: string | null;
  contestEndsAt?: string | null;
  contestDurationMinutes?: number | null;
  practiceProblemLinks?: ContestPracticeProblemLink[];
  aiHintEnabled?: boolean;
  detail: ProblemDetail;
  navigator?: ProblemNavigator;
}

type SupportedLanguage = SupportedCodeLanguage;

const DEFAULT_LANGUAGE: SupportedLanguage = DEFAULT_CODE_LANGUAGE;
const SUBMISSION_POLL_INTERVAL_MS = 1_500;
const SUBMISSION_POLL_ATTEMPTS = 40;

interface RunResult {
  submissionId: string;
  status: "idle" | "submitting" | "done" | "failed";
  verdict: string | null;
  feedback: string | null;
  errorMessage: string | null;
  testcases: { name: string; passed: boolean; message: string }[];
}

interface ContestSubmitResponse {
  sid: string;
  message: string;
  score?: number;
  status?: string;
  runtime?: string;
  memory?: string;
}

function formatVerdictLabel(verdict: string | null | undefined) {
  const normalized = verdict?.trim().toLowerCase();

  switch (normalized) {
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted";
    case "wrong_answer":
    case "wrong answer":
    case "wrong":
      return "Wrong Answer";
    case "time_limit_exceeded":
    case "time limit exceeded":
    case "tle":
      return "Time Limit Exceeded";
    case "runtime_error":
    case "runtime error":
      return "Runtime Error";
    case "system_error":
    case "system error":
    case "judge_error":
    case "judge error":
    case "ierr":
    case "internal_error":
    case "internal error":
      return "System Error";
    case "compile_error":
    case "compile error":
      return "Compile Error";
    case "failed":
      return "Failed";
    default:
      return null;
  }
}

function buildRunResult(input: {
  submissionId: string;
  status: RunResult["status"];
  verdict: string | null | undefined;
  feedback: string | null;
  errorMessage: string | null;
  testcases: RunResult["testcases"];
}): RunResult {
  return {
    submissionId: input.submissionId,
    status: input.status,
    verdict: formatVerdictLabel(input.verdict),
    feedback: input.feedback,
    errorMessage: input.errorMessage,
    testcases: input.testcases,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  contestStatus,
  contestStartsAt,
  contestEndsAt,
  contestDurationMinutes,
  practiceProblemLinks,
  aiHintEnabled = false,
  detail,
  navigator,
}: ProblemSubmissionPageProps) {
  return (
    <ProblemSubmissionPageContent
      key={`${contestId}:${detail.code}`}
      contestId={contestId}
      contestStatus={contestStatus}
      contestStartsAt={contestStartsAt}
      contestEndsAt={contestEndsAt}
      contestDurationMinutes={contestDurationMinutes}
      practiceProblemLinks={practiceProblemLinks}
      aiHintEnabled={aiHintEnabled}
      detail={detail}
      navigator={navigator}
    />
  );
}

function ProblemSubmissionPageContent({
  contestId,
  contestStatus,
  contestStartsAt,
  contestEndsAt,
  contestDurationMinutes,
  practiceProblemLinks = [],
  aiHintEnabled = false,
  detail,
  navigator,
}: ProblemSubmissionPageProps) {
  const router = useRouter();
  const storageKey = getContestDraftStorageKey(contestId, detail.code);
  const persistedDraft = usePersistedCodeDraft(storageKey);
  const [tab, setTab] = useState("description");
  const [language, setLanguage] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [drafts, setDrafts] = useState<Partial<Record<SupportedLanguage, string>>>({});
  const [hasRun, setHasRun] = useState(false);
  const [hasLocalDraftState, setHasLocalDraftState] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "done" | "failed">(
    "idle",
  );
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [submissions, setSubmissions] = useState(detail.submissions);
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
    contestStatus === "upcoming"
      ? "Submissions open when this contest starts."
      : contestStatus === "closed" || contestEndedByTime
        ? "This contest has ended. You can review problems and submissions, but new submissions and AI hints are disabled."
        : null;
  const submissionsLocked = submissionsLockedReason !== null;
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

  useContestPracticeRedirect({
    contestId,
    contestStatus,
    contestStartsAt,
    contestEndsAt,
    contestDurationMinutes,
    contestProblemCode: detail.code,
    practiceProblemCode: detail.practiceProblemCode ?? detail.code,
    practiceProblemLinks,
    effectiveLanguage,
    effectiveDrafts,
    persistedDraft,
    router,
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
          <PageHeader onBack={() => router.back()} />
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

      <Box className={styles.container}>
        <Box className={styles.leftColumn}>
          <ProblemHeader
            title={detail.title}
            difficulty={detail.difficulty}
            tags={detail.tags}
            points={detail.points}
            showPoints={false}
            headerActions={
              navigator ? (
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
              ) : null
            }
          />
          <ProblemDetails
            detail={detailWithHistory}
            tab={tab}
            onTabChange={setTab}
            hideEditorial
            hideStats
            compactSubmissions
            outputSection={outputSection}
          />
        </Box>

        <Box className={styles.rightColumn}>
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
            onSubmitCode={() => void submitContestCode()}
            footerContent={
              submissionsLockedReason ? (
                <Box px="20px" pb="4px">
                  <Typography variant="body2" color="text.secondary">
                    {submissionsLockedReason}
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
      </Box>

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
