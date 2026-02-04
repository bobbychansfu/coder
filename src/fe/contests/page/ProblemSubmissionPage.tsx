"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@mui/material";
import PageHeader from "@/fe/shared/components/PageHeader";
import ProblemHeader from "@/fe/shared/components/problem/ProblemHeader";
import ProblemDetails from "@/fe/shared/components/problem/ProblemDetails";
import SolutionEditor from "@/fe/shared/components/problem/SolutionEditor";
import TestCasesSection from "@/fe/shared/components/problem/TestCasesSection";
import type { ProblemDetail } from "@/fe/contests/data/problemDetails";
import styles from "@/fe/contests/styles/ProblemSubmissionPage.module.css";

interface ProblemSubmissionPageProps {
  detail: ProblemDetail;
}

export default function ProblemSubmissionPage({ detail }: ProblemSubmissionPageProps) {
  const router = useRouter();
  const [tab, setTab] = useState("description");
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("");

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
          />
          <ProblemDetails detail={detail} tab={tab} onTabChange={setTab} />
        </Box>

        <Box className={styles.rightColumn}>
          <SolutionEditor
            language={language}
            code={code}
            onLanguageChange={setLanguage}
            onCodeChange={setCode}
          />
          <TestCasesSection testCases={detail.testCases} hiddenCount={detail.hiddenCount} />
        </Box>
      </Box>
    </Box>
  );
}
