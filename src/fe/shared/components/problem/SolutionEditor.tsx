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
  onSubmitCode?: () => void;
  submitButtonDisabled?: boolean;
  submitButtonLabel?: string;
}

export default function SolutionEditor({
  language,
  code,
  onLanguageChange,
  onCodeChange,
  onRunCode,
  runButtonDisabled = false,
  runButtonLabel = "Run Code",
  onSubmitCode,
  submitButtonDisabled = false,
  submitButtonLabel = "Submit",
}: SolutionEditorProps) {
  const editorLanguage = LANGUAGE_OPTIONS.find((o) => o.value === language)?.monacoLanguage ?? "plaintext";

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
        <Box className={styles.codeEditorSurface}>
          <MonacoEditor
            height="100%"
            language={editorLanguage}
            value={code}
            onChange={(value) => onCodeChange(value ?? "")}
            onMount={(editor, monaco) => {
              editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                if (!runButtonDisabled) {
                  onRunCode?.();
                }
              });
            }}
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
