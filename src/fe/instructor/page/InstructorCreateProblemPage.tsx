"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { Box, Card, CardContent, CircularProgress, Typography } from "@mui/material";

import SubpageActionButtons, { type SubpageActionButtonItem } from "@/fe/instructor/components/SubpageActionButtons";
import InstructorCreateProblemDraftsCard, {
  type ProblemDraftListItem,
} from "@/fe/instructor/page/InstructorCreateProblemDraftsCard";
import InstructorCreateProblemDialogs from "@/fe/instructor/page/InstructorCreateProblemDialogs";
import InstructorCreateProblemForm from "@/fe/instructor/page/InstructorCreateProblemForm";
import InstructorCreateProblemStatusSidebar from "@/fe/instructor/page/InstructorCreateProblemStatusSidebar";
import {
  problemAuthoringCopy,
  problemAuthoringTabs,
  problemExamplesDraft,
  problemMetadataDraft,
  problemStatementDraft,
  starterCodeDraft,
  type ProblemExampleDraft,
  type ProblemMetadataDraft,
  type ProblemStatementDraft,
  type StarterLanguage,
} from "@/fe/instructor/data/problemAuthoring";
import AuthoringPageShell from "@/fe/shared/components/authoring/AuthoringPageShell";
import { ROUTES } from "@/fe/shared/constants/routes";
import { DIFFICULTY_OPTIONS, LANGUAGE_OPTIONS, PROBLEM_SOURCE_OPTIONS } from "@/fe/shared/constants/options";
import { trpc } from "@/lib/trpc/client";
import subpageStyles from "@/fe/instructor/styles/InstructorSubpageHeader.module.css";
import styles from "@/fe/instructor/styles/InstructorCreateProblemPage.module.css";

type ProblemTab = (typeof problemAuthoringTabs)[number]["value"];

const stepOrder: ProblemTab[] = ["metadata", "statement", "examples", "starter-code"];
export default function InstructorCreateProblemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initializedProblemIdRef = useRef<string | null>(null);
  const utils = trpc.useUtils();
  const problemId = searchParams.get("problemId");
  const isEditMode = Boolean(problemId);

  const [activeTab, setActiveTab] = useState<ProblemTab>("metadata");
  const [metadataValues, setMetadataValues] = useState<ProblemMetadataDraft>(problemMetadataDraft);
  const [statementValues, setStatementValues] = useState<ProblemStatementDraft>(problemStatementDraft);
  const [examples, setExamples] = useState<ProblemExampleDraft[]>(problemExamplesDraft);
  const [starterCodes, setStarterCodes] = useState(starterCodeDraft);
  const [baseLanguage, setBaseLanguage] = useState<StarterLanguage>("typescript");
  const [activeLanguage, setActiveLanguage] = useState<StarterLanguage>("typescript");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [selectedCsvName, setSelectedCsvName] = useState("");
  const [tagAnchorEl, setTagAnchorEl] = useState<HTMLElement | null>(null);
  const [generationFeedback, setGenerationFeedback] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const generateStarterCodesMutation = trpc.problemAuthoring.generateStarterCodes.useMutation();
  const problemQuery = trpc.problemAuthoring.getProblemById.useQuery(
    { problemId: problemId ?? "" },
    { enabled: isEditMode, retry: false },
  );
  const draftProblemsQuery = trpc.problemAuthoring.listDraftProblems.useQuery(undefined, {
    retry: false,
  });
  const createProblemMutation = trpc.problemAuthoring.createProblem.useMutation();
  const updateProblemMutation = trpc.problemAuthoring.updateProblem.useMutation();
  const deleteDraftMutation = trpc.instructorManageContent.updateProblemManageStatus.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.problemAuthoring.listDraftProblems.invalidate(),
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
      label: problemAuthoringCopy.saveDraftLabel,
      icon: SaveOutlinedIcon,
      onClick: () => void handleSaveDraft(),
    },
    {
      id: "import-csv",
      label: problemAuthoringCopy.importCsvLabel,
      icon: UploadFileOutlinedIcon,
      onClick: () => setCsvOpen(true),
    },
    {
      id: "preview",
      label: problemAuthoringCopy.previewLabel,
      icon: RemoveRedEyeOutlinedIcon,
      onClick: () => setPreviewOpen(true),
    },
  ];

  useEffect(() => {
    if (!problemQuery.data) {
      return;
    }

    if (initializedProblemIdRef.current === problemQuery.data.id) {
      return;
    }

    queueMicrotask(() => {
      setMetadataValues({
        title: problemQuery.data.title,
        difficulty: problemQuery.data.difficulty,
        points: String(problemQuery.data.points),
        judgeProblemId: problemQuery.data.judgeProblemId,
        tags: problemQuery.data.tags,
        source: problemQuery.data.source,
      });
      setStatementValues({
        statement: problemQuery.data.statement,
        inputFormat: problemQuery.data.inputFormat,
        outputFormat: problemQuery.data.outputFormat,
        constraints: problemQuery.data.constraints,
      });
      setExamples(problemQuery.data.examples[0] ? [problemQuery.data.examples[0]] : problemExamplesDraft);
      setStarterCodes(problemQuery.data.starterCodes);

      const firstFilledLanguage =
        (Object.entries(problemQuery.data.starterCodes).find(([, code]) => code.trim())?.[0] as
          | StarterLanguage
          | undefined) ?? "typescript";

      setBaseLanguage(firstFilledLanguage);
      setActiveLanguage(firstFilledLanguage);
      initializedProblemIdRef.current = problemQuery.data.id;
    });
  }, [problemQuery.data]);

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    initializedProblemIdRef.current = null;

    queueMicrotask(() => {
      setActiveTab("metadata");
      setMetadataValues(problemMetadataDraft);
      setStatementValues(problemStatementDraft);
      setExamples(problemExamplesDraft);
      setStarterCodes(starterCodeDraft);
      setBaseLanguage("typescript");
      setActiveLanguage("typescript");
      setGenerationFeedback(null);
      setGenerationError(null);
      setSaveError(null);
    });
  }, [isEditMode]);

  const difficultyLabel = useMemo(() => {
    return (
      DIFFICULTY_OPTIONS.find((option) => option.value === metadataValues.difficulty)?.label ??
      "Medium"
    );
  }, [metadataValues.difficulty]);

  const sourceLabel = useMemo(() => {
    return (
      PROBLEM_SOURCE_OPTIONS.find((option) => option.value === metadataValues.source)?.label ??
      "Public (Practice + Contests)"
    );
  }, [metadataValues.source]);

  const completedExamplesCount = useMemo(() => {
    return examples.filter((example) => example.input.trim() && example.output.trim()).length;
  }, [examples]);

  const filledLanguages = useMemo(() => {
    return LANGUAGE_OPTIONS.filter((option) =>
      starterCodes[option.value as StarterLanguage].trim(),
    ).map((option) => option.value as StarterLanguage);
  }, [starterCodes]);

  const metadataComplete = Boolean(
    metadataValues.title.trim() &&
      metadataValues.points.trim() &&
      metadataValues.source.trim() &&
      metadataValues.difficulty.trim(),
  );
  const statementComplete = Boolean(
    statementValues.statement.trim() &&
      statementValues.inputFormat.trim() &&
      statementValues.outputFormat.trim() &&
      statementValues.constraints.trim(),
  );
  const examplesComplete = completedExamplesCount > 0;
  const starterCodeComplete = filledLanguages.length === LANGUAGE_OPTIONS.length;

  const completedByTab: Record<ProblemTab, boolean> = {
    metadata: metadataComplete,
    statement: statementComplete,
    examples: examplesComplete,
    "starter-code": starterCodeComplete,
  };

  const previewTitle = metadataValues.title.trim() || "Untitled Problem";
  const previewDifficulty = difficultyLabel;
  const previewPoints = metadataValues.points.trim() || "0";
  const activeCode = starterCodes[activeLanguage];
  const tagSummary = metadataValues.tags.join(", ");
  const tagPopoverOpen = Boolean(tagAnchorEl);
  const starterProgress = `${(filledLanguages.length / LANGUAGE_OPTIONS.length) * 100}%`;
  const draftProblems = (draftProblemsQuery.data ?? []) as ProblemDraftListItem[];
  const pageTitle = isEditMode ? "Edit Problem" : problemAuthoringCopy.pageTitle;
  const pageSubtitle = isEditMode
    ? "Update an existing competitive programming problem"
    : problemAuthoringCopy.pageSubtitle;
  const publishLabel = isEditMode ? "Save Changes" : problemAuthoringCopy.publishLabel;
  const isSaving = createProblemMutation.isPending || updateProblemMutation.isPending;
  const pageError =
    saveError ?? problemQuery.error?.message ?? draftProblemsQuery.error?.message ?? null;
  const isPageLoading = isEditMode && problemQuery.isLoading && !problemQuery.data;

  const updateMetadataField = (field: keyof ProblemMetadataDraft, value: string) => {
    setMetadataValues((prev) => ({ ...prev, [field]: value }));
  };

  const updateStatementField = (field: keyof ProblemStatementDraft, value: string) => {
    setStatementValues((prev) => ({ ...prev, [field]: value }));
  };

  const updateExampleField = (
    id: string,
    field: keyof Omit<ProblemExampleDraft, "id">,
    value: string,
  ) => {
    setExamples((prev) =>
      prev.map((example) => (example.id === id ? { ...example, [field]: value } : example)),
    );
  };

  const updateStarterCode = (language: StarterLanguage, value: string) => {
    setStarterCodes((prev) => ({ ...prev, [language]: value }));
  };

  const goToTab = (tab: ProblemTab) => {
    setActiveTab(tab);
  };

  const goToNextTab = () => {
    const currentIndex = stepOrder.indexOf(activeTab);
    const nextTab = stepOrder[currentIndex + 1];

    if (nextTab) {
      setActiveTab(nextTab);
    }
  };

  const goToPreviousTab = () => {
    const currentIndex = stepOrder.indexOf(activeTab);
    const previousTab = stepOrder[currentIndex - 1];

    if (previousTab) {
      setActiveTab(previousTab);
    }
  };

  const toggleTag = (tag: string) => {
    setMetadataValues((prev) => {
      const nextTags = prev.tags.includes(tag)
        ? prev.tags.filter((item) => item !== tag)
        : [...prev.tags, tag];

      return { ...prev, tags: nextTags };
    });
  };

  const handleCsvSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      return;
    }

    setSelectedCsvName(nextFile.name);
  };

  const handleCsvDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const nextFile = event.dataTransfer.files?.[0];

    if (!nextFile) {
      return;
    }

    setSelectedCsvName(nextFile.name);
  };

  const generateOtherLanguages = async () => {
    const baseCode = starterCodes[baseLanguage].trim();

    if (!baseCode) {
      setGenerationFeedback(null);
      setGenerationError("Add starter code in the base language before generating.");
      return;
    }

    setGenerationFeedback(null);
    setGenerationError(null);

    try {
      const result = await generateStarterCodesMutation.mutateAsync({
        title: metadataValues.title,
        statement: statementValues.statement,
        inputFormat: statementValues.inputFormat,
        outputFormat: statementValues.outputFormat,
        constraints: statementValues.constraints,
        baseLanguage: baseLanguage as "cplusplus" | "java" | "typescript" | "javascript" | "python",
        baseCode,
      });

      setStarterCodes((prev) => ({
        ...prev,
        ...(result.generatedCodes as typeof prev),
      }));
      setGenerationFeedback(
        `Generated ${Object.keys(result.generatedCodes).length} languages with ${result.model}.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate starter code.";
      setGenerationError(message);
    }
  };

  const downloadTemplate = () => {
    const csvTemplate = [
      "title,difficulty,points,tags,statement,inputFormat,outputFormat,constraints,visibility",
      '"Two Sum",medium,100,"arrays|hash-table","Find two indices that sum to target","n target\\nnums[]","i j","1 <= n <= 10^5","course-only"',
    ].join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "problem-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleEditDraftProblem = (draftProblemId: string) => {
    router.push(`${ROUTES.instructorCreateProblem}?problemId=${draftProblemId}`);
  };

  const handleDeleteDraftProblem = async (draftProblemId: string) => {
    setSaveError(null);

    try {
      await deleteDraftMutation.mutateAsync({
        problemId: draftProblemId,
        manageStatus: "DELETED",
      });

      if (problemId === draftProblemId) {
        router.push(ROUTES.instructorCreateProblem);
      }
    } catch {
      // Error state is handled by the mutation onError callback.
    }
  };

  const buildProblemMutationData = (points: number, isDraft: boolean) => ({
    title: metadataValues.title,
    difficulty: metadataValues.difficulty as "easy" | "medium" | "hard",
    points,
    judgeProblemId: metadataValues.judgeProblemId,
    tags: metadataValues.tags,
    isDraft,
    source: metadataValues.source as "contest-only" | "public",
    statement: statementValues.statement,
    inputFormat: statementValues.inputFormat,
    outputFormat: statementValues.outputFormat,
    constraints: statementValues.constraints,
    examples: examples.slice(0, 1),
    starterCodes,
  });

  const invalidateProblemAuthoringData = async (targetProblemId?: string) => {
    await Promise.all([
      utils.instructorManageContent.getManageContent.invalidate(),
      utils.instructorManageContent.getInstructorOverview.invalidate(),
      utils.problemAuthoring.listDraftProblems.invalidate(),
      targetProblemId
        ? utils.problemAuthoring.getProblemById.invalidate({ problemId: targetProblemId })
        : Promise.resolve(),
    ]);
  };

  const handlePublish = async () => {
    const points = Number.parseInt(metadataValues.points, 10);

    if (!Number.isFinite(points) || points < 0) {
      setSaveError("Points must be a non-negative integer.");
      return;
    }

    setSaveError(null);

    try {
      const mutationData = buildProblemMutationData(points, false);

      if (isEditMode && problemId) {
        await updateProblemMutation.mutateAsync({ problemId, data: mutationData });
      } else {
        await createProblemMutation.mutateAsync(mutationData);
      }

      await invalidateProblemAuthoringData(problemId ?? undefined);

      router.push(ROUTES.instructorManageContests);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save the problem.");
    }
  };

  const handleSaveDraft = async () => {
    if (!metadataValues.title.trim()) {
      setSaveError("Problem title is required to save a draft.");
      return;
    }

    const points = Number.parseInt(metadataValues.points, 10);
    if (!Number.isFinite(points) || points < 0) {
      setSaveError("Points must be a non-negative integer.");
      return;
    }

    setSaveError(null);

    try {
      const mutationData = buildProblemMutationData(points, true);

      if (isEditMode && problemId) {
        await updateProblemMutation.mutateAsync({ problemId, data: mutationData });
        await invalidateProblemAuthoringData(problemId);
      } else {
        await createProblemMutation.mutateAsync(mutationData);
        await invalidateProblemAuthoringData();
      }

      router.push(ROUTES.instructorManageContests);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save draft.");
    }
  };

  return (
    <>
      <AuthoringPageShell
        onBack={() => router.back()}
        backLabel={problemAuthoringCopy.backButtonLabel}
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
              <Typography
                className={`${styles.generationFeedback} ${styles.generationFeedbackError}`}
              >
                {pageError}
              </Typography>
            ) : null}

            <Card className={styles.card} elevation={0}>
              <CardContent className={styles.cardContent}>
                {isPageLoading ? (
                  <Box display="flex" justifyContent="center" py={6}>
                    <CircularProgress size={28} />
                  </Box>
                ) : null}

                <InstructorCreateProblemForm
                  activeTab={activeTab} completedByTab={completedByTab}
                  metadataValues={metadataValues} statementValues={statementValues}
                  examples={examples} starterCodes={starterCodes}
                  baseLanguage={baseLanguage} activeLanguage={activeLanguage}
                  activeCode={activeCode} tagSummary={tagSummary}
                  filledLanguages={filledLanguages} starterProgress={starterProgress}
                  generationError={generationError} generationFeedback={generationFeedback}
                  isSaving={isSaving} isPageLoading={isPageLoading} publishLabel={publishLabel}
                  isGeneratingStarterCodes={generateStarterCodesMutation.isPending}
                  onTabChange={goToTab} onMetadataChange={updateMetadataField}
                  onStatementChange={updateStatementField} onExampleChange={updateExampleField}
                  onStarterCodeChange={updateStarterCode} onBaseLanguageChange={setBaseLanguage}
                  onActiveLanguageChange={setActiveLanguage} onOpenTagSelector={setTagAnchorEl}
                  onGenerateOtherLanguages={() => void generateOtherLanguages()}
                  onNext={goToNextTab} onPrevious={goToPreviousTab} onPublish={() => void handlePublish()}
                />
              </CardContent>
            </Card>

            <InstructorCreateProblemDraftsCard
              draftProblems={draftProblems}
              isLoading={draftProblemsQuery.isLoading}
              onEditDraft={handleEditDraftProblem}
              onDeleteDraft={(draftProblemId) => void handleDeleteDraftProblem(draftProblemId)}
            />
          </>
        }
        sidebar={
          <InstructorCreateProblemStatusSidebar
            metadataValues={metadataValues} sourceLabel={sourceLabel}
            difficultyLabel={difficultyLabel} completedExamplesCount={completedExamplesCount}
            filledLanguages={filledLanguages} isEditMode={isEditMode}
            isSaving={isSaving} isPageLoading={isPageLoading} publishLabel={publishLabel}
            problemStatus={problemQuery.data ? {
              isDraft: problemQuery.data.isDraft,
              manageStatus: problemQuery.data.manageStatus,
            } : undefined}
            onPublish={() => void handlePublish()}
          />
        }
      />

      <InstructorCreateProblemDialogs
        previewOpen={previewOpen} csvOpen={csvOpen} tagPopoverOpen={tagPopoverOpen}
        tagAnchorEl={tagAnchorEl} metadataValues={metadataValues} statementValues={statementValues}
        examples={examples} previewTitle={previewTitle} previewDifficulty={previewDifficulty}
        previewPoints={previewPoints} selectedCsvName={selectedCsvName} fileInputRef={fileInputRef}
        onPreviewClose={() => setPreviewOpen(false)} onCsvClose={() => setCsvOpen(false)}
        onTagPopoverClose={() => setTagAnchorEl(null)} onToggleTag={toggleTag}
        onCsvDrop={handleCsvDrop} onCsvSelection={handleCsvSelection}
        onDownloadTemplate={downloadTemplate}
      />
    </>
  );
}
