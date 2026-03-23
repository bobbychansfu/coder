"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, ButtonBase, Typography } from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import PageHeader from "@/fe/shared/components/PageHeader";
import ProblemHeader from "@/fe/shared/components/problem/ProblemHeader";
import ProblemDetails from "@/fe/shared/components/problem/ProblemDetails";
import SolutionEditor from "@/fe/shared/components/problem/SolutionEditor";
import type { ProblemDetail } from "@/fe/contests/data/problemDetails";
import styles from "@/fe/contests/styles/ProblemSubmissionPage.module.css";

interface ProblemNavigator {
  position: number;
  total: number;
  previousHref?: string;
  nextHref?: string;
}

interface ProblemSubmissionPageProps {
  detail: ProblemDetail;
  navigator?: ProblemNavigator;
}

const DEFAULT_LANGUAGE = "cplusplus";

export default function ProblemSubmissionPage({
  detail,
  navigator,
}: ProblemSubmissionPageProps) {
  return <ProblemSubmissionPageContent key={detail.code} detail={detail} navigator={navigator} />;
}

function ProblemSubmissionPageContent({ detail, navigator }: ProblemSubmissionPageProps) {
  const router = useRouter();
  const [tab, setTab] = useState("description");
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [code, setCode] = useState("");
  const [hasRun, setHasRun] = useState(false);
  const hasTypedCode = code.trim().length > 0;

  const outputSection =
    tab === "submissions" && hasRun ? (
      <div className={styles.outputSection}>
        <Typography className={styles.outputTitle}>Output</Typography>
        <div className={styles.outputBlock}>
          <span className={styles.outputText}>Code executed successfully (no output)</span>
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
            onSubmitCode={() => {
              if (!hasTypedCode) {
                return;
              }

              if (navigator?.nextHref) {
                router.push(navigator.nextHref);
                return;
              }

              setHasRun(true);
              setTab("submissions");
            }}
            submitButtonDisabled={!hasTypedCode}
            submitButtonLabel={navigator?.nextHref ? "Submit & Next" : "Submit"}
            showAiHint
            aiHintSource={code}
          />
        </Box>
      </Box>
    </Box>
  );
}
