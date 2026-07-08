"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, ButtonBase, CircularProgress, Typography } from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import PageHeader from "@/fe/shared/components/PageHeader";
import ProblemHeader from "@/fe/shared/components/problem/ProblemHeader";
import ProblemDetails from "@/fe/shared/components/problem/ProblemDetails";
import SolutionEditor from "@/fe/shared/components/problem/SolutionEditor";
import CountdownTimer from "@/fe/contests/components/CountdownTimer";
import type { ContestDetailStatus } from "@/fe/contests/data/contestDetails";
import {
  DEFAULT_CODE_LANGUAGE,
  readPersistedCodeDraft,
  removePersistedCodeDraft,
  usePersistedCodeDraft,
  writePersistedCodeDraft,
  type SupportedCodeLanguage,
} from "@/fe/shared/services/codeDraftStorage";
import type { ProblemDetail, SubmissionRecord } from "@/fe/contests/data/problemDetails";
import {
  adaptContestSubmissionRecords,
  type ContestProblemSubmissionsResponse,
} from "@/fe/contests/services/contestProblem";
import styles from "@/fe/contests/styles/ProblemSubmissionPage.module.css";

interface ProblemNavigator {
  position: number;
  total: number;
  previousHref?: string;
  nextHref?: string;
}

interface ContestPracticeProblemLink {
  contestCode: string;
  practiceProblemCode: string;
}

interface ProblemSubmissionPageProps {
  contestId: string;
  contestStatus?: ContestDetailStatus;
  contestStartsAt?: string | null;
  contestEndsAt?: string | null;
  contestDurationMinutes?: number | null;
  practiceProblemLinks?: ContestPracticeProblemLink[];
  detail: ProblemDetail;
  navigator?: ProblemNavigator;
}

function ContestTimer({
  startsAt,
  endsAt,
  durationMinutes,
}: {
  startsAt?: string | null;
  endsAt?: string | null;
  durationMinutes?: number | null;
}) {
  return (
    <Typography
      component="span"
      fontSize={14}
      fontWeight={600}
      sx={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}
    >
      Time left:{" "}
      <CountdownTimer
        startsAt={startsAt}
        endsAt={endsAt}
        durationMinutes={durationMinutes}
      />
    </Typography>
  );
}

type TimeLeftAlertThreshold = 15 | 5;

const TIME_LEFT_ALERT_THRESHOLDS: TimeLeftAlertThreshold[] = [5, 15];
const TIME_LEFT_ALERT_AUTO_CLOSE_MS = 30_000;

function parseContestTimestamp(value?: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function resolveContestEndTimestamp({
  startsAt,
  endsAt,
  durationMinutes,
}: {
  startsAt?: string | null;
  endsAt?: string | null;
  durationMinutes?: number | null;
}) {
  const explicitEndTime = parseContestTimestamp(endsAt);

  if (explicitEndTime !== null) {
    return explicitEndTime;
  }

  const startTime = parseContestTimestamp(startsAt);

  if (startTime !== null && typeof durationMinutes === "number" && durationMinutes > 0) {
    return startTime + durationMinutes * 60_000;
  }

  return null;
}

function getContestRemainingMsForAlert({
  startsAt,
  endsAt,
  durationMinutes,
}: {
  startsAt?: string | null;
  endsAt?: string | null;
  durationMinutes?: number | null;
}) {
  const now = Date.now();
  const startTime = parseContestTimestamp(startsAt);
  const endTime = resolveContestEndTimestamp({ startsAt, endsAt, durationMinutes });

  if (endTime === null || (startTime !== null && now < startTime)) {
    return null;
  }

  return Math.max(0, endTime - now);
}

function ContestTimeLeftPopup({
  threshold,
  onClose,
}: {
  threshold: TimeLeftAlertThreshold;
  onClose: () => void;
}) {
  return (
    <div
      className={styles.timeLeftPopupDialog}
      role="alert"
      aria-live="assertive"
      style={{
        position: "fixed",
        top: "90px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1300,
        minWidth: "280px",
        maxWidth: "min(420px, calc(100vw - 48px))",
        padding: "8px 34px 8px 24px",
        border: "2px solid #ef4444",
        borderRadius: "8px",
        backgroundColor: "#ffffff",
        color: "#7f1d1d",
        boxShadow: "0 10px 28px rgba(127, 29, 29, 0.18)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <button
        type="button"
        className={styles.timeLeftPopupClose}
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          width: "22px",
          height: "22px",
          border: 0,
          borderRadius: "6px",
          backgroundColor: "transparent",
          color: "#991b1b",
          cursor: "pointer",
          fontFamily: "Inter, sans-serif",
          fontSize: "11px",
          fontWeight: 800,
          lineHeight: 1,
        }}
        onClick={onClose}
        aria-label="Close time left alert"
      >
        X
      </button>
      <div
        className={styles.timeLeftPopupMessage}
        style={{ display: "flex", flexDirection: "column", gap: "1px", textAlign: "center" }}
      >
        <div
          id="time-left-alert-title"
          className={styles.timeLeftPopupTitle}
          style={{ fontSize: "17px", fontWeight: 800, lineHeight: "22px" }}
        >
          {threshold} minutes left
        </div>
        <div
          className={styles.timeLeftPopupSubtitle}
          style={{ fontSize: "12px", fontWeight: 600, lineHeight: "17px" }}
        >
          will turn to practice mode after contest
        </div>
      </div>
    </div>
  );
}

type SupportedLanguage = SupportedCodeLanguage;

const DEFAULT_LANGUAGE: SupportedLanguage = DEFAULT_CODE_LANGUAGE;
const CONTEST_DRAFT_STORAGE_KEY_PREFIX = "contest-submission-draft:";
const PRACTICE_DRAFT_STORAGE_KEY_PREFIX = "practice-submission-draft:";
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

export default function ProblemSubmissionPage({
  contestId,
  contestStatus,
  contestStartsAt,
  contestEndsAt,
  contestDurationMinutes,
  practiceProblemLinks,
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
      detail={detail}
      navigator={navigator}
    />
  );
}

function getContestDraftStorageKey(contestId: string, problemCode: string) {
  return `${CONTEST_DRAFT_STORAGE_KEY_PREFIX}${contestId}:${problemCode.toLowerCase()}`;
}

function getPracticeDraftStorageKey(problemCode: string) {
  return `${PRACTICE_DRAFT_STORAGE_KEY_PREFIX}${problemCode}`;
}

function hasDraftContent(drafts: Partial<Record<SupportedLanguage, string>>) {
  return Object.values(drafts).some(
    (draft) => typeof draft === "string" && draft.trim().length > 0,
  );
}

function ProblemSubmissionPageContent({
  contestId,
  contestStatus,
  contestStartsAt,
  contestEndsAt,
  contestDurationMinutes,
  practiceProblemLinks = [],
  detail,
  navigator,
}: ProblemSubmissionPageProps) {
  const router = useRouter();
  const storageKey = getContestDraftStorageKey(contestId, detail.code);
  const hasRedirectedToPracticeRef = useRef(false);
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
  const [activeTimeLeftAlert, setActiveTimeLeftAlert] =
    useState<TimeLeftAlertThreshold | null>(null);
  const [shownTimeLeftAlerts, setShownTimeLeftAlerts] = useState<
    Partial<Record<TimeLeftAlertThreshold, boolean>>
  >({});
  const effectiveLanguage =
    hasLocalDraftState ? language : (persistedDraft?.language ?? DEFAULT_LANGUAGE);
  const effectiveDrafts =
    hasLocalDraftState ? drafts : (persistedDraft?.drafts ?? drafts);
  const code = effectiveDrafts[effectiveLanguage] ?? detail.starterCodes?.[effectiveLanguage] ?? "";
  const hasCode = code.trim().length > 0;
  const isJudging = submitState === "submitting";
  const submissionsLockedReason =
    contestStatus === "upcoming"
      ? "Submissions open when this contest starts."
      : contestStatus === "closed"
        ? "This contest has ended. You can review problems and submissions, but new submissions are disabled."
        : null;
  const submissionsLocked = submissionsLockedReason !== null;
  const displayedRunResult = runResult;
  const detailWithHistory = {
    ...detail,
    submissions,
  };

  useEffect(() => {
    if (persistedDraft === undefined) {
      return;
    }

    const hasDraftContent = Object.keys(effectiveDrafts).length > 0;

    if (!hasDraftContent && effectiveLanguage === DEFAULT_LANGUAGE) {
      removePersistedCodeDraft(storageKey);
      return;
    }

    writePersistedCodeDraft(storageKey, {
      language: effectiveLanguage,
      drafts: effectiveDrafts,
    });
  }, [effectiveDrafts, effectiveLanguage, persistedDraft, storageKey]);

  useEffect(() => {
    if (contestStatus === "closed") {
      return;
    }

    const updateTimeLeftAlert = () => {
      const remainingMs = getContestRemainingMsForAlert({
        startsAt: contestStartsAt,
        endsAt: contestEndsAt,
        durationMinutes: contestDurationMinutes,
      });

      if (remainingMs === null) {
        return;
      }

      const remainingMinutes = remainingMs / 60_000;
      const nextThreshold = TIME_LEFT_ALERT_THRESHOLDS.find(
        (threshold) => remainingMinutes <= threshold && !shownTimeLeftAlerts[threshold],
      );

      if (!nextThreshold) {
        return;
      }

      setActiveTimeLeftAlert(nextThreshold);
      setShownTimeLeftAlerts((current) => ({
        ...current,
        [nextThreshold]: true,
      }));
    };

    updateTimeLeftAlert();
    const intervalId = window.setInterval(updateTimeLeftAlert, 1000);

    return () => window.clearInterval(intervalId);
  }, [
    contestDurationMinutes,
    contestEndsAt,
    contestId,
    contestStartsAt,
    contestStatus,
    shownTimeLeftAlerts,
  ]);

  useEffect(() => {
    if (persistedDraft === undefined) {
      return;
    }

    if (hasRedirectedToPracticeRef.current) {
      return;
    }

    const practiceProblemCode = detail.practiceProblemCode ?? detail.code;
    const allPracticeProblemLinks =
      practiceProblemLinks.length > 0
        ? practiceProblemLinks
        : [{ contestCode: detail.code, practiceProblemCode }];

    const copyDraftAndRedirectToPractice = () => {
      if (hasRedirectedToPracticeRef.current) {
        return;
      }

      hasRedirectedToPracticeRef.current = true;

      allPracticeProblemLinks.forEach((link) => {
        const isCurrentProblem =
          link.contestCode.toLowerCase() === detail.code.toLowerCase();
        const contestDraft = isCurrentProblem
          ? { language: effectiveLanguage, drafts: effectiveDrafts }
          : readPersistedCodeDraft(getContestDraftStorageKey(contestId, link.contestCode));

        if (!contestDraft || !hasDraftContent(contestDraft.drafts)) {
          return;
        }

        writePersistedCodeDraft(getPracticeDraftStorageKey(link.practiceProblemCode), contestDraft);
      });

      router.replace(`/practice/${encodeURIComponent(practiceProblemCode)}`);
    };

    if (contestStatus === "closed") {
      copyDraftAndRedirectToPractice();
      return;
    }

    const endTime = resolveContestEndTimestamp({
      startsAt: contestStartsAt,
      endsAt: contestEndsAt,
      durationMinutes: contestDurationMinutes,
    });

    if (endTime === null) {
      return;
    }

    const checkContestEnd = () => {
      if (Date.now() >= endTime) {
        copyDraftAndRedirectToPractice();
      }
    };

    checkContestEnd();
    const intervalId = window.setInterval(checkContestEnd, 1000);

    return () => window.clearInterval(intervalId);
  }, [
    contestDurationMinutes,
    contestEndsAt,
    contestId,
    contestStartsAt,
    contestStatus,
    detail.code,
    detail.practiceProblemCode,
    effectiveDrafts,
    effectiveLanguage,
    persistedDraft,
    practiceProblemLinks,
    router,
  ]);

  useEffect(() => {
    if (activeTimeLeftAlert === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActiveTimeLeftAlert(null);
    }, TIME_LEFT_ALERT_AUTO_CLOSE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [activeTimeLeftAlert]);

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
            onClose={() => setActiveTimeLeftAlert(null)}
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
            showAiHint
            aiHintSource={code}
          />
        </Box>
      </Box>
    </Box>
  );
}
