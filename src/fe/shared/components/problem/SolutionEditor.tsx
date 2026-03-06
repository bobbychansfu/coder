"use client";

import dynamic from "next/dynamic";
import { Box, Button, MenuItem, Select, Typography } from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { LANGUAGE_OPTIONS } from "@/fe/shared/constants/options";
import styles from "@/fe/contests/styles/ProblemSubmissionPage.module.css";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

interface SolutionEditorProps {
  language: string;
  code: string;
  onLanguageChange: (language: string) => void;
  onCodeChange: (code: string) => void;
  onRunCode?: () => void;
  runButtonDisabled?: boolean;
  runButtonLabel?: string;
}

export default function SolutionEditor({
  language,
  code,
  onLanguageChange,
  onCodeChange,
  onRunCode,
  runButtonDisabled = false,
  runButtonLabel = "Run Code",
}: SolutionEditorProps) {
  return (
    <Box className={`${styles.card} ${styles.solutionCard}`}>
      <Box className={styles.solutionHeader}>
        <Typography className={styles.solutionTitle}>Solution</Typography>
        <Select
          className={styles.solutionSelect}
          value={language}
          onChange={(event) => onLanguageChange(event.target.value as string)}
          size="small"
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Box className={styles.codeEditorWrapper}>
        <MonacoEditor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => onCodeChange(value ?? "")}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: 2,
            padding: { top: 16, bottom: 16 },
          }}
        />
      </Box>

      <Box className={styles.buttonRow}>
        <Button
          className={styles.runButton}
          startIcon={<PlayArrowRoundedIcon fontSize="small" />}
          onClick={onRunCode}
          disabled={runButtonDisabled}
        >
          {runButtonLabel}
        </Button>
        <Button
          className={styles.submitButton}
          variant="contained"
          disableElevation
          startIcon={<SendRoundedIcon fontSize="small" />}
          sx={{ backgroundColor: "#dc2626", "&:hover": { backgroundColor: "#b91c1c" } }}
        >
          Submit
        </Button>
      </Box>
    </Box>
  );
}