"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Box, Button, MenuItem, Select, Typography } from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
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
  onSubmitCode?: () => void;
  submitButtonDisabled?: boolean;
  submitButtonLabel?: string;
  headerLeading?: ReactNode;
  footerContent?: ReactNode;
  showAiHint?: boolean;
  aiHintSource?: string;
  aiHintDisabled?: boolean;
}

const AI_HINT_COOLDOWN_SECONDS = 28;

function buildAiHint(source: string) {
  const trimmed = source.trim();

  if (!trimmed) {
    return "Your editor looks empty. Start with a direct solution first, then trim repeated work after the base case behaves correctly.";
  }

  if (trimmed.length < 180) {
    return "You already have a partial draft. Test the smallest valid input first, then make sure your main loop or helper handles edge cases cleanly.";
  }

  return "You have a solid draft. Look for repeated work, verify one sharp edge case, and check whether your data structure choice matches the target time complexity.";
}

export default function SolutionEditor({
  language,
  code,
  onLanguageChange,
  onCodeChange,
  onSubmitCode,
  submitButtonDisabled = false,
  submitButtonLabel = "Submit",
  headerLeading,
  footerContent,
  showAiHint = false,
  aiHintSource = "",
  aiHintDisabled = false,
}: SolutionEditorProps) {
  const editorLanguage = LANGUAGE_OPTIONS.find((o) => o.value === language)?.monacoLanguage ?? "plaintext";
  const [aiHintState, setAiHintState] = useState<"idle" | "ready" | "cooldown">("idle");
  const [cooldownSeconds, setCooldownSeconds] = useState(AI_HINT_COOLDOWN_SECONDS);

  useEffect(() => {
    if (aiHintState !== "cooldown") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (cooldownSeconds <= 1) {
        setAiHintState("idle");
        setCooldownSeconds(AI_HINT_COOLDOWN_SECONDS);
        return;
      }

      setCooldownSeconds((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [aiHintState, cooldownSeconds]);

  const aiHintMessage = useMemo(() => buildAiHint(aiHintSource), [aiHintSource]);

  const startAiHintCooldown = () => {
    setAiHintState("cooldown");
    setCooldownSeconds(AI_HINT_COOLDOWN_SECONDS);
  };

  const aiHintLeading = !showAiHint ? null : aiHintState === "idle" ? (
    <Button
      className={styles.aiHintButton}
      startIcon={<AutoAwesomeRoundedIcon fontSize="inherit" />}
      onClick={() => setAiHintState("ready")}
      disabled={aiHintDisabled}
    >
      AI Hint
    </Button>
  ) : aiHintState === "ready" ? (
    <Box className={styles.aiHintReadyBadge}>
      <AutoAwesomeRoundedIcon fontSize="inherit" />
      <span>Hint ready</span>
    </Box>
  ) : (
    <Box className={styles.aiHintCooldownBadge}>
      <AccessTimeRoundedIcon fontSize="inherit" />
      <span>{cooldownSeconds}s</span>
    </Box>
  );

  const aiHintPanel =
    showAiHint && aiHintState === "ready" ? (
      <Box className={styles.aiHintPanel}>
        <Box className={styles.aiHintPanelHeader}>
          <Box className={styles.aiHintPanelTitleRow}>
            <AutoAwesomeRoundedIcon fontSize="inherit" className={styles.aiHintPanelIcon} />
            <span className={styles.aiHintPanelTitle}>AI Hint</span>
            <span className={styles.aiHintPanelContext}>Based on your code</span>
          </Box>
          <Box className={styles.aiHintPanelActions}>
            <button
              type="button"
              className={styles.aiHintPanelAction}
              onClick={startAiHintCooldown}
              aria-label="Collapse AI hint"
            >
              <ExpandLessRoundedIcon fontSize="inherit" />
            </button>
            <button
              type="button"
              className={styles.aiHintPanelAction}
              onClick={startAiHintCooldown}
              aria-label="Close AI hint"
            >
              <CloseRoundedIcon fontSize="inherit" />
            </button>
          </Box>
        </Box>
        <Box className={styles.aiHintPanelBody}>{aiHintMessage}</Box>
        <Box className={styles.aiHintPanelFootnote}>
          Hints guide your thinking. The solution is still yours to finish.
        </Box>
      </Box>
    ) : null;

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
            onChange={(value) => onCodeChange(value ?? "")}
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

      {footerContent ?? aiHintPanel}

      <Box className={styles.buttonRow}>
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
