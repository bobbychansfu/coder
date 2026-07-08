import { useEffect, useRef } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ContestDetailStatus } from "@/fe/contests/data/contestDetails";
import {
  DEFAULT_CODE_LANGUAGE,
  readPersistedCodeDraft,
  removePersistedCodeDraft,
  writePersistedCodeDraft,
  type CodeDraftMap,
  type PersistedCodeDraft,
  type SupportedCodeLanguage,
} from "@/fe/shared/services/codeDraftStorage";
import { resolveContestEndTimestamp } from "./ProblemSubmissionTiming";

export interface ContestPracticeProblemLink {
  contestCode: string;
  practiceProblemCode: string;
}

const CONTEST_DRAFT_STORAGE_KEY_PREFIX = "contest-submission-draft:";
const PRACTICE_DRAFT_STORAGE_KEY_PREFIX = "practice-submission-draft:";

export function getContestDraftStorageKey(contestId: string, problemCode: string) {
  return `${CONTEST_DRAFT_STORAGE_KEY_PREFIX}${contestId}:${problemCode.toLowerCase()}`;
}

function getPracticeDraftStorageKey(problemCode: string) {
  return `${PRACTICE_DRAFT_STORAGE_KEY_PREFIX}${problemCode}`;
}

function hasDraftContent(drafts: CodeDraftMap) {
  return Object.values(drafts).some(
    (draft) => typeof draft === "string" && draft.trim().length > 0,
  );
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

export function useContestPracticeRedirect({
  contestId,
  contestStatus,
  contestStartsAt,
  contestEndsAt,
  contestDurationMinutes,
  contestProblemCode,
  practiceProblemCode,
  practiceProblemLinks,
  effectiveLanguage,
  effectiveDrafts,
  persistedDraft,
  router,
}: {
  contestId: string;
  contestStatus?: ContestDetailStatus;
  contestStartsAt?: string | null;
  contestEndsAt?: string | null;
  contestDurationMinutes?: number | null;
  contestProblemCode: string;
  practiceProblemCode: string;
  practiceProblemLinks: ContestPracticeProblemLink[];
  effectiveLanguage: SupportedCodeLanguage;
  effectiveDrafts: CodeDraftMap;
  persistedDraft: PersistedCodeDraft | null | undefined;
  router: AppRouterInstance;
}) {
  const hasRedirectedToPracticeRef = useRef(false);

  useEffect(() => {
    if (persistedDraft === undefined) {
      return;
    }

    if (hasRedirectedToPracticeRef.current) {
      return;
    }

    const allPracticeProblemLinks =
      practiceProblemLinks.length > 0
        ? practiceProblemLinks
        : [{ contestCode: contestProblemCode, practiceProblemCode }];

    const copyDraftAndRedirectToPractice = () => {
      if (hasRedirectedToPracticeRef.current) {
        return;
      }

      hasRedirectedToPracticeRef.current = true;

      allPracticeProblemLinks.forEach((link) => {
        const isCurrentProblem =
          link.contestCode.toLowerCase() === contestProblemCode.toLowerCase();
        const contestDraft = isCurrentProblem
          ? { language: effectiveLanguage, drafts: effectiveDrafts }
          : readPersistedCodeDraft(getContestDraftStorageKey(contestId, link.contestCode));

        if (!contestDraft || !hasDraftContent(contestDraft.drafts)) {
          return;
        }

        writePersistedCodeDraft(getPracticeDraftStorageKey(link.practiceProblemCode), contestDraft);
      });

      router.replace(`/practice/${encodeURIComponent(practiceProblemCode)}`);
    };

    if (contestStatus === "closed") {
      copyDraftAndRedirectToPractice();
      return;
    }

    const endTime = resolveContestEndTimestamp({
      startsAt: contestStartsAt,
      endsAt: contestEndsAt,
      durationMinutes: contestDurationMinutes,
    });

    if (endTime === null) {
      return;
    }

    const checkContestEnd = () => {
      if (Date.now() >= endTime) {
        copyDraftAndRedirectToPractice();
      }
    };

    checkContestEnd();
    const intervalId = window.setInterval(checkContestEnd, 1000);

    return () => window.clearInterval(intervalId);
  }, [
    contestDurationMinutes,
    contestEndsAt,
    contestId,
    contestProblemCode,
    contestStartsAt,
    contestStatus,
    effectiveDrafts,
    effectiveLanguage,
    persistedDraft,
    practiceProblemCode,
    practiceProblemLinks,
    router,
  ]);
}
