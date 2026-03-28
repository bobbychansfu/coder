import { useMemo, useSyncExternalStore } from "react";
import { LANGUAGE_OPTIONS } from "@/fe/shared/constants/options";

export type SupportedCodeLanguage = (typeof LANGUAGE_OPTIONS)[number]["value"];
export type CodeDraftMap = Partial<Record<SupportedCodeLanguage, string>>;

export interface PersistedCodeDraft {
  language: SupportedCodeLanguage;
  drafts: CodeDraftMap;
}

export const DEFAULT_CODE_LANGUAGE: SupportedCodeLanguage = "cplusplus";

const SUPPORTED_CODE_LANGUAGES = LANGUAGE_OPTIONS.map((option) => option.value) as SupportedCodeLanguage[];
const subscribeToCodeDraftStorage = () => () => {};

function isSupportedCodeLanguage(value: unknown): value is SupportedCodeLanguage {
  return typeof value === "string" && SUPPORTED_CODE_LANGUAGES.includes(value as SupportedCodeLanguage);
}

function readPersistedCodeDraftRaw(storageKey: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function parsePersistedCodeDraft(rawValue: string | null): PersistedCodeDraft | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as {
      language?: unknown;
      drafts?: Record<string, unknown>;
    };

    if (!isSupportedCodeLanguage(parsed.language) || !parsed.drafts || typeof parsed.drafts !== "object") {
      return null;
    }

    const drafts = Object.fromEntries(
      Object.entries(parsed.drafts).filter(
        ([language, code]) => isSupportedCodeLanguage(language) && typeof code === "string",
      ),
    ) as CodeDraftMap;

    return {
      language: parsed.language,
      drafts,
    };
  } catch {
    return null;
  }
}

export function readPersistedCodeDraft(storageKey: string): PersistedCodeDraft | null {
  return parsePersistedCodeDraft(readPersistedCodeDraftRaw(storageKey));
}

export function usePersistedCodeDraft(storageKey: string): PersistedCodeDraft | null | undefined {
  const rawValue = useSyncExternalStore(
    subscribeToCodeDraftStorage,
    () => readPersistedCodeDraftRaw(storageKey),
    () => undefined,
  );

  return useMemo(() => {
    if (rawValue === undefined) {
      return undefined;
    }

    return parsePersistedCodeDraft(rawValue);
  }, [rawValue]);
}

export function writePersistedCodeDraft(storageKey: string, value: PersistedCodeDraft) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Ignore storage write failures and keep the editor usable.
  }
}

export function removePersistedCodeDraft(storageKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // Ignore storage removal failures and keep the editor usable.
  }
}
