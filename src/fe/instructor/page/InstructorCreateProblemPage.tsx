"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  MenuItem,
  Popover,
  TextField,
  Typography,
} from "@mui/material";

import DraftRecordItem from "@/fe/instructor/components/DraftRecordItem";
import StatusSummaryCard, {
  type StatusSummaryRow,
} from "@/fe/instructor/components/StatusSummaryCard";
import SubpageActionButtons, {
  type SubpageActionButtonItem,
} from "@/fe/instructor/components/SubpageActionButtons";
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
import AuthoringStepTabs from "@/fe/shared/components/authoring/AuthoringStepTabs";
import { ROUTES } from "@/fe/shared/constants/routes";
import { DIFFICULTY_OPTIONS, LANGUAGE_OPTIONS, PROBLEM_SOURCE_OPTIONS, PROBLEM_TAG_GROUPS } from "@/fe/shared/constants/options";
import { trpc } from "@/lib/trpc/client";
import subpageStyles from "@/fe/instructor/styles/InstructorSubpageHeader.module.css";
import styles from "@/fe/instructor/styles/InstructorCreateProblemPage.module.css";

type ProblemTab = (typeof problemAuthoringTabs)[number]["value"];

const stepOrder: ProblemTab[] = ["metadata", "statement", "examples", "starter-code"];

const difficultyBadgeStyles = {
  easy: { backgroundColor: "#ecfdf3", color: "#027a48" },
  medium: { backgroundColor: "#dc2626", color: "#ffffff" },
  hard: { backgroundColor: "#b91c1c", color: "#ffffff" },
} as const;

const draftDifficultyChipColors = {
  easy: { background: "#eceef2", color: "#030213" },
  medium: { background: "#dc2626", color: "#ffffff" },
  hard: { background: "#b91c1c", color: "#ffffff" },
} as const;

function formatDraftUpdatedAt(isoValue: string) {
  const date = new Date(isoValue);

  if (Number.isNaN(date.getTime())) {
    return isoValue;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

interface ProblemDraftListItem {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  updatedAt: string;
  examplesCount: number;
  starterCodesCount: number;
}

export default function InstructorCreateProblemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initializedProblemIdRef = useRef<string | null>(null);
  const utils = trpc.useUtils();
  const problemId = searchParams.get("problemId");
  const isEditMode = Boolean(problemId);

  const [activeTab, setActiveTab] = useState<ProblemTab>("metadata");
  const [metadataValues, setMetadataValues] =
    useState<ProblemMetadataDraft>(problemMetadataDraft);
  const [statementValues, setStatementValues] =
    useState<ProblemStatementDraft>(problemStatementDraft);
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

  const problemStatusRows: StatusSummaryRow[] = [
    {
      id: "status",
      label: "Status",
      value: (
        <Chip
          label={
            isEditMode
              ? problemQuery.data?.isDraft
                ? "Draft"
                : problemQuery.data?.manageStatus === "archived"
                  ? "Archived"
                  : "Active"
              : problemAuthoringCopy.statusNewLabel
          }
          size="small"
          className={styles.statusChip}
        />
      ),
    },
    {
      id: "visibility",
      label: "Visibility",
      value: <Chip label={sourceLabel} size="small" className={styles.visibilityChip} />,
    },
    {
      id: "difficulty",
      label: "Difficulty",
      value: (
        <Chip
          label={difficultyLabel.toLowerCase()}
          size="small"
          className={styles.difficultyChip}
          sx={difficultyBadgeStyles[metadataValues.difficulty as keyof typeof difficultyBadgeStyles]}
        />
      ),
    },
    {
      id: "points",
      label: "Points",
      value: <Typography className={styles.statusValue}>{metadataValues.points}</Typography>,
    },
    {
      id: "examples",
      label: problemAuthoringCopy.examplesCountLabel,
      value: <Typography className={styles.statusValue}>{completedExamplesCount}</Typography>,
    },
    {
      id: "test-cases",
      label: problemAuthoringCopy.testCasesCountLabel,
      value: (
        <Typography className={styles.statusValue}>
          {`0${problemAuthoringCopy.testCasesNoneSuffix}`}
        </Typography>
      ),
    },
    {
      id: "starter-code",
      label: "Starter Code",
      value: (
        <Typography className={styles.statusMutedValue}>
          {`${filledLanguages.length} / ${LANGUAGE_OPTIONS.length}`}
        </Typography>
      ),
    },
  ];

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

  const handlePublish = async () => {
    const points = Number.parseInt(metadataValues.points, 10);

    if (!Number.isFinite(points) || points < 0) {
      setSaveError("Points must be a non-negative integer.");
      return;
    }

    setSaveError(null);

    try {
      if (isEditMode && problemId) {
        await updateProblemMutation.mutateAsync({
          problemId,
          data: {
            title: metadataValues.title,
            difficulty: metadataValues.difficulty as "easy" | "medium" | "hard",
            points,
            judgeProblemId: metadataValues.judgeProblemId,
            tags: metadataValues.tags,
            isDraft: false,
            source: metadataValues.source as "contest-only" | "public",
            statement: statementValues.statement,
            inputFormat: statementValues.inputFormat,
            outputFormat: statementValues.outputFormat,
            constraints: statementValues.constraints,
            examples: examples.slice(0, 1),
            starterCodes,
          },
        });
      } else {
        await createProblemMutation.mutateAsync({
          title: metadataValues.title,
          difficulty: metadataValues.difficulty as "easy" | "medium" | "hard",
          points,
          judgeProblemId: metadataValues.judgeProblemId,
          tags: metadataValues.tags,
          isDraft: false,
          source: metadataValues.source as "contest-only" | "public",
          statement: statementValues.statement,
          inputFormat: statementValues.inputFormat,
          outputFormat: statementValues.outputFormat,
          constraints: statementValues.constraints,
          examples: examples.slice(0, 1),
          starterCodes,
        });
      }

      await Promise.all([
        utils.instructorManageContent.getManageContent.invalidate(),
        utils.instructorManageContent.getInstructorOverview.invalidate(),
        utils.problemAuthoring.listDraftProblems.invalidate(),
        utils.problemAuthoring.getProblemById.invalidate({ problemId: problemId ?? "" }),
      ]);

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
      if (isEditMode && problemId) {
        await updateProblemMutation.mutateAsync({
          problemId,
          data: {
            title: metadataValues.title,
            difficulty: metadataValues.difficulty as "easy" | "medium" | "hard",
            points,
            judgeProblemId: metadataValues.judgeProblemId,
            tags: metadataValues.tags,
            isDraft: true,
            source: metadataValues.source as "contest-only" | "public",
            statement: statementValues.statement,
            inputFormat: statementValues.inputFormat,
            outputFormat: statementValues.outputFormat,
            constraints: statementValues.constraints,
            examples: examples.slice(0, 1),
            starterCodes,
          },
        });
        await Promise.all([
          utils.instructorManageContent.getManageContent.invalidate(),
          utils.instructorManageContent.getInstructorOverview.invalidate(),
          utils.problemAuthoring.listDraftProblems.invalidate(),
          utils.problemAuthoring.getProblemById.invalidate({ problemId }),
        ]);
        router.push(ROUTES.instructorManageContests);
      } else {
        await createProblemMutation.mutateAsync({
          title: metadataValues.title,
          difficulty: metadataValues.difficulty as "easy" | "medium" | "hard",
          points,
          judgeProblemId: metadataValues.judgeProblemId,
          tags: metadataValues.tags,
          isDraft: true,
          source: metadataValues.source as "contest-only" | "public",
          statement: statementValues.statement,
          inputFormat: statementValues.inputFormat,
          outputFormat: statementValues.outputFormat,
          constraints: statementValues.constraints,
          examples: examples.slice(0, 1),
          starterCodes,
        });
        await Promise.all([
          utils.instructorManageContent.getManageContent.invalidate(),
          utils.instructorManageContent.getInstructorOverview.invalidate(),
          utils.problemAuthoring.listDraftProblems.invalidate(),
        ]);
        router.push(ROUTES.instructorManageContests);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save draft.");
    }
  };

  const problemStatusFooter = (
    <Box className={styles.supportedLanguagesSection}>
      <Typography className={styles.supportedLanguagesTitle}>
        {problemAuthoringCopy.supportedLanguagesLabel}
      </Typography>
      <Box className={styles.supportedLanguagesList}>
        {LANGUAGE_OPTIONS.map((option) => {
          const language = option.value as StarterLanguage;
          const isFilled = filledLanguages.includes(language);

          return (
            <span key={language} className={styles.supportedLanguagePill}>
              <span
                className={`${styles.supportedLanguageDot} ${isFilled ? styles.supportedLanguageDotFilled : ""}`}
              />
              {option.label}
            </span>
          );
        })}
      </Box>
    </Box>
  );

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

                <AuthoringStepTabs
                  value={activeTab}
                  tabs={problemAuthoringTabs.map((tab) => ({
                    ...tab,
                    completed: completedByTab[tab.value],
                  }))}
                  onChange={(value) => goToTab(value as ProblemTab)}
                />

                {activeTab === "metadata" ? (
                  <Box className={styles.formFields}>
                    <Box className={styles.fieldBlock}>
                      <Typography className={styles.fieldLabel}>Problem Title *</Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g., Two Sum"
                        value={metadataValues.title}
                        onChange={(event) => updateMetadataField("title", event.target.value)}
                        className={styles.inputField}
                      />
                    </Box>

                    <Box className={styles.twoColumnGrid}>
                      <Box className={styles.fieldBlock}>
                        <Typography className={styles.fieldLabel}>Difficulty *</Typography>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          value={metadataValues.difficulty}
                          onChange={(event) => updateMetadataField("difficulty", event.target.value)}
                          className={styles.inputField}
                          SelectProps={{ IconComponent: KeyboardArrowDownRoundedIcon }}
                        >
                          {DIFFICULTY_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Box>

                      <Box className={styles.fieldBlock}>
                        <Typography className={styles.fieldLabel}>Points *</Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={metadataValues.points}
                          onChange={(event) => updateMetadataField("points", event.target.value)}
                          className={styles.inputField}
                        />
                      </Box>
                    </Box>

                    <Box className={styles.fieldBlock}>
                      <Typography className={styles.fieldLabel}>Judge Problem ID</Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g., 1036"
                        value={metadataValues.judgeProblemId}
                        onChange={(event) =>
                          updateMetadataField(
                            "judgeProblemId",
                            event.target.value.replace(/[^\d]/g, ""),
                          )
                        }
                        className={styles.inputField}
                      />
                    </Box>

                    <Box className={styles.fieldBlock}>
                      <Typography className={styles.fieldLabel}>Tags</Typography>
                      <Box className={styles.tagInputRow}>
                        <TextField
                          fullWidth
                          size="small"
                          value={tagSummary}
                          placeholder="Type a tag, use commas for multiple"
                          className={styles.inputField}
                          InputProps={{ readOnly: true }}
                        />
                        <Button
                          className={styles.addTagButton}
                          aria-label="Select tags"
                          onClick={(event) => setTagAnchorEl(event.currentTarget)}
                        >
                          <AddRoundedIcon className={styles.addTagIcon} />
                        </Button>
                      </Box>
                    </Box>

                    <Box className={styles.fieldBlock}>
                      <Typography className={styles.fieldLabel}>Problem Type *</Typography>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={metadataValues.source}
                        onChange={(event) => updateMetadataField("source", event.target.value)}
                        className={styles.inputField}
                        SelectProps={{ IconComponent: KeyboardArrowDownRoundedIcon }}
                      >
                        {PROBLEM_SOURCE_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>

                    <Box className={styles.stepActionsRowEnd}>
                      <Button
                        className={styles.primaryStepButton}
                        variant="contained"
                        endIcon={<ArrowForwardRoundedIcon className={styles.actionIcon} />}
                        disabled={isSaving || isPageLoading}
                        onClick={goToNextTab}
                      >
                        {problemAuthoringCopy.nextStatementLabel}
                      </Button>
                    </Box>
                  </Box>
                ) : null}

                {activeTab === "statement" ? (
                  <Box className={styles.formFields}>
                    <Box className={styles.fieldBlock}>
                      <Typography className={styles.fieldLabel}>Problem Statement *</Typography>
                      <TextField
                        fullWidth
                        multiline
                        minRows={5}
                        placeholder="Describe the problem clearly..."
                        value={statementValues.statement}
                        onChange={(event) => updateStatementField("statement", event.target.value)}
                        className={`${styles.inputField} ${styles.textAreaField} ${styles.codeText}`}
                      />
                      <Typography className={styles.fieldHint}>
                        {problemAuthoringCopy.statementMarkdownHint}
                      </Typography>
                    </Box>

                    <Box className={styles.fieldBlock}>
                      <Typography className={styles.fieldLabel}>Input Format *</Typography>
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        placeholder="Describe the input format..."
                        value={statementValues.inputFormat}
                        onChange={(event) => updateStatementField("inputFormat", event.target.value)}
                        className={`${styles.inputField} ${styles.textAreaField} ${styles.codeText}`}
                      />
                    </Box>

                    <Box className={styles.fieldBlock}>
                      <Typography className={styles.fieldLabel}>Output Format *</Typography>
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        placeholder="Describe the output format..."
                        value={statementValues.outputFormat}
                        onChange={(event) =>
                          updateStatementField("outputFormat", event.target.value)
                        }
                        className={`${styles.inputField} ${styles.textAreaField} ${styles.codeText}`}
                      />
                    </Box>

                    <Box className={styles.fieldBlock}>
                      <Typography className={styles.fieldLabel}>Constraints *</Typography>
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        placeholder="e.g., 1 ≤ n ≤ 10^5"
                        value={statementValues.constraints}
                        onChange={(event) => updateStatementField("constraints", event.target.value)}
                        className={`${styles.inputField} ${styles.textAreaField} ${styles.codeText}`}
                      />
                    </Box>

                    <Box className={styles.stepActionsRow}>
                      <Button className={styles.secondaryStepButton} onClick={goToPreviousTab}>
                        {`← ${problemAuthoringCopy.backMetadataLabel}`}
                      </Button>
                      <Button
                        className={styles.primaryStepButton}
                        variant="contained"
                        endIcon={<ArrowForwardRoundedIcon className={styles.actionIcon} />}
                        disabled={isSaving || isPageLoading}
                        onClick={goToNextTab}
                      >
                        {problemAuthoringCopy.nextExamplesLabel}
                      </Button>
                    </Box>
                  </Box>
                ) : null}

                {activeTab === "examples" ? (
                  <Box className={styles.formFields}>
                    <Box className={styles.infoBanner}>
                      <Typography className={styles.infoBannerText}>
                        {problemAuthoringCopy.examplesInfoBanner}
                      </Typography>
                    </Box>

                    <Box className={styles.exampleStack}>
                      {examples.map((example, index) => (
                        <Box key={example.id} className={styles.exampleCard}>
                          <Typography className={styles.exampleTitle}>{`Example ${index + 1}`}</Typography>

                          <Box className={styles.fieldBlock}>
                            <Typography className={styles.fieldLabel}>Input</Typography>
                            <TextField
                              fullWidth
                              multiline
                              minRows={2}
                              placeholder={"4 9\n2 7 11 15"}
                              value={example.input}
                              onChange={(event) =>
                                updateExampleField(example.id, "input", event.target.value)
                              }
                              className={`${styles.inputField} ${styles.textAreaField} ${styles.codeText}`}
                            />
                          </Box>

                          <Box className={styles.fieldBlock}>
                            <Typography className={styles.fieldLabel}>Output</Typography>
                            <TextField
                              fullWidth
                              multiline
                              minRows={2}
                              placeholder="0 1"
                              value={example.output}
                              onChange={(event) =>
                                updateExampleField(example.id, "output", event.target.value)
                              }
                              className={`${styles.inputField} ${styles.textAreaField} ${styles.codeText}`}
                            />
                          </Box>

                          <Box className={styles.fieldBlock}>
                            <Typography className={styles.fieldLabel}>Explanation (Optional)</Typography>
                            <TextField
                              fullWidth
                              multiline
                              minRows={2}
                              placeholder="Explain why this output is correct..."
                              value={example.explanation}
                              onChange={(event) =>
                                updateExampleField(example.id, "explanation", event.target.value)
                              }
                              className={`${styles.inputField} ${styles.textAreaField}`}
                            />
                          </Box>
                        </Box>
                      ))}
                    </Box>

                    <Box className={styles.stepActionsRow}>
                      <Button className={styles.secondaryStepButton} onClick={goToPreviousTab}>
                        {`← ${problemAuthoringCopy.backStatementLabel}`}
                      </Button>
                      <Button
                        className={styles.primaryStepButton}
                        variant="contained"
                        endIcon={<ArrowForwardRoundedIcon className={styles.actionIcon} />}
                        disabled={isSaving || isPageLoading}
                        onClick={goToNextTab}
                      >
                        {problemAuthoringCopy.nextStarterCodeLabel}
                      </Button>
                    </Box>
                  </Box>
                ) : null}

                {activeTab === "starter-code" ? (
                  <Box className={styles.formFields}>
                    <Box className={styles.sectionIntro}>
                      <Typography className={styles.sectionTitle}>
                        {problemAuthoringCopy.starterCodeTitle}
                      </Typography>
                      <Typography className={styles.sectionDescription}>
                        {problemAuthoringCopy.starterCodeDescription}
                      </Typography>
                    </Box>

                    <Box className={styles.generatePanel}>
                      <Typography className={styles.fieldLabel}>
                        {problemAuthoringCopy.baseLanguageLabel}
                      </Typography>
                      <Box className={styles.generateRow}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          value={baseLanguage}
                          onChange={(event) => {
                            const lang = event.target.value as StarterLanguage;
                            setBaseLanguage(lang);
                            setActiveLanguage(lang);
                          }}
                          className={styles.inputField}
                          SelectProps={{ IconComponent: KeyboardArrowDownRoundedIcon }}
                        >
                          {LANGUAGE_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>
                        <Button
                          className={styles.generateButton}
                          variant="contained"
                          startIcon={<AutoAwesomeRoundedIcon className={styles.actionIcon} />}
                          onClick={generateOtherLanguages}
                          disabled={generateStarterCodesMutation.isPending}
                        >
                          {generateStarterCodesMutation.isPending
                            ? "Generating..."
                            : problemAuthoringCopy.generateOtherLanguagesLabel}
                        </Button>
                      </Box>
                      <Typography className={styles.fieldHint}>
                        {problemAuthoringCopy.baseLanguageHint}
                      </Typography>
                    </Box>

                    {generationError ? (
                      <Typography
                        className={`${styles.generationFeedback} ${styles.generationFeedbackError}`}
                      >
                        {generationError}
                      </Typography>
                    ) : generationFeedback ? (
                      <Typography
                        className={`${styles.generationFeedback} ${styles.generationFeedbackSuccess}`}
                      >
                        {generationFeedback}
                      </Typography>
                    ) : null}

                    <Box className={styles.codeEditorCard}>
                      <Box className={styles.codeTabs}>
                        {LANGUAGE_OPTIONS.map((option) => {
                          const language = option.value as StarterLanguage;
                          const isActive = activeLanguage === language;
                          const isFilled = Boolean(starterCodes[language].trim());

                          return (
                            <button
                              key={option.value}
                              type="button"
                              className={`${styles.codeTab} ${isActive ? styles.codeTabActive : ""}`}
                              onClick={() => setActiveLanguage(language)}
                            >
                              <span
                                className={`${styles.codeTabDot} ${isFilled ? styles.codeTabDotFilled : ""}`}
                              />
                              {option.label}
                            </button>
                          );
                        })}
                      </Box>

                      <TextField
                        fullWidth
                        multiline
                        minRows={12}
                        value={activeCode}
                        onChange={(event) => updateStarterCode(activeLanguage, event.target.value)}
                        className={`${styles.codeEditorField} ${styles.codeText}`}
                      />

                      <Box className={styles.codeEditorFooter}>
                        <Typography className={styles.codeEditorLanguageLabel}>
                          {LANGUAGE_OPTIONS.find((option) => option.value === activeLanguage)?.label}
                        </Typography>
                        <Typography className={styles.codeEditorStatus}>
                          {activeCode.trim() ? "Filled" : "Empty"}
                        </Typography>
                      </Box>
                    </Box>

                    <Box className={styles.starterChecklist}>
                      {problemAuthoringCopy.starterCodeChecklist.map((item) => (
                        <Typography key={item} className={styles.starterChecklistItem}>
                          {`• ${item}`}
                        </Typography>
                      ))}
                    </Box>

                    <Box className={styles.starterProgressRow}>
                      <span className={styles.starterProgressTrack}>
                        <span className={styles.starterProgressFill} style={{ width: starterProgress }} />
                      </span>
                      <Typography className={styles.starterProgressText}>
                        {`${filledLanguages.length} / ${LANGUAGE_OPTIONS.length} languages filled`}
                      </Typography>
                    </Box>

                    <Box className={styles.stepActionsRow}>
                      <Button className={styles.secondaryStepButton} onClick={goToPreviousTab}>
                        {`← ${problemAuthoringCopy.backExamplesLabel}`}
                      </Button>
                      <Button
                        className={styles.primaryStepButton}
                        variant="contained"
                        disabled={isSaving || isPageLoading}
                        onClick={() => void handlePublish()}
                      >
                        {isSaving ? "Saving..." : publishLabel}
                      </Button>
                    </Box>
                  </Box>
                ) : null}
              </CardContent>
            </Card>

            <Card className={styles.card} elevation={0}>
              <CardContent className={styles.draftsCardContent}>
                <Box className={styles.draftsHeader}>
                  <SaveOutlinedIcon className={styles.draftsHeaderIcon} />
                  <Box>
                    <Typography className={styles.draftsTitle}>
                      {problemAuthoringCopy.myDraftsTitle}
                    </Typography>
                    <Typography className={styles.draftsSubtitle}>
                      {problemAuthoringCopy.myDraftsDescription}
                    </Typography>
                  </Box>
                </Box>

                <Box className={styles.draftsList}>
                  {draftProblemsQuery.isLoading && draftProblems.length === 0 ? (
                    <Typography className={styles.sectionDescription}>
                      Loading problem drafts...
                    </Typography>
                  ) : draftProblems.length === 0 ? (
                    <Typography className={styles.sectionDescription}>
                      No saved problem drafts yet.
                    </Typography>
                  ) : (
                    draftProblems.map((draft) => {
                      const difficultyChip = draftDifficultyChipColors[draft.difficulty];

                      return (
                        <DraftRecordItem
                          key={draft.id}
                          title={draft.title}
                          topMeta={
                            <Box className={styles.draftMetaRow}>
                              <Chip
                                size="small"
                                label={draft.difficulty}
                                className={styles.draftDifficultyChip}
                                sx={{
                                  backgroundColor: difficultyChip.background,
                                  color: difficultyChip.color,
                                }}
                              />
                              <Typography className={styles.draftDate}>
                                {formatDraftUpdatedAt(draft.updatedAt)}
                              </Typography>
                            </Box>
                          }
                          bottomMeta={
                            <Typography className={styles.draftCounts}>
                              {`${draft.examplesCount} example(s)`}
                              {"   "}
                              {`${draft.starterCodesCount} starter language(s)`}
                            </Typography>
                          }
                          itemClassName={styles.draftItem}
                          mainClassName={styles.draftMain}
                          titleClassName={styles.draftTitle}
                          actionsClassName={styles.draftActions}
                          iconButtonClassName={styles.draftIconButton}
                          editIconClassName={styles.draftActionIcon}
                          deleteIconClassName={styles.draftActionIconDanger}
                          onEdit={() => handleEditDraftProblem(draft.id)}
                          onDelete={() => void handleDeleteDraftProblem(draft.id)}
                          editAriaLabel={`Edit draft ${draft.title}`}
                          deleteAriaLabel={`Delete draft ${draft.title}`}
                        />
                      );
                    })
                  )}
                </Box>
              </CardContent>
            </Card>
          </>
        }
        sidebar={
          <>
            <StatusSummaryCard
              title={problemAuthoringCopy.problemStatusTitle}
              rows={problemStatusRows}
              dividerAfterRowIds={["points", "starter-code"]}
              footer={problemStatusFooter}
              cardClassName={styles.card}
              contentClassName={styles.sideCardContent}
              titleClassName={styles.sideCardTitle}
              rowsContainerClassName={styles.statusRows}
              rowClassName={styles.statusRow}
              labelClassName={styles.statusLabel}
              dividerClassName={styles.statusDivider}
            />

            <Box className={styles.publishPanel}>
              <Button
                className={styles.publishButton}
                variant="contained"
                disabled={isSaving || isPageLoading}
                onClick={() => void handlePublish()}
              >
                {isSaving ? "Saving..." : publishLabel}
              </Button>
              <Typography className={styles.publishHint}>
                {problemAuthoringCopy.publishHint}
              </Typography>
            </Box>
          </>
        }
      />

      <Popover
        open={tagPopoverOpen}
        anchorEl={tagAnchorEl}
        onClose={() => setTagAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{ className: styles.tagPopoverPaper }}
      >
        <Box className={styles.tagPopover}>
          <Typography className={styles.tagPopoverHeading}>
            {`Select tags — ${metadataValues.tags.length} selected`}
          </Typography>
          {PROBLEM_TAG_GROUPS.map((group) => (
            <Box key={group.label} className={styles.tagGroup}>
              <Typography className={styles.tagGroupTitle}>{group.label}</Typography>
              <Box className={styles.tagChipList}>
                {group.tags.map((tag) => {
                  const isSelected = metadataValues.tags.includes(tag);

                  return (
                    <button
                      key={tag}
                      type="button"
                      className={`${styles.tagChipButton} ${isSelected ? styles.tagChipButtonSelected : ""}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Box>
      </Popover>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogContent className={styles.dialogContent}>
          <Box className={styles.dialogHeader}>
            <Box className={styles.dialogTitleWrap}>
              <DescriptionOutlinedIcon className={styles.dialogTitleIcon} />
              <Box>
                <Typography className={styles.dialogTitle}>
                  {problemAuthoringCopy.previewModalTitle}
                </Typography>
                <Typography className={styles.dialogSubtitle}>
                  {problemAuthoringCopy.previewModalSubtitle}
                </Typography>
              </Box>
            </Box>
            <IconButton
              className={styles.dialogCloseButton}
              onClick={() => setPreviewOpen(false)}
              aria-label="Close preview"
            >
              <CloseRoundedIcon className={styles.dialogCloseIcon} />
            </IconButton>
          </Box>

          <Box className={styles.previewContent}>
            <Typography className={styles.previewTitle}>{previewTitle}</Typography>

            <Box className={styles.previewMetaRow}>
              <Chip
                label={previewDifficulty}
                size="small"
                className={styles.previewDifficultyChip}
                sx={difficultyBadgeStyles[metadataValues.difficulty as keyof typeof difficultyBadgeStyles]}
              />
              <Chip label={`${previewPoints} pts`} size="small" className={styles.previewMetaChip} />
            </Box>

            {metadataValues.tags.length ? (
              <Box className={styles.previewTagRow}>
                {metadataValues.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" className={styles.previewTagChip} />
                ))}
              </Box>
            ) : null}

            <Box className={styles.previewSection}>
              <Typography className={styles.previewSectionTitle}>
                {problemAuthoringCopy.previewStatementTitle}
              </Typography>
              <Box className={styles.previewSurface}>
                <Typography className={styles.previewBodyText}>
                  {statementValues.statement || "No statement yet"}
                </Typography>
              </Box>
            </Box>

            <Box className={styles.previewTwoColumnGrid}>
              <Box className={styles.previewSection}>
                <Typography className={styles.previewSectionTitle}>
                  {problemAuthoringCopy.previewInputTitle}
                </Typography>
                <Box className={styles.previewSurface}>
                  <Typography className={`${styles.previewBodyText} ${styles.codeText}`}>
                    {statementValues.inputFormat || "-"}
                  </Typography>
                </Box>
              </Box>

              <Box className={styles.previewSection}>
                <Typography className={styles.previewSectionTitle}>
                  {problemAuthoringCopy.previewOutputTitle}
                </Typography>
                <Box className={styles.previewSurface}>
                  <Typography className={`${styles.previewBodyText} ${styles.codeText}`}>
                    {statementValues.outputFormat || "-"}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box className={styles.previewSection}>
              <Typography className={styles.previewSectionTitle}>
                {problemAuthoringCopy.previewConstraintsTitle}
              </Typography>
              <Box className={styles.previewSurface}>
                <Typography className={`${styles.previewBodyText} ${styles.codeText}`}>
                  {statementValues.constraints || "-"}
                </Typography>
              </Box>
            </Box>

            <Box className={styles.previewSection}>
              <Typography className={styles.previewSectionTitle}>
                {problemAuthoringCopy.previewExamplesTitle}
              </Typography>
              <Box className={styles.previewExamplesList}>
                {examples
                  .filter((example) => example.input.trim() && example.output.trim())
                  .slice(0, 3)
                  .map((example, index) => (
                    <Box key={example.id} className={styles.previewExampleCard}>
                      <Box className={styles.previewExampleHeader}>
                        <Typography className={styles.previewExampleLabel}>
                          {`Example ${index + 1}`}
                        </Typography>
                      </Box>
                      <Box className={styles.previewExampleGrid}>
                        <Box className={styles.previewExampleBlock}>
                          <Typography className={styles.previewExampleBlockLabel}>Input</Typography>
                          <Typography className={`${styles.previewBodyText} ${styles.codeText}`}>
                            {example.input}
                          </Typography>
                        </Box>
                        <Box className={styles.previewExampleBlock}>
                          <Typography className={styles.previewExampleBlockLabel}>Output</Typography>
                          <Typography className={`${styles.previewBodyText} ${styles.codeText}`}>
                            {example.output}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={csvOpen} onClose={() => setCsvOpen(false)} maxWidth="md" fullWidth>
        <DialogContent className={styles.dialogContent}>
          <Box className={styles.dialogHeader}>
            <Box>
              <Typography className={styles.dialogTitle}>
                {problemAuthoringCopy.importCsvTitle}
              </Typography>
              <Typography className={styles.dialogSubtitle}>
                {problemAuthoringCopy.importCsvSubtitle}
              </Typography>
            </Box>
            <IconButton
              className={styles.dialogCloseButton}
              onClick={() => setCsvOpen(false)}
              aria-label="Close import CSV dialog"
            >
              <CloseRoundedIcon className={styles.dialogCloseIcon} />
            </IconButton>
          </Box>

          <Box className={styles.csvFormatBanner}>
            <Typography className={styles.csvFormatTitle}>
              {problemAuthoringCopy.importCsvFormatTitle}
            </Typography>
            <Typography className={`${styles.csvFormatCode} ${styles.codeText}`}>
              {problemAuthoringCopy.importCsvColumnsExample}
            </Typography>
            <Typography className={styles.csvFormatLine}>
              <strong>{problemAuthoringCopy.importCsvRequiredColumnsLabel}</strong>
              {` ${problemAuthoringCopy.importCsvRequiredColumnsValue}`}
            </Typography>
            <Typography className={styles.csvFormatLine}>
              <strong>{problemAuthoringCopy.importCsvTagsFormatLabel}</strong>
              {` ${problemAuthoringCopy.importCsvTagsFormatValue}`}
            </Typography>
            <Typography className={styles.csvFormatLine}>
              <strong>{problemAuthoringCopy.importCsvComplexityLabel}</strong>
              {` ${problemAuthoringCopy.importCsvComplexityValue}`}
            </Typography>
          </Box>

          <Box
            className={styles.uploadDropzone}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleCsvDrop}
          >
            <UploadFileOutlinedIcon className={styles.uploadIcon} />
            <Button
              variant="outlined"
              className={styles.fileSelectButton}
              startIcon={<UploadFileOutlinedIcon className={styles.actionIcon} />}
              onClick={() => fileInputRef.current?.click()}
            >
              {problemAuthoringCopy.importCsvChooseFileLabel}
            </Button>
            <Typography className={styles.uploadHint}>
              {selectedCsvName || problemAuthoringCopy.importCsvDropLabel}
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              hidden
              onChange={handleCsvSelection}
            />
          </Box>

          <Box className={styles.templateRow}>
            <Typography className={styles.templatePrompt}>
              {problemAuthoringCopy.importCsvTemplatePrompt}
            </Typography>
            <Button
              className={styles.templateButton}
              startIcon={<DownloadRoundedIcon className={styles.actionIcon} />}
              onClick={downloadTemplate}
            >
              {problemAuthoringCopy.importCsvTemplateLabel}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
