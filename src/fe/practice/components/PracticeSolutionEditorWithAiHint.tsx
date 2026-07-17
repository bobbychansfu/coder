"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import AiHintDialog from "@/fe/shared/components/problem/AiHintDialog";
import SolutionEditor from "@/fe/shared/components/problem/SolutionEditor";

interface PracticeSolutionEditorWithAiHintProps
  extends Omit<
    ComponentProps<typeof SolutionEditor>,
    "showAiHint" | "aiHintLoading" | "onRequestAiHint"
  > {
  problemId: string;
  problemCode: string;
  problemTitle: string;
}

function getHintText(payload: unknown, depth = 0): string | null {
  if (depth > 5 || !payload) {
    return null;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const hint = getHintText(item, depth + 1);
      if (hint) {
        return hint;
      }
    }
    return null;
  }

  if (typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const targetKeys = ["hint", "feedback", "message", "response", "text"];

  for (const key of targetKeys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  for (const key of [...targetKeys, "data"]) {
    const value = record[key];
    if (value && typeof value === "object") {
      const hint = getHintText(value, depth + 1);
      if (hint) {
        return hint;
      }
    }
  }

  return null;
}

export default function PracticeSolutionEditorWithAiHint({
  problemId,
  problemCode,
  problemTitle,
  language,
  code,
  ...editorProps
}: PracticeSolutionEditorWithAiHintProps) {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      const controller = abortControllerRef.current;
      abortControllerRef.current = null;
      controller?.abort();
    };
  }, []);

  const requestAiHint = async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setOpen(true);
    setLoading(true);
    setHint(null);
    setError(null);

    try {
      const response = await fetch("/api/s/request_hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify({
          pid: problemId,
          problem_code: problemCode,
          problem_title: problemTitle,
          language: language === "cplusplus" ? "cpp" : language,
          code,
        }),
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const errorPayload = payload as { details?: string; error?: string } | null;
        throw new Error(
          errorPayload?.details ??
            errorPayload?.error ??
            `Failed to generate hint (Status ${response.status}).`,
        );
      }

      const hintText = getHintText(payload);
      if (!hintText) {
        throw new Error("Hint service returned an empty response.");
      }
      setHint(hintText);
    } catch (requestError) {
      if (requestError instanceof Error && requestError.name === "AbortError") {
        return;
      }
      setError(
        requestError instanceof Error ? requestError.message : "Failed to generate hint.",
      );
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setLoading(false);
      }
    }
  };

  return (
    <>
      <SolutionEditor
        {...editorProps}
        language={language}
        code={code}
        showAiHint
        aiHintLoading={loading}
        onRequestAiHint={requestAiHint}
      />
      <AiHintDialog
        open={open}
        loading={loading}
        hint={hint}
        error={error}
        onClose={() => setOpen(false)}
        onRetry={() => void requestAiHint()}
      />
    </>
  );
}
