"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, ButtonBase, CircularProgress, Typography } from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import PageHeader from "@/fe/shared/components/PageHeader";
import ProblemHeader from "@/fe/shared/components/problem/ProblemHeader";
import ProblemDetails from "@/fe/shared/components/problem/ProblemDetails";
import SolutionEditor from "@/fe/shared/components/problem/SolutionEditor";
import {
  DEFAULT_CODE_LANGUAGE,
  removePersistedCodeDraft,
  usePersistedCodeDraft,
  writePersistedCodeDraft,
  type SupportedCodeLanguage,
} from "@/fe/shared/services/codeDraftStorage";
import { trpc } from "@/lib/trpc/client";
import type { PracticeSubmissionPayload } from "@/lib/practiceSubmission";
import type { ProblemDetail } from "@/fe/contests/data/problemDetails";
import styles from "@/fe/contests/styles/ProblemSubmissionPage.module.css";

interface ProblemNavigator {
  position: number;
  total: number;
  previousHref?: string;
  nextHref?: string;
}

interface ProblemSubmissionPageProps {
  contestId: string;
  detail: ProblemDetail;
  navigator?: ProblemNavigator;
}

type SupportedLanguage = SupportedCodeLanguage;

const DEFAULT_LANGUAGE: SupportedLanguage = DEFAULT_CODE_LANGUAGE;
const CONTEST_DRAFT_STORAGE_KEY_PREFIX = "contest-submission-draft:";

interface RunResult {
  submissionId: string;
  status: "idle" | PracticeSubmissionPayload["status"];
  verdict: string | null;
  feedback: string | null;
  errorMessage: string | null;
  testcases: PracticeSubmissionPayload["testcases"];
}

function formatVerdictLabel(verdict: string | null | undefined) {
  const normalized = verdict?.trim().toLowerCase();

  switch (normalized) {
    case "accepted":
      return "Accepted";
    case "wrong_answer":
    case "wrong answer":
      return "Wrong Answer";
    case "partial":
      return "Partial";
    case "runtime_error":
    case "runtime error":
      return "Runtime Error";
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
  testcases: PracticeSubmissionPayload["testcases"];
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

export default function ProblemSubmissionPage({
  contestId,
  detail,
  navigator,
}: ProblemSubmissionPageProps) {
  return (
    <ProblemSubmissionPageContent
      key={`${contestId}:${detail.code}`}
      contestId={contestId}
      detail={detail}
      navigator={navigator}
    />
  );
}

function getContestDraftStorageKey(contestId: string, problemCode: string) {
  return `${CONTEST_DRAFT_STORAGE_KEY_PREFIX}${contestId}:${problemCode.toLowerCase()}`;
}

function ProblemSubmissionPageContent({
  contestId,
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
  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "queued" | "running" | "done" | "failed"
  >("idle");
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const submissionEventSourceRef = useRef<EventSource | null>(null);
  const { data: runHistory, refetch: refetchHistory } = trpc.practice.getRunHistory.useQuery(
    { problemCode: detail.practiceProblemCode ?? "" },
    { enabled: !!detail.practiceProblemCode },
  );
  const { data: judgeProblemDetail } = trpc.practice.getProblemDetail.useQuery(
    { problemCode: detail.practiceProblemCode ?? "" },
    { enabled: !!detail.practiceProblemCode, retry: false },
  );
  const effectiveLanguage =
    hasLocalDraftState ? language : (persistedDraft?.language ?? DEFAULT_LANGUAGE);
  const effectiveDrafts =
    hasLocalDraftState ? drafts : (persistedDraft?.drafts ?? drafts);
  const typedCode = effectiveDrafts[effectiveLanguage] ?? "";
  const code = effectiveDrafts[effectiveLanguage] ?? detail.starterCodes?.[effectiveLanguage] ?? "";
  const hasTypedCode = typedCode.trim().length > 0;
  const isJudging =
    submitState === "submitting" || submitState === "queued" || submitState === "running";
  const displayedRunResult = runResult;
  const detailWithHistory = {
    ...detail,
    submissions: runHistory && runHistory.length > 0 ? runHistory : detail.submissions,
  };

  const closeSubmissionStream = useCallback(() => {
    submissionEventSourceRef.current?.close();
    submissionEventSourceRef.current = null;
  }, []);

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

  useEffect(() => () => closeSubmissionStream(), [closeSubmissionStream]);

  const applySubmissionUpdate = useCallback(
    async (payload: PracticeSubmissionPayload) => {
      setSubmitState(payload.status);
      setRunResult(
        buildRunResult({
          submissionId: payload.submissionId,
          status: payload.status,
          verdict: payload.verdict,
          feedback: payload.feedback,
          errorMessage: payload.errorMessage,
          testcases: payload.testcases,
        }),
      );

      if (payload.status === "done" || payload.status === "failed") {
        closeSubmissionStream();
        await refetchHistory();
      }
    },
    [closeSubmissionStream, refetchHistory],
  );

  const openSubmissionStream = useCallback(
    (submissionId: string) => {
      closeSubmissionStream();

      const eventSource = new EventSource(
        `/api/practice/submissions/${submissionId}/stream`,
      );
      submissionEventSourceRef.current = eventSource;

      const handlePayload = (event: MessageEvent<string>) => {
        const payload = JSON.parse(event.data) as PracticeSubmissionPayload;
        void applySubmissionUpdate(payload);
      };

      eventSource.addEventListener("connected", handlePayload as EventListener);
      eventSource.addEventListener("queued", handlePayload as EventListener);
      eventSource.addEventListener("running", handlePayload as EventListener);
      eventSource.addEventListener("done", handlePayload as EventListener);
      eventSource.addEventListener("failed", handlePayload as EventListener);
      eventSource.onerror = async () => {
        closeSubmissionStream();
        setSubmitState("failed");
        setRunResult((current) =>
          current
            ? {
                ...current,
                status: "failed",
                verdict: current.verdict ?? "Failed",
                errorMessage:
                  current.errorMessage ?? "Submission stream disconnected before a final update.",
              }
            : {
                submissionId,
                status: "failed",
                verdict: "Failed",
                feedback: null,
                errorMessage: "Submission stream disconnected before a final update.",
                testcases: [],
              },
        );

        try {
          const response = await fetch(`/api/practice/submissions/${submissionId}`, {
            credentials: "include",
          });
          if (response.ok) {
            const payload = (await response.json()) as PracticeSubmissionPayload;
            await applySubmissionUpdate(payload);
          }
        } catch {
          // Ignore fallback read failures and keep the failed UI state.
        }
      };
    },
    [applySubmissionUpdate, closeSubmissionStream],
  );

  const handleRunCode = async () => {
    if (!hasTypedCode || !judgeProblemDetail?.id) {
      return;
    }

    setHasRun(true);
    setTab("submissions");
    setSubmitState("submitting");
    setRunResult(null);

    try {
      const response = await fetch("/api/practice/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          problemId: judgeProblemDetail.id,
          language: effectiveLanguage === "cplusplus" ? "cpp" : effectiveLanguage,
          code,
        }),
      });

      const payload = (await response.json()) as
        | { submissionId: string; status: "queued" }
        | { error?: string };

      if (!response.ok || !("submissionId" in payload)) {
        const errorMessage = "error" in payload ? payload.error : undefined;
        throw new Error(errorMessage ?? "Failed to create submission.");
      }

      setSubmitState("queued");
      setRunResult(
        buildRunResult({
          submissionId: payload.submissionId,
          status: "queued",
          verdict: null,
          feedback: null,
          errorMessage: null,
          testcases: [],
        }),
      );
      openSubmissionStream(payload.submissionId);
    } catch (error) {
      setSubmitState("failed");
      setRunResult(
        buildRunResult({
          submissionId: "",
          status: "failed",
          verdict: "failed",
          feedback: null,
          errorMessage: error instanceof Error ? error.message : "Failed to run code.",
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
          {isJudging || runResult?.status === "queued" || runResult?.status === "running" ? (
            <Box display="flex" alignItems="center" gap="10px">
              <CircularProgress size={14} sx={{ color: "#f3f4f6" }} />
              <span className={styles.outputText}>
                {submitState === "queued" ? "Queued for Gemini judging..." : "Judging your code..."}
              </span>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap="8px">
              <span className={styles.outputText}>
                {displayedRunResult?.feedback ??
                  displayedRunResult?.errorMessage ??
                  displayedRunResult?.verdict ??
                  "Code executed (no output)"}
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
      <PageHeader onBack={() => router.back()} />

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
            onCodeChange={(nextCode) =>
              {
                setHasLocalDraftState(true);
                setDrafts((currentDrafts) => ({
                  ...(hasLocalDraftState ? currentDrafts : (persistedDraft?.drafts ?? currentDrafts)),
                  [effectiveLanguage]: nextCode,
                }));
              }
            }
            onSubmitCode={() => {
              if (navigator?.nextHref) {
                router.push(navigator.nextHref);
              }
            }}
            onSecondaryAction={() => void handleRunCode()}
            secondaryButtonDisabled={!hasTypedCode || isJudging || !judgeProblemDetail?.id}
            secondaryButtonLabel={
              submitState === "submitting"
                ? "Submitting..."
                : isJudging
                  ? "Judging..."
                  : "Run Code"
            }
            submitButtonDisabled={!navigator?.nextHref}
            submitButtonLabel="Next"
            submitButtonStartIcon={<ChevronRightRoundedIcon fontSize="small" />}
            showAiHint
            aiHintSource={code}
          />
        </Box>
      </Box>
    </Box>
  );
}
