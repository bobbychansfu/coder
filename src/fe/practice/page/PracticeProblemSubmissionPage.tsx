"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import PageHeader from "@/fe/shared/components/PageHeader";
import ProblemHeader from "@/fe/shared/components/problem/ProblemHeader";
import ProblemDetails from "@/fe/shared/components/problem/ProblemDetails";
import SolutionEditor from "@/fe/shared/components/problem/SolutionEditor";
import { trpc } from "@/lib/trpc/client";
import styles from "@/fe/contests/styles/ProblemSubmissionPage.module.css";

interface PracticeProblemSubmissionPageProps {
  problemCode: string;
}

type SupportedLanguage = "cplusplus" | "java" | "typescript" | "javascript" | "python";

const DEFAULT_LANGUAGE: SupportedLanguage = "cplusplus";

interface RunResult {
  id: string;
  verdict: string;
  stdout: string | null;
  stderr: string | null;
  runtimeMs: number | null;
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
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const sessionOpened = useRef(false);
  const pendingSessionRequest = useRef<
    Promise<{ sessionId: string; problemId: string } | null> | null
  >(null);
  const utils = trpc.useUtils();

  const { data: detail, isLoading: detailLoading, error: detailError } =
    trpc.practice.getProblemDetail.useQuery({ problemCode }, { retry: false });

  const { data: runHistory, refetch: refetchHistory } = trpc.practice.getRunHistory.useQuery(
    { problemCode },
    { enabled: !!detail },
  );
  const runRecordQuery = trpc.practice.getRunRecord.useQuery(
    { problemCode, recordId: activeRecordId ?? "" },
    {
      enabled: !!activeRecordId,
      refetchInterval: (query) => (query.state.data?.verdict === "Pending" ? 1000 : false),
    },
  );

  const { mutateAsync: openSessionMutateAsync } = trpc.practiceExecution.openSession.useMutation();
  const submitCodeMutation = trpc.practiceExecution.submitCode.useMutation();

  useEffect(() => {
    if (!runRecordQuery.data) {
      return;
    }

    if (runRecordQuery.data.verdict !== "Pending") {
      void refetchHistory();
    }
  }, [refetchHistory, runRecordQuery.data]);

  const isSubmitting = submitCodeMutation.isPending;
  const isJudging = isSubmitting;
  const typedCode = drafts[language] ?? "";
  const code = drafts[language] ?? detail?.starterCodes?.[language] ?? "";
  const hasTypedCode = typedCode.trim().length > 0;
  const displayedRunResult = runRecordQuery.data
    ? {
        id: runRecordQuery.data.id,
        verdict: runRecordQuery.data.verdict,
        stdout: runRecordQuery.data.stdout,
        stderr: runRecordQuery.data.stderr,
        runtimeMs: runRecordQuery.data.runtimeMs,
      }
    : runResult;

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

  const handleSubmitCode = async () => {
    if (!hasTypedCode) return;

    const currentSession = await ensureSessionInfo();

    if (!currentSession) return;

    setHasRun(true);
    setTab("submissions");
    submitCodeMutation.mutate(
      {
        sessionId: currentSession.sessionId,
        problemId: currentSession.problemId,
        language,
        code,
        timestamp: new Date().toISOString(),
      },
      {
        onSuccess: async (result) => {
          setActiveRecordId(result.record.id);
          setRunResult({
            id: result.record.id,
            verdict: result.verdict,
            stdout: result.stdout,
            stderr: result.stderr,
            runtimeMs: result.runtimeMs,
          });
          await utils.practice.getRunHistory.invalidate({ problemCode });
        },
      },
    );
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
        {isJudging && displayedRunResult && displayedRunResult.verdict !== "Pending" ? (
          <span className={styles.outputText}>
            {displayedRunResult?.stdout ?? displayedRunResult?.verdict ?? "Code executed (no output)"}
          </span>
        ) : isJudging || displayedRunResult?.verdict === "Pending" ? (
          <Box display="flex" alignItems="center" gap="10px">
            <CircularProgress size={14} sx={{ color: "#f3f4f6" }} />
            <span className={styles.outputText}>Judging your code...</span>
          </Box>
        ) : (
          <span className={styles.outputText}>
            {displayedRunResult?.stdout ??
              displayedRunResult?.verdict ??
              "Code executed (no output)"}
          </span>
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
            submitButtonLabel={isSubmitting ? "Submitting..." : "Submit"}
          />
        </Box>
      </Box>
    </Box>
  );
}
