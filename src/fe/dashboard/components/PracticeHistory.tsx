"use client";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CodeIcon from "@mui/icons-material/Code";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HistoryIcon from "@mui/icons-material/History";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  PracticeHistoryStatus,
  StudentDashboardPracticeHistoryItem,
  StudentDashboardPracticeProblemCatalogItem,
} from "@/fe/dashboard/services/dashboardPracticeHistory";
import {
  isSupportedCodeLanguage,
  readPersistedCodeDraft,
  type PersistedCodeDraft,
  type SupportedCodeLanguage,
} from "@/fe/shared/services/codeDraftStorage";
import { LANGUAGE_OPTIONS } from "@/fe/shared/constants/options";
import { formatTimeAgo } from "@/fe/shared/services/timeFormatting";
import { trpc } from "@/lib/trpc/client";
import styles from "../styles/PracticeHistory.module.css";

interface PracticeHistoryProps {
  problems?: StudentDashboardPracticeHistoryItem[];
  currentUserComputingId?: string;
}

const PRACTICE_DRAFT_STORAGE_KEY_PREFIX = "practice-submission-draft:";

function readPracticeDraftStorageSnapshot(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const entries: Array<[string, string | null]> = [];

    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const storageKey = window.sessionStorage.key(index);

      if (storageKey?.startsWith(PRACTICE_DRAFT_STORAGE_KEY_PREFIX)) {
        entries.push([storageKey, window.sessionStorage.getItem(storageKey)]);
      }
    }

    return JSON.stringify(entries);
  } catch {
    return "";
  }
}

function getDifficultyClassName(difficulty: StudentDashboardPracticeHistoryItem["difficulty"]) {
  switch (difficulty) {
    case "medium":
      return styles.difficultyMedium;
    case "hard":
      return styles.difficultyHard;
    case "easy":
    default:
      return styles.difficultyEasy;
  }
}

function getStatusClassName(status: PracticeHistoryStatus) {
  switch (status) {
    case "accepted":
      return styles.statusAccepted;
    case "partial":
      return styles.statusPartial;
    case "runtime_error":
    case "failed":
    case "wrong":
      return styles.statusNeedsWork;
    case "draft":
      return styles.statusDraft;
    case "pending":
    default:
      return styles.statusPending;
  }
}

function PracticeStatusIcon({ status }: { status: PracticeHistoryStatus }) {
  if (status === "accepted") {
    return <CheckCircleOutlineIcon className={styles.statusIcon} />;
  }

  if (status === "pending" || status === "draft") {
    return <HistoryIcon className={styles.statusIcon} />;
  }

  return <ErrorOutlineIcon className={styles.statusIcon} />;
}

function getLanguageLabel(language: SupportedCodeLanguage): string {
  return LANGUAGE_OPTIONS.find((option) => option.value === language)?.label ?? language;
}

function getModifiedDraftLanguage(
  draft: PersistedCodeDraft,
  starterCodes: StudentDashboardPracticeProblemCatalogItem["starterCodes"],
): SupportedCodeLanguage | null {
  const preferredLanguages = [
    draft.language,
    ...Object.keys(draft.drafts).filter(isSupportedCodeLanguage),
  ];
  const seenLanguages = new Set<SupportedCodeLanguage>();

  for (const language of preferredLanguages) {
    if (seenLanguages.has(language)) {
      continue;
    }

    seenLanguages.add(language);
    const draftCode = draft.drafts[language];

    if (!draftCode?.trim()) {
      continue;
    }

    const starterCode = starterCodes[language];
    if (starterCode === undefined || draftCode.trim() !== starterCode.trim()) {
      return language;
    }
  }

  return null;
}

export default function PracticeHistory({
  problems = [],
  currentUserComputingId,
}: PracticeHistoryProps) {
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [draftStorageSnapshot, setDraftStorageSnapshot] = useState("");

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDraftStorageSnapshot(readPracticeDraftStorageSnapshot());
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  const draftEntries = useMemo(() => {
    let draftEntries: Array<[string, string | null]> = [];

    try {
      draftEntries = JSON.parse(draftStorageSnapshot) as Array<[string, string | null]>;
    } catch {
      return [];
    }

    return draftEntries;
  }, [draftStorageSnapshot]);

  const draftProblemCodes = useMemo(() => {
    const codes = new Set<string>();

    for (const [storageKey] of draftEntries) {
      const problemCode = storageKey.slice(PRACTICE_DRAFT_STORAGE_KEY_PREFIX.length);
      const draft = readPersistedCodeDraft(storageKey);

      if (!problemCode || !draft?.hasModifiedSolution || !draft.userModifiedAt) {
        continue;
      }

      if (
        currentUserComputingId &&
        draft.ownerComputingId !== currentUserComputingId
      ) {
        continue;
      }

      codes.add(problemCode);
    }

    return [...codes];
  }, [currentUserComputingId, draftEntries]);

  const { data: draftProblemMetadata = [] } = trpc.practice.getDraftProblemMetadata.useQuery(
    { problemCodes: draftProblemCodes },
    { enabled: draftProblemCodes.length > 0 },
  );

  const draftProblems = useMemo(() => {
    const catalogByCode = new Map(
      draftProblemMetadata.map((problem) => [problem.problemCode, problem]),
    );
    const nextDraftProblems: StudentDashboardPracticeHistoryItem[] = [];

    for (const [storageKey] of draftEntries) {
      const problemCode = storageKey.slice(PRACTICE_DRAFT_STORAGE_KEY_PREFIX.length);
      const problem = catalogByCode.get(problemCode);
      const draft = readPersistedCodeDraft(storageKey);

      if (!problem || !draft?.hasModifiedSolution || !draft.userModifiedAt) {
        continue;
      }

      if (
        currentUserComputingId &&
        draft.ownerComputingId !== currentUserComputingId
      ) {
        continue;
      }

      const modifiedLanguage = getModifiedDraftLanguage(draft, problem.starterCodes);

      if (!modifiedLanguage) {
        continue;
      }

      const updatedAt = draft.userModifiedAt;
      nextDraftProblems.push({
        id: `draft-${problem.problemCode}`,
        problemCode: problem.problemCode,
          title: problem.title,
          difficulty: problem.difficulty,
          category: problem.category,
          verdict: "Draft",
        status: "draft",
        language: getLanguageLabel(modifiedLanguage),
        practicedAt: formatTimeAgo(updatedAt, "Draft saved"),
        practicedAtMs: updatedAt,
        href: `/practice/${encodeURIComponent(problem.problemCode)}`,
      });
    }

    return nextDraftProblems;
  }, [currentUserComputingId, draftEntries, draftProblemMetadata]);

  const recordedProblems = useMemo(() => {
    const latestByProblemCode = new Map<string, StudentDashboardPracticeHistoryItem>();

    for (const problem of [...problems, ...draftProblems]) {
      const current = latestByProblemCode.get(problem.problemCode);

      if (!current || problem.practicedAtMs > current.practicedAtMs) {
        latestByProblemCode.set(problem.problemCode, problem);
      }
    }

    return [...latestByProblemCode.values()]
      .sort((a, b) => b.practicedAtMs - a.practicedAtMs);
  }, [draftProblems, problems]);

  const displayProblems = showAllHistory ? recordedProblems : recordedProblems.slice(0, 3);

  return (
    <section className={styles.container} data-testid="practice-history">
      <div className={styles.header}>
        <h2 className={styles.title}>My Practice</h2>
        {recordedProblems.length > 3 && (
          <button
            type="button"
            className={styles.viewAll}
            onClick={() => setShowAllHistory((current) => !current)}
          >
            {showAllHistory ? "Show Less" : "View All"}
          </button>
        )}
      </div>

      {displayProblems.length === 0 ? (
        <div className={styles.empty}>No practice activity yet.</div>
      ) : (
        <div className={styles.list}>
          {displayProblems.map((problem) => (
            <Link
              key={problem.id}
              href={problem.href}
              className={styles.card}
              aria-label={`Open practice problem ${problem.title}`}
            >
              <div className={styles.iconWrapper}>
                <CodeIcon className={styles.problemIcon} />
              </div>

              <div className={styles.content}>
                <div className={styles.titleRow}>
                  <span className={styles.problemTitle}>{problem.title}</span>
                  <span
                    className={`${styles.difficultyBadge} ${getDifficultyClassName(
                      problem.difficulty,
                    )}`}
                  >
                    {problem.difficulty}
                  </span>
                  <span className={`${styles.statusBadge} ${getStatusClassName(problem.status)}`}>
                    <PracticeStatusIcon status={problem.status} />
                    {problem.verdict}
                  </span>
                </div>

                <div className={styles.metadata}>
                  <span>{problem.category}</span>
                  <span className={styles.separator}>-</span>
                  <span>{problem.language}</span>
                  <span className={styles.separator}>-</span>
                  <span>{problem.practicedAt}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
