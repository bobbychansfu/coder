"use client";

import { useState, useEffect, useRef } from "react";
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

const DEFAULT_LANGUAGE = "cpp";

interface RunResult {
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
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [code, setCode] = useState("");
  const [hasRun, setHasRun] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const sessionOpened = useRef(false);
  const utils = trpc.useUtils();

  const { data: detail, isLoading: detailLoading, error: detailError } =
    trpc.practice.getProblemDetail.useQuery({ problemCode }, { retry: false });

  const { data: runHistory, refetch: refetchHistory } = trpc.practice.getRunHistory.useQuery(
    { problemCode },
    { enabled: !!detail },
  );

  const openSession = trpc.practice.openSession.useMutation();
  const runCodeMutation = trpc.practice.runCode.useMutation();
  const submitCodeMutation = trpc.practice.submitCode.useMutation();

  useEffect(() => {
    if (!sessionOpened.current) {
      sessionOpened.current = true;
      openSession.mutate({ problemCode });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemCode]);

  const isRunning = runCodeMutation.isPending;
  const isSubmitting = submitCodeMutation.isPending;

  const handleRunCode = () => {
    setHasRun(true);
    setTab("submissions");
    runCodeMutation.mutate(
      { problemCode, language, code },
      {
        onSuccess: async (result) => {
          setRunResult({
            verdict: result.verdict,
            stdout: result.stdout,
            stderr: result.stderr,
            runtimeMs: result.runtimeMs,
          });
          await refetchHistory();
        },
      },
    );
  };

  const handleSubmitCode = () => {
    setTab("submissions");
    submitCodeMutation.mutate(
      { problemCode },
      {
        onSuccess: async () => {
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
        {isRunning ? (
          <Box display="flex" alignItems="center" gap="10px">
            <CircularProgress size={14} sx={{ color: "#f3f4f6" }} />
            <span className={styles.outputText}>Judging your code...</span>
          </Box>
        ) : (
          <span className={styles.outputText}>
            {runResult?.stdout ?? runResult?.verdict ?? "Code executed (no output)"}
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
            onLanguageChange={setLanguage}
            onCodeChange={setCode}
            onRunCode={handleRunCode}
            onSubmitCode={handleSubmitCode}
            runButtonDisabled={isRunning || isSubmitting}
            runButtonLabel={isRunning ? "Running..." : "Run Code"}
            submitButtonDisabled={!hasRun || isRunning || isSubmitting}
            submitButtonLabel={isSubmitting ? "Submitting..." : "Submit"}
          />
        </Box>
      </Box>
    </Box>
  );
}
