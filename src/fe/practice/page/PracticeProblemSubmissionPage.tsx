"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import PageHeader from "@/fe/shared/components/PageHeader";
import ProblemHeader from "@/fe/shared/components/problem/ProblemHeader";
import ProblemDetails from "@/fe/shared/components/problem/ProblemDetails";
import SolutionEditor from "@/fe/shared/components/problem/SolutionEditor";
import {
  DEFAULT_CODE_LANGUAGE,
  readPersistedCodeDraft,
  removePersistedCodeDraft,
  writePersistedCodeDraft,
  type SupportedCodeLanguage,
} from "@/fe/shared/services/codeDraftStorage";
import { trpc } from "@/lib/trpc/client";
import type { PracticeSubmissionPayload, PracticeSubmissionTestcase } from "@/lib/practiceSubmission";
import styles from "@/fe/contests/styles/ProblemSubmissionPage.module.css";

interface PracticeProblemSubmissionPageProps {
  problemCode: string;
}

type SupportedLanguage = SupportedCodeLanguage;

const DEFAULT_LANGUAGE: SupportedLanguage = DEFAULT_CODE_LANGUAGE;
const PRACTICE_DRAFT_STORAGE_KEY_PREFIX = "practice-submission-draft:";

function getPracticeDraftStorageKey(problemCode: string) {
  return `${PRACTICE_DRAFT_STORAGE_KEY_PREFIX}${problemCode}`;
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

interface RunResult {
  submissionId: string;
  status: "idle" | PracticeSubmissionPayload["status"];
  verdict: string | null;
  feedback: string | null;
  errorMessage: string | null;
  testcases: PracticeSubmissionPayload["testcases"];
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

export default function PracticeProblemSubmissionPage({
  problemCode,
}: PracticeProblemSubmissionPageProps) {
  return <PracticeProblemSubmissionPageContent key={problemCode} problemCode={problemCode} />;
}

function PracticeProblemSubmissionPageContent({
  problemCode,
}: PracticeProblemSubmissionPageProps) {
  const router = useRouter();
  const [tab, setTab] = useState("description");
  const [language, setLanguage] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [drafts, setDrafts] = useState<Partial<Record<SupportedLanguage, string>>>({});
  const [sessionInfo, setSessionInfo] = useState<{ sessionId: string; problemId: string } | null>(
    null,
  );
  const [hasRun, setHasRun] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const sessionOpened = useRef(false);
  const pendingSessionRequest = useRef<
    Promise<{ sessionId: string; problemId: string } | null> | null
  >(null);
  const submissionEventSourceRef = useRef<EventSource | null>(null);
  const [isDraftStorageReady, setIsDraftStorageReady] = useState(false);
  const [hasPersistedDraft, setHasPersistedDraft] = useState(false);

  const { data: detail, isLoading: detailLoading, error: detailError } =
    trpc.practice.getProblemDetail.useQuery({ problemCode }, { retry: false });

  const { data: runHistory, refetch: refetchHistory } = trpc.practice.getRunHistory.useQuery(
    { problemCode },
    { enabled: !!detail },
  );
  const { data: latestRunRecord } = trpc.practice.getLatestRunRecord.useQuery(
    { problemCode },
    { enabled: !!detail, retry: false },
  );

  const { mutateAsync: openSessionMutateAsync } = trpc.practiceExecution.openSession.useMutation();
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "queued" | "running" | "done" | "failed">("idle");
  const isSubmitting = submitState === "submitting";
  const isJudging = submitState === "submitting" || submitState === "queued" || submitState === "running";
  const typedCode = drafts[language] ?? "";
  const code = drafts[language] ?? detail?.starterCodes?.[language] ?? "";
  const hasTypedCode = typedCode.trim().length > 0;
  const displayedRunResult = runResult;

  const closeSubmissionStream = useCallback(() => {
    submissionEventSourceRef.current?.close();
    submissionEventSourceRef.current = null;
  }, []);

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

  const ensureSessionInfo = useCallback(async () => {
    if (sessionInfo) {
      return sessionInfo;
    }

    if (pendingSessionRequest.current) {
      return pendingSessionRequest.current;
    }

    const sessionRequest = openSessionMutateAsync({ problemCode })
      .then((session) => {
        const nextSessionInfo = { sessionId: session.sessionId, problemId: session.problemId };
        setSessionInfo(nextSessionInfo);
        sessionOpened.current = true;
        return nextSessionInfo;
      })
      .catch(() => {
        sessionOpened.current = false;
        return null;
      })
      .finally(() => {
        pendingSessionRequest.current = null;
      });

    pendingSessionRequest.current = sessionRequest;

    return sessionRequest;
  }, [openSessionMutateAsync, problemCode, sessionInfo]);

  useEffect(() => {
    if (sessionOpened.current || pendingSessionRequest.current) {
      return;
    }

    sessionOpened.current = true;
    void ensureSessionInfo();
  }, [ensureSessionInfo]);

  useEffect(() => () => closeSubmissionStream(), [closeSubmissionStream]);

  useEffect(() => {
    const persistedDraft = readPersistedCodeDraft(getPracticeDraftStorageKey(problemCode));

    if (persistedDraft) {
      setLanguage(persistedDraft.language);
      setDrafts(persistedDraft.drafts);
    }

    setHasPersistedDraft(Boolean(persistedDraft));
    setIsDraftStorageReady(true);
  }, [problemCode]);

  useEffect(() => {
    if (!isDraftStorageReady) {
      return;
    }

    const hasDraftContent = Object.keys(drafts).length > 0;

    if (!hasDraftContent && language === DEFAULT_LANGUAGE) {
      removePersistedCodeDraft(getPracticeDraftStorageKey(problemCode));
      return;
    }

    writePersistedCodeDraft(getPracticeDraftStorageKey(problemCode), {
      language,
      drafts,
    });
  }, [drafts, isDraftStorageReady, language, problemCode]);

  useEffect(() => {
    if (
      !isDraftStorageReady ||
      hasPersistedDraft ||
      !latestRunRecord ||
      hasRun ||
      runResult ||
      Object.keys(drafts).length > 0
    ) {
      return;
    }

    setLanguage(latestRunRecord.language as SupportedLanguage);
    setDrafts({ [latestRunRecord.language]: latestRunRecord.code });
    setHasRun(true);
    setTab("submissions");
    setSubmitState(latestRunRecord.status);
    setRunResult(
      buildRunResult({
        submissionId: latestRunRecord.id,
        status: latestRunRecord.status,
        verdict: latestRunRecord.verdict,
        feedback: latestRunRecord.feedback,
        errorMessage: latestRunRecord.errorMessage,
        testcases: Array.isArray(latestRunRecord.testcases) ? (latestRunRecord.testcases as unknown as PracticeSubmissionTestcase[]) : [],
      }),
    );

    if (latestRunRecord.status === "queued" || latestRunRecord.status === "running") {
      openSubmissionStream(latestRunRecord.id);
    }
  }, [
    drafts,
    hasPersistedDraft,
    hasRun,
    isDraftStorageReady,
    latestRunRecord,
    openSubmissionStream,
    runResult,
  ]);

  const handleSubmitCode = async () => {
    if (!hasTypedCode) return;

    const currentSession = await ensureSessionInfo();

    if (!currentSession) return;

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
          problemId: currentSession.problemId,
          language: language === "cplusplus" ? "cpp" : language,
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
          errorMessage: error instanceof Error ? error.message : "Failed to submit code.",
          testcases: [],
        }),
      );
    }
  };

  if (detailLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (detailError || !detail) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="text.secondary">Problem not found.</Typography>
      </Box>
    );
  }

  const detailWithHistory = { ...detail, submissions: runHistory ?? [] };

  const outputSection = hasRun ? (
    <div className={styles.outputSection}>
      <Typography className={styles.outputTitle}>Output</Typography>
      <div className={styles.outputBlock}>
        {isJudging || displayedRunResult?.status === "queued" || displayedRunResult?.status === "running" ? (
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
            language={language}
            code={code}
            onLanguageChange={(nextLanguage) => setLanguage(nextLanguage as SupportedLanguage)}
            onCodeChange={(nextCode) =>
              setDrafts((currentDrafts) => ({
                ...currentDrafts,
                [language]: nextCode,
              }))
            }
            onSubmitCode={handleSubmitCode}
            submitButtonDisabled={!hasTypedCode || isJudging}
            submitButtonLabel={isSubmitting ? "Submitting..." : isJudging ? "Judging..." : "Submit"}
          />
        </Box>
      </Box>
    </Box>
  );
}
