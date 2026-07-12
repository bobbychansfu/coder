"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Box, Typography } from "@mui/material";

import SubpageActionButtons, {
  type SubpageActionButtonItem,
} from "@/fe/instructor/components/SubpageActionButtons";
import InstructorCreateContestDialogs from "@/fe/instructor/page/InstructorCreateContestDialogs";
import InstructorCreateContestMain, {
  type ContestDraftListItem,
} from "@/fe/instructor/page/InstructorCreateContestMain";
import InstructorCreateContestSidebar from "@/fe/instructor/page/InstructorCreateContestSidebar";
import {
  contestAuthoringCopy,
  contestFormDraft,
  contestPreviewFallback,
  type ContestDifficulty,
  type ContestFormDraft,
  type ContestProblemRecord,
} from "@/fe/instructor/data/contestAuthoring";
import AuthoringPageShell from "@/fe/shared/components/authoring/AuthoringPageShell";
import { ROUTES } from "@/fe/shared/constants/routes";
import { trpc } from "@/lib/trpc/client";
import subpageStyles from "@/fe/instructor/styles/InstructorSubpageHeader.module.css";
import styles from "@/fe/instructor/styles/InstructorCreateContestPage.module.css";

const MANAGE_CONTESTS_TAB_ROUTE = `${ROUTES.instructorManageContests}?tab=contests`;

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function toLocalDateInputValue(isoValue: string | null | undefined) {
  if (!isoValue) {
    return "";
  }

  const date = new Date(isoValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function toLocalTimeInputValue(isoValue: string | null | undefined) {
  if (!isoValue) {
    return "";
  }

  const date = new Date(isoValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
}

function getLocalDateTimeOffsetMinutes(dateValue: string, timeValue: string) {
  if (!dateValue.trim() || !timeValue.trim()) {
    return undefined;
  }

  const localDateTime = new Date(`${dateValue}T${timeValue}`);

  if (Number.isNaN(localDateTime.getTime())) {
    return undefined;
  }

  return localDateTime.getTimezoneOffset();
}

function formatPreviewDate(dateValue: string, timeValue: string) {
  if (!dateValue) {
    return null;
  }

  const isoString = `${dateValue}T${timeValue || "00:00"}`;
  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return `${dateValue}${timeValue ? `, ${timeValue}` : ""}`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getProblemSourcePriority(problem: ContestProblemRecord) {
  return problem.source === "contest-only" ? 0 : 1;
}

interface SelectableContestProblemRecord extends ContestProblemRecord {
  isDraft?: boolean;
}

function toSelectableContestProblemRecord(problem: {
  id: string;
  title: string;
  difficulty: ContestDifficulty;
  points: number;
  tags: string[];
  source?: string | null;
  isDraft?: boolean;
}): SelectableContestProblemRecord {
  return {
    id: problem.id,
    title: problem.title,
    difficulty: problem.difficulty,
    points: problem.points,
    tags: problem.tags,
    source: problem.source === "contest-only" ? "contest-only" : "public",
    isDraft: problem.isDraft,
  };
}

export default function InstructorCreateContestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initializedContestIdRef = useRef<string | null>(null);
  const utils = trpc.useUtils();
  const contestId = searchParams.get("contestId");
  const isEditMode = Boolean(contestId);
  const [formValues, setFormValues] = useState<ContestFormDraft>(contestFormDraft);
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);
  const [pendingProblemIds, setPendingProblemIds] = useState<string[]>([]);
  const [selectProblemsOpen, setSelectProblemsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [aiHintEnabled, setAiHintEnabled] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const contestQuery = trpc.contestAuthoring.getContestById.useQuery(
    { contestId: contestId ?? "" },
    { enabled: isEditMode, retry: false },
  );
  const problemLibraryQuery = trpc.contestAuthoring.listProblemLibrary.useQuery(undefined, {
    retry: false,
  });
  const draftContestsQuery = trpc.contestAuthoring.listDraftContests.useQuery(undefined, {
    retry: false,
  });
  const createContestMutation = trpc.contestAuthoring.createContest.useMutation();
  const updateContestMutation = trpc.contestAuthoring.updateContest.useMutation();
  const deleteDraftMutation = trpc.instructorManageContent.updateContestManageStatus.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.contestAuthoring.listDraftContests.invalidate(),
        utils.instructorManageContent.getManageContent.invalidate(),
        utils.instructorManageContent.getInstructorOverview.invalidate(),
      ]);
    },
    onError: (mutationError) => {
      setSaveError(mutationError.message);
    },
  });
  const headerActions: SubpageActionButtonItem[] = [
    {
      id: "save-draft",
      label: contestAuthoringCopy.saveDraftLabel,
      icon: SaveOutlinedIcon,
      onClick: () => void handleSaveDraft(),
    },
    {
      id: "preview",
      label: contestAuthoringCopy.previewLabel,
      icon: RemoveRedEyeOutlinedIcon,
      onClick: () => setPreviewOpen(true),
    },
  ];

  useEffect(() => {
    if (!contestQuery.data) {
      return;
    }

    if (initializedContestIdRef.current === contestQuery.data.id) {
      return;
    }

    queueMicrotask(() => {
      setFormValues({
        contestName: contestQuery.data.contestName,
        description: contestQuery.data.description,
        startDate: toLocalDateInputValue(contestQuery.data.startsAtIso),
        startTime: toLocalTimeInputValue(contestQuery.data.startsAtIso),
        endDate: toLocalDateInputValue(contestQuery.data.endsAtIso),
        endTime: toLocalTimeInputValue(contestQuery.data.endsAtIso),
        visibility: contestQuery.data.visibility,
        groupAHintAfterMinutes: contestQuery.data.groupAHintAfterMinutes,
        groupBHintAfterMinutes: contestQuery.data.groupBHintAfterMinutes,
      });
      setSelectedProblemIds(contestQuery.data.selectedProblemIds);
      setAiHintEnabled(contestQuery.data.aiHintEnabled);
      initializedContestIdRef.current = contestQuery.data.id;
    });
  }, [contestQuery.data]);

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    initializedContestIdRef.current = null;

    queueMicrotask(() => {
      setFormValues(contestFormDraft);
      setSelectedProblemIds([]);
      setPendingProblemIds([]);
      setAiHintEnabled(false);
      setSaveError(null);
    });
  }, [isEditMode]);

  const availableProblems = useMemo(() => {
    const problemMap = new Map<string, SelectableContestProblemRecord>();

    (problemLibraryQuery.data ?? []).forEach((problem) => {
      problemMap.set(problem.id, toSelectableContestProblemRecord(problem));
    });
    (contestQuery.data?.selectedProblems ?? []).forEach((problem) => {
      problemMap.set(problem.id, toSelectableContestProblemRecord(problem));
    });

    return Array.from(problemMap.values()).sort((left, right) => {
      const priorityDifference = getProblemSourcePriority(left) - getProblemSourcePriority(right);

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return left.title.localeCompare(right.title);
    });
  }, [contestQuery.data?.selectedProblems, problemLibraryQuery.data]);

  const selectedProblems = useMemo(
    () =>
      selectedProblemIds
        .map((problemId) => availableProblems.find((problem) => problem.id === problemId))
        .filter((problem): problem is ContestProblemRecord => Boolean(problem)),
    [availableProblems, selectedProblemIds],
  );

  const draftContests = (draftContestsQuery.data ?? []) as ContestDraftListItem[];

  const previewProblems = selectedProblems.length
    ? selectedProblems.slice(0, 3)
    : availableProblems.slice(0, 3);


  const previewTitle = formValues.contestName.trim() || contestPreviewFallback.title;
  const previewDescription = formValues.description.trim() || contestPreviewFallback.description;
  const previewStart =
    formatPreviewDate(formValues.startDate, formValues.startTime) || contestPreviewFallback.start;
  const previewEnd =
    formatPreviewDate(formValues.endDate, formValues.endTime) || contestPreviewFallback.end;
  const pageTitle = isEditMode ? "Edit Contest" : contestAuthoringCopy.pageTitle;
  const pageSubtitle = isEditMode
    ? "Update an existing programming contest for your students"
    : contestAuthoringCopy.pageSubtitle;
  const publishLabel = isEditMode ? "Save Changes" : contestAuthoringCopy.publishLabel;
  const isSaving = createContestMutation.isPending || updateContestMutation.isPending;
  const pageError =
    saveError ??
    contestQuery.error?.message ??
    problemLibraryQuery.error?.message ??
    draftContestsQuery.error?.message ??
    null;
  const isPageLoading =
    (isEditMode && contestQuery.isLoading && !contestQuery.data) ||
    (problemLibraryQuery.isLoading && availableProblems.length === 0);

  const updateField = (field: keyof ContestFormDraft, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const updateNumberField = (field: keyof ContestFormDraft, value: string) => {
    const parsedValue = Number(value);

    setFormValues((prev) => ({
      ...prev,
      [field]: Number.isFinite(parsedValue) ? Math.max(0, Math.floor(parsedValue)) : 0,
    }));
  };

  const buildContestMutationInput = (isDraft: boolean) => ({
    ...formValues,
    startUtcOffsetMinutes: getLocalDateTimeOffsetMinutes(formValues.startDate, formValues.startTime),
    endUtcOffsetMinutes:
      formValues.endDate.trim() && formValues.endTime.trim()
        ? getLocalDateTimeOffsetMinutes(formValues.endDate, formValues.endTime)
        : null,
    isDraft,
    aiHintEnabled,
    selectedProblemIds,
  });

  const openSelectProblems = () => {
    setPendingProblemIds(selectedProblemIds);
    setSelectProblemsOpen(true);
  };

  const togglePendingProblem = (problemId: string) => {
    setPendingProblemIds((prev) =>
      prev.includes(problemId) ? prev.filter((id) => id !== problemId) : [...prev, problemId],
    );
  };

  const applySelectedProblems = () => {
    setSelectedProblemIds(pendingProblemIds);
    setSelectProblemsOpen(false);
  };

  const removeProblem = (problemId: string) => {
    setSelectedProblemIds((prev) => prev.filter((id) => id !== problemId));
  };

  const handleEditDraftContest = (draftContestId: string) => {
    router.push(`${ROUTES.instructorCreateContest}?contestId=${draftContestId}`);
  };

  const handleDeleteDraftContest = async (draftContestId: string) => {
    setSaveError(null);

    try {
      await deleteDraftMutation.mutateAsync({
        contestId: draftContestId,
        manageStatus: "DELETED",
      });

      if (contestId === draftContestId) {
        router.push(ROUTES.instructorCreateContest);
      }
    } catch {
      // Error state is handled by the mutation onError callback.
    }
  };

  const handlePublish = async () => {
    setSaveError(null);

    try {
      if (isEditMode && contestId) {
        await updateContestMutation.mutateAsync({
          contestId,
          data: buildContestMutationInput(false),
        });
      } else {
        await createContestMutation.mutateAsync(buildContestMutationInput(false));
      }

      await Promise.all([
        utils.instructorManageContent.getManageContent.invalidate(),
        utils.instructorManageContent.getInstructorOverview.invalidate(),
        utils.contestAuthoring.listDraftContests.invalidate(),
        utils.contestAuthoring.getContestById.invalidate({ contestId: contestId ?? "" }),
      ]);

      router.push(MANAGE_CONTESTS_TAB_ROUTE);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save the contest.");
    }
  };

  const handleSaveDraft = async () => {
    if (!formValues.contestName.trim()) {
      setSaveError("Contest name is required to save a draft.");
      return;
    }

    setSaveError(null);

    try {
      if (isEditMode && contestId) {
        await updateContestMutation.mutateAsync({
          contestId,
          data: buildContestMutationInput(true),
        });
        await Promise.all([
          utils.instructorManageContent.getManageContent.invalidate(),
          utils.instructorManageContent.getInstructorOverview.invalidate(),
          utils.contestAuthoring.listDraftContests.invalidate(),
          utils.contestAuthoring.getContestById.invalidate({ contestId }),
        ]);
        router.push(MANAGE_CONTESTS_TAB_ROUTE);
      } else {
        await createContestMutation.mutateAsync(buildContestMutationInput(true));
        await Promise.all([
          utils.instructorManageContent.getManageContent.invalidate(),
          utils.instructorManageContent.getInstructorOverview.invalidate(),
          utils.contestAuthoring.listDraftContests.invalidate(),
        ]);
        router.push(MANAGE_CONTESTS_TAB_ROUTE);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save draft.");
    }
  };

  return (
    <>
      <AuthoringPageShell
        onBack={() => router.back()}
        backLabel={contestAuthoringCopy.backButtonLabel}
        backButtonClassName={subpageStyles.backButton}
        title={pageTitle}
        subtitle={pageSubtitle}
        actions={
          <SubpageActionButtons
            items={headerActions}
            containerClassName={styles.headerActions}
            buttonClassName={styles.secondaryAction}
            iconClassName={styles.actionIcon}
          />
        }
        main={
          <>
            {pageError ? (
              <Box
                sx={{
                  border: "1px solid #fecaca",
                  borderRadius: "12px",
                  backgroundColor: "#fef2f2",
                  px: 2,
                  py: 1.5,
                }}
              >
                <Typography sx={{ color: "#b91c1c", fontSize: 13, fontWeight: 500 }}>
                  {pageError}
                </Typography>
              </Box>
            ) : null}

            <InstructorCreateContestMain
              formValues={formValues} selectedProblems={selectedProblems}
              draftContests={draftContests} aiHintEnabled={aiHintEnabled}
              isLoading={draftContestsQuery.isLoading}
              onFieldChange={updateField} onNumberFieldChange={updateNumberField}
              onOpenSelectProblems={openSelectProblems} onRemoveProblem={removeProblem}
              onAiHintEnabledChange={setAiHintEnabled}
              onEditDraft={handleEditDraftContest}
              onDeleteDraft={(draftContestId) => void handleDeleteDraftContest(draftContestId)}
            />
          </>
        }
        sidebar={
          <InstructorCreateContestSidebar
            formValues={formValues} selectedProblemsCount={selectedProblems.length}
            draftContestsCount={draftContests.length} aiHintEnabled={aiHintEnabled}
            isEditMode={isEditMode} isSaving={isSaving} isPageLoading={isPageLoading}
            publishLabel={publishLabel} onFieldChange={updateField}
            onPublish={() => void handlePublish()}
          />
        }
      />

      <InstructorCreateContestDialogs
        selectProblemsOpen={selectProblemsOpen} previewOpen={previewOpen}
        availableProblems={availableProblems} pendingProblemIds={pendingProblemIds}
        previewProblems={previewProblems} formValues={formValues}
        aiHintEnabled={aiHintEnabled} previewTitle={previewTitle}
        previewDescription={previewDescription} previewStart={previewStart} previewEnd={previewEnd}
        onSelectProblemsClose={() => setSelectProblemsOpen(false)}
        onPreviewClose={() => setPreviewOpen(false)}
        onTogglePendingProblem={togglePendingProblem}
        onApplySelectedProblems={applySelectedProblems}
      />
    </>
  );
}
