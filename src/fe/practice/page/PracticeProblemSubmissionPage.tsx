"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import PageHeader from "@/fe/shared/components/PageHeader";
import ProblemHeader from "@/fe/shared/components/problem/ProblemHeader";
import ProblemDetails from "@/fe/shared/components/problem/ProblemDetails";
import SolutionEditor from "@/fe/shared/components/problem/SolutionEditor";
import type { ProblemDetail } from "@/fe/contests/data/problemDetails";
import { runPracticeCode, type PracticeJudgeResult } from "@/fe/practice/services/problemService";
import styles from "@/fe/contests/styles/ProblemSubmissionPage.module.css";

interface PracticeProblemSubmissionPageProps {
  detail: ProblemDetail;
}

const DEFAULT_LANGUAGE = "cpp";

export default function PracticeProblemSubmissionPage({
  detail,
}: PracticeProblemSubmissionPageProps) {
  return <PracticeProblemSubmissionPageContent key={detail.code} detail={detail} />;
}

function PracticeProblemSubmissionPageContent({
  detail,
}: PracticeProblemSubmissionPageProps) {
  const router = useRouter();
  const [tab, setTab] = useState("description");
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [code, setCode] = useState("");
  const [hasRun, setHasRun] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<PracticeJudgeResult | null>(null);

  const handleRunCode = async () => {
    setHasRun(true);
    setIsRunning(true);
    setTab("submissions");

    try {
      const result = await runPracticeCode(detail, code, language);
      setRunResult(result);
    } finally {
      setIsRunning(false);
    }
  };

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
            {runResult?.cases[0]?.output ?? "Code executed successfully (no output)"}
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
            detail={detail}
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
            runButtonDisabled={isRunning}
            runButtonLabel={isRunning ? "Running..." : "Run Code"}
          />
        </Box>
      </Box>
    </Box>
  );
}
