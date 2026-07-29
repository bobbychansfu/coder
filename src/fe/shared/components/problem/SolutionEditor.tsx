"use client";

import dynamic from "next/dynamic";
import { type ReactNode } from "react";
import { Box, Button, CircularProgress, MenuItem, Select, Typography } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
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
  onCodeChange: (code: string, isFlush?: boolean) => void;
  onSubmitCode?: () => void;
  submitButtonDisabled?: boolean;
  submitButtonLabel?: string;
  submitButtonStartIcon?: ReactNode;
  secondaryButtonLabel?: string;
  secondaryButtonDisabled?: boolean;
  onSecondaryAction?: () => void;
  headerLeading?: ReactNode;
  footerContent?: ReactNode;
  showAiHint?: boolean;
  aiHintSource?: string;
  aiHintDisabled?: boolean;
  aiHintLoading?: boolean;
  onRequestAiHint?: () => Promise<void> | void;
}

export default function SolutionEditor({
  language,
  code,
  onLanguageChange,
  onCodeChange,
  onSubmitCode,
  submitButtonDisabled = false,
  submitButtonLabel = "Submit",
  submitButtonStartIcon,
  secondaryButtonLabel,
  secondaryButtonDisabled = false,
  onSecondaryAction,
  headerLeading,
  footerContent,
  showAiHint = false,
  aiHintDisabled = false,
  aiHintLoading = false,
  onRequestAiHint,
}: SolutionEditorProps) {
  const editorLanguage = LANGUAGE_OPTIONS.find((o) => o.value === language)?.monacoLanguage ?? "plaintext";

  const aiHintLeading = !showAiHint ? null : (
    <Button
      className={styles.aiHintButton}
      startIcon={
        aiHintLoading ? (
          <CircularProgress size={14} color="inherit" />
        ) : (
          <AutoAwesomeRoundedIcon fontSize="inherit" />
        )
      }
      onClick={() => void onRequestAiHint?.()}
      disabled={aiHintDisabled || aiHintLoading || !onRequestAiHint}
    >
      {aiHintLoading ? "Generating..." : "AI Hint"}
    </Button>
  );

  return (
    <Box className={`${styles.card} ${styles.solutionCard}`}>
      <Box className={styles.solutionHeader}>
        <Typography className={styles.solutionTitle}>Solution</Typography>
        <Box className={styles.solutionActions}>
          {headerLeading ?? aiHintLeading}
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
      </Box>

      <Box className={styles.codeEditorWrapper}>
        <Box className={styles.codeEditorSurface}>
          <MonacoEditor
            height="100%"
            language={editorLanguage}
            value={code}
            onChange={(value, event) => onCodeChange(value ?? "", event.isFlush)}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "\"JetBrains Mono\", \"Fira Code\", monospace",
              lineHeight: 26,
              wordWrap: "on",
              wrappingIndent: "indent",
              automaticLayout: true,
              scrollBeyondLastLine: false,
              tabSize: 2,
              glyphMargin: false,
              lineNumbers: "on",
              lineNumbersMinChars: 3,
              lineDecorationsWidth: 8,
              renderLineHighlight: "gutter",
              renderLineHighlightOnlyWhenFocus: true,
              overviewRulerBorder: false,
              cursorSmoothCaretAnimation: "on",
              scrollbar: {
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
                useShadows: false,
              },
              padding: { top: 18, bottom: 24 },
            }}
          />
        </Box>
      </Box>

      {footerContent}

      <Box className={styles.buttonRow}>
        {secondaryButtonLabel ? (
          <Button
            className={styles.runButton}
            variant="outlined"
            startIcon={<PlayArrowRoundedIcon fontSize="small" />}
            onClick={onSecondaryAction}
            disabled={secondaryButtonDisabled}
          >
            {secondaryButtonLabel}
          </Button>
        ) : null}
        <Button
          className={styles.submitButton}
          variant="contained"
          disableElevation
          startIcon={
            submitButtonStartIcon ?? <SendRoundedIcon fontSize="small" />
          }
          onClick={onSubmitCode}
          disabled={submitButtonDisabled}
          sx={{ backgroundColor: "#dc2626", "&:hover": { backgroundColor: "#ef4444" } }}
        >
          {submitButtonLabel}
        </Button>
      </Box>
    </Box>
  );
}
