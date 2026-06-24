"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
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
import {
  normalizePracticeSubmissionTestcases,
  type PracticeSubmissionPayload,
} from "@/lib/practiceSubmission";
import styles from "@/fe/contests/styles/ProblemSubmissionPage.module.css";

interface PracticeProblemSubmissionPageProps {
  problemCode: string;
  persistSubmissions?: boolean;
}

type SupportedLanguage = SupportedCodeLanguage;

const DEFAULT_LANGUAGE: SupportedLanguage = DEFAULT_CODE_LANGUAGE;
const PRACTICE_DRAFT_STORAGE_KEY_PREFIX = "practice-submission-draft:";
const PRACTICE_TIMER_INITIAL_MS = 15 * 60 * 1000;
const PRACTICE_TIMER_INCREMENT_MS = 15 * 60 * 1000;

function getPracticeDraftStorageKey(problemCode: string) {
  return `${PRACTICE_DRAFT_STORAGE_KEY_PREFIX}${problemCode}`;
}

function formatPracticeTimeRemaining(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function PracticeTimer({ problemCode }: { problemCode: string }) {
  const storageKey = `practice-timer:${problemCode}`;
  const isPageUnloadingRef = useRef(false);
  const endTimeRef = useRef<number | null>(null);
  const nowRef = useRef(0);

  const [timerState, setTimerState] = useState(() => {
    if (typeof window === "undefined") {
      return {
        isStarted: false,
        endTime: null as number | null,
        remainingMs: PRACTICE_TIMER_INITIAL_MS,
      };
    }

    const saved = window.localStorage.getItem(storageKey);
    const parsed = saved
      ? (JSON.parse(saved) as {
          isStarted?: boolean;
          endTime?: number | null;
          remainingMs?: number;
        })
      : null;

    if (parsed) {
      if (parsed.isStarted && typeof parsed.endTime === "number") {
        return {
          isStarted: true,
          endTime: parsed.endTime,
          remainingMs: Math.max(0, parsed.endTime - Date.now()),
        };
      }

      if (typeof parsed.remainingMs === "number") {
        return {
          isStarted: false,
          endTime: null,
          remainingMs: parsed.remainingMs,
        };
      }
    }

    return {
      isStarted: false,
      endTime: null,
      remainingMs: PRACTICE_TIMER_INITIAL_MS,
    };
  });

  const [now, setNow] = useState(() => Date.now());

  const remainingMs = timerState.isStarted && timerState.endTime !== null
    ? Math.max(0, timerState.endTime - now)
    : timerState.remainingMs;

  const canExtend = timerState.isStarted && remainingMs <= 5 * 60 * 1000;

  useEffect(() => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        isStarted: timerState.isStarted,
        endTime: timerState.endTime,
        remainingMs,
      }),
    );
  }, [storageKey, timerState.isStarted, timerState.endTime, remainingMs]);

  useEffect(() => {
    endTimeRef.current = timerState.endTime;
    nowRef.current = now;
  }, [timerState.endTime, now]);

  useEffect(() => {
    const markPageUnloading = () => {
      isPageUnloadingRef.current = true;
    };

    window.addEventListener("beforeunload", markPageUnloading);
    window.addEventListener("pagehide", markPageUnloading);

    return () => {
      window.removeEventListener("beforeunload", markPageUnloading);
      window.removeEventListener("pagehide", markPageUnloading);

      if (!isPageUnloadingRef.current) {
        const frozenRemainingMs =
          endTimeRef.current === null
            ? remainingMs
            : Math.max(0, endTimeRef.current - nowRef.current);

        window.localStorage.setItem(
          storageKey,
          JSON.stringify({
            isStarted: false,
            endTime: null,
            remainingMs: frozenRemainingMs,
          }),
        );
      }
    };
  }, [remainingMs, storageKey]);

  useEffect(() => {
    if (!timerState.isStarted) {
      return;
    }

    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [timerState.isStarted]);

  const startTimer = () => {
    const currentTime = Date.now();
    setNow(currentTime);
    setTimerState((currentState) => ({
      isStarted: true,
      endTime: currentTime + currentState.remainingMs,
      remainingMs: currentState.remainingMs,
    }));
  };

  const addFifteenMinutes = () => {
    const currentTime = Date.now();
    setNow(currentTime);
    setTimerState((currentState) => {
      const currentEndTime = currentState.endTime ?? currentTime;

      return {
        isStarted: true,
        endTime: Math.max(currentEndTime, currentTime) + PRACTICE_TIMER_INCREMENT_MS,
        remainingMs: remainingMs + PRACTICE_TIMER_INCREMENT_MS,
      };
    });
  };

  return (
    <Box display="flex" alignItems="center" gap="8px">
      <Typography fontSize={14} fontWeight={600}>
        Time left: {formatPracticeTimeRemaining(remainingMs)}
      </Typography>

      {!timerState.isStarted ? (
        <Button size="small" onClick={startTimer}>
          Start
        </Button>
      ) : null}

      {canExtend ? (
        <Button size="small" onClick={addFifteenMinutes}>
          +15 min
        </Button>
      ) : null}
    </Box>
  );
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
  persistSubmissions = true,
}: PracticeProblemSubmissionPageProps) {
  return (
    <PracticeProblemSubmissionPageContent
      key={problemCode}
      problemCode={problemCode}
      persistSubmissions={persistSubmissions}
    />
  );
}

function PracticeProblemSubmissionPageContent({
  problemCode,
  persistSubmissions = true,
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
    { enabled: !!detail && persistSubmissions },
  );
  const { data: latestRunRecord } = trpc.practice.getLatestRunRecord.useQuery(
    { problemCode },
    { enabled: !!detail && persistSubmissions, retry: false },
  );

  const { mutateAsync: openSessionMutateAsync } = trpc.practiceExecution.openSession.useMutation();
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "queued" | "running" | "done" | "failed">("idle");
  const isSubmitting = submitState === "submitting";
  const isJudging = submitState === "submitting" || submitState === "queued" || submitState === "running";
  const code = drafts[language] ?? detail?.starterCodes?.[language] ?? "";
  const hasCode = code.trim().length > 0;
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
    if (!persistSubmissions) {
      return;
    }

    if (sessionOpened.current || pendingSessionRequest.current) {
      return;
    }

    sessionOpened.current = true;
    void ensureSessionInfo();
  }, [ensureSessionInfo, persistSubmissions]);

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
      !persistSubmissions ||
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
        testcases: normalizePracticeSubmissionTestcases(latestRunRecord.testcases),
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
    persistSubmissions,
    runResult,
  ]);

  const handleSubmitCode = async () => {
    if (!hasCode || !detail) return;

    const problemId = persistSubmissions
      ? ((await ensureSessionInfo())?.problemId ?? detail.id)
      : detail.id;

    if (!problemId) return;

    setHasRun(true);
    if (persistSubmissions) {
      setTab("submissions");
    }
    setSubmitState("submitting");
    setRunResult(null);

    try {
      const response = await fetch("/api/practice/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          problemId,
          language: language === "cplusplus" ? "cpp" : language,
          code,
        }),
      });

      const payload = (await response.json()) as
        | ({ submissionId: string; status: "queued"; persisted?: true })
        | (PracticeSubmissionPayload & { persisted: false })
        | { error?: string };

      if (!response.ok || !("submissionId" in payload)) {
        const errorMessage = "error" in payload ? payload.error : undefined;
        throw new Error(errorMessage ?? "Failed to create submission.");
      }

      if ("persisted" in payload && payload.persisted === false) {
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
        return;
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
  const persistenceNote = !persistSubmissions ? (
    <Box px="20px" pb="4px">
      <Typography variant="body2" color="text.secondary">
        Instructor AI reviews are temporary and are not saved to submission history.
      </Typography>
    </Box>
  ) : undefined;

  const outputSection = hasRun ? (
    <div className={styles.outputSection}>
      <Typography className={styles.outputTitle}>AI Feedback</Typography>
      <div className={styles.outputBlock}>
        {isJudging || displayedRunResult?.status === "queued" || displayedRunResult?.status === "running" ? (
          <Box display="flex" alignItems="center" gap="10px">
            <CircularProgress size={14} sx={{ color: "#f3f4f6" }} />
            <span className={styles.outputText}>
              {submitState === "queued"
                ? "Queued for AI review..."
                : "Reviewing your code with AI..."}
            </span>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap="8px">
            <span className={styles.outputText}>
              {displayedRunResult?.feedback ??
                displayedRunResult?.errorMessage ??
                displayedRunResult?.verdict ??
                "No AI feedback returned."}
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
      <Box display="flex" alignItems="center" gap="12px">
        <PageHeader onBack={() => router.back()} />
        {persistSubmissions ? <PracticeTimer problemCode={problemCode} /> : null}
      </Box>

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
            footerContent={persistenceNote}
            submitButtonDisabled={!hasCode || isJudging}
            submitButtonLabel={isSubmitting ? "Submitting..." : isJudging ? "Judging..." : "Submit"}
          />
        </Box>
      </Box>
    </Box>
  );
}
