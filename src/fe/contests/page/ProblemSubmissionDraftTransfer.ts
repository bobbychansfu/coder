import { useEffect } from "react";
import {
  DEFAULT_CODE_LANGUAGE,
  removePersistedCodeDraft,
  writePersistedCodeDraft,
  type CodeDraftMap,
  type PersistedCodeDraft,
  type SupportedCodeLanguage,
} from "@/fe/shared/services/codeDraftStorage";

const CONTEST_DRAFT_STORAGE_KEY_PREFIX = "contest-submission-draft:";

export function getContestDraftStorageKey(
  computingId: string,
  contestId: string,
  problemCode: string,
) {
  return `${CONTEST_DRAFT_STORAGE_KEY_PREFIX}${computingId}:${contestId}:${problemCode.toLowerCase()}`;
}

export function useContestDraftPersistence({
  storageKey,
  effectiveLanguage,
  effectiveDrafts,
  persistedDraft,
}: {
  storageKey: string;
  effectiveLanguage: SupportedCodeLanguage;
  effectiveDrafts: CodeDraftMap;
  persistedDraft: PersistedCodeDraft | null | undefined;
}) {
  useEffect(() => {
    if (persistedDraft === undefined) {
      return;
    }

    const hasStoredDrafts = Object.keys(effectiveDrafts).length > 0;

    if (!hasStoredDrafts && effectiveLanguage === DEFAULT_CODE_LANGUAGE) {
      removePersistedCodeDraft(storageKey);
      return;
    }

    writePersistedCodeDraft(storageKey, {
      language: effectiveLanguage,
      drafts: effectiveDrafts,
    });
  }, [effectiveDrafts, effectiveLanguage, persistedDraft, storageKey]);
}
