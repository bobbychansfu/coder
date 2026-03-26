"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import RadioButtonCheckedRoundedIcon from "@mui/icons-material/RadioButtonCheckedRounded";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import ShuffleRoundedIcon from "@mui/icons-material/ShuffleRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  MenuItem,
  Switch,
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
  contestAiHintConfig,
  contestAuthoringCopy,
  contestDrafts,
  contestFormDraft,
  contestPreviewFallback,
  type ContestDifficulty,
  type ContestFormDraft,
  type ContestProblemRecord,
} from "@/fe/instructor/data/contestAuthoring";
import AuthoringPageShell from "@/fe/shared/components/authoring/AuthoringPageShell";
import { ROUTES } from "@/fe/shared/constants/routes";
import { VISIBILITY_OPTIONS } from "@/fe/shared/constants/options";
import { trpc } from "@/lib/trpc/client";
import subpageStyles from "@/fe/instructor/styles/InstructorSubpageHeader.module.css";
import styles from "@/fe/instructor/styles/InstructorCreateContestPage.module.css";

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

function formatStatusDate(dateValue: string) {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(`${dateValue}T00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-US").format(date);
}

function toVisibilityLabel(value: string) {
  return value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function formatProblemTags(problem: ContestProblemRecord) {
  return problem.tags.join(", ");
}

function getDifficultyBadgeClassName(difficulty: ContestDifficulty) {
  const toneClassMap: Record<ContestDifficulty, string> = {
    easy: styles.difficultyEasy,
    medium: styles.difficultyMedium,
    hard: styles.difficultyHard,
  };

  return `${styles.difficultyBadge} ${toneClassMap[difficulty]}`;
}

interface SelectableContestProblemRecord extends ContestProblemRecord {
  isDraft?: boolean;
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
  const createContestMutation = trpc.contestAuthoring.createContest.useMutation();
  const updateContestMutation = trpc.contestAuthoring.updateContest.useMutation();
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
        startDate: contestQuery.data.startDate,
        startTime: contestQuery.data.startTime,
        endDate: contestQuery.data.endDate,
        endTime: contestQuery.data.endTime,
        visibility: contestQuery.data.visibility,
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
      problemMap.set(problem.id, problem);
    });
    (contestQuery.data?.selectedProblems ?? []).forEach((problem) => {
      problemMap.set(problem.id, problem);
    });

    return Array.from(problemMap.values());
  }, [contestQuery.data?.selectedProblems, problemLibraryQuery.data]);

  const selectedProblems = useMemo(
    () =>
      selectedProblemIds
        .map((problemId) => availableProblems.find((problem) => problem.id === problemId))
        .filter((problem): problem is ContestProblemRecord => Boolean(problem)),
    [availableProblems, selectedProblemIds],
  );

  const previewProblems = selectedProblems.length
    ? selectedProblems.slice(0, 3)
    : availableProblems.slice(0, 3);

  const contestStatusRows: StatusSummaryRow[] = aiHintEnabled
    ? [
        {
          id: "status",
          label: "Status",
          value: (
            <span className={styles.statusNewBadge}>
              {isEditMode ? "Editing" : "New"}
            </span>
          ),
        },
        {
          id: "problems",
          label: "Problems",
          value: <Typography className={styles.statusValue}>{selectedProblems.length}</Typography>,
        },
        {
          id: "schedule",
          label: "Schedule",
          value: <Typography className={styles.statusValueSmall}>{formatStatusDate(formValues.startDate)}</Typography>,
        },
        {
          id: "aiHint",
          label: "AI Hint Exp.",
          value: <span className={styles.statusEnabledBadge}>On</span>,
        },
        {
          id: "groups",
          label: "Groups",
          value: <Typography className={styles.statusValue}>{contestAiHintConfig.groupsSummary}</Typography>,
        },
        {
          id: "assignment",
          label: "Assignment",
          value: (
            <Typography className={styles.statusValueSmall}>
              {contestAiHintConfig.assignmentLabel}
            </Typography>
          ),
        },
        {
          id: "drafts",
          label: "Drafts",
          value: <Typography className={styles.statusValue}>{contestDrafts.length}</Typography>,
        },
      ]
    : [
        {
          id: "status",
          label: "Status",
          value: (
            <span className={styles.statusNewBadge}>
              {isEditMode ? "Editing" : "New"}
            </span>
          ),
        },
        {
          id: "problems",
          label: "Problems",
          value: <Typography className={styles.statusValue}>{selectedProblems.length}</Typography>,
        },
        {
          id: "schedule",
          label: "Schedule",
          value: <Typography className={styles.statusValueSmall}>{formatStatusDate(formValues.startDate)}</Typography>,
        },
        {
          id: "aiHint",
          label: "AI Hint Exp.",
          value: <span className={styles.statusDisabledBadge}>Off</span>,
        },
        {
          id: "drafts",
          label: "Drafts",
          value: <Typography className={styles.statusValue}>{contestDrafts.length}</Typography>,
        },
      ];

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
  const pageError = saveError ?? contestQuery.error?.message ?? problemLibraryQuery.error?.message ?? null;
  const isPageLoading =
    (isEditMode && contestQuery.isLoading && !contestQuery.data) ||
    (problemLibraryQuery.isLoading && availableProblems.length === 0);

  const updateField = (field: keyof ContestFormDraft, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

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

  const handlePublish = async () => {
    setSaveError(null);

    try {
      if (isEditMode && contestId) {
        await updateContestMutation.mutateAsync({
          contestId,
          data: {
            ...formValues,
            isDraft: false,
            aiHintEnabled,
            selectedProblemIds,
          },
        });
      } else {
        await createContestMutation.mutateAsync({
          ...formValues,
          isDraft: false,
          aiHintEnabled,
          selectedProblemIds,
        });
      }

      await Promise.all([
        utils.instructorManageContent.getManageContent.invalidate(),
        utils.instructorManageContent.getInstructorOverview.invalidate(),
        utils.contestAuthoring.getContestById.invalidate({ contestId: contestId ?? "" }),
      ]);

      router.push(ROUTES.instructorManageContests);
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
          data: {
            ...formValues,
            isDraft: true,
            aiHintEnabled,
            selectedProblemIds,
          },
        });
        await Promise.all([
          utils.instructorManageContent.getInstructorOverview.invalidate(),
          utils.contestAuthoring.getContestById.invalidate({ contestId }),
        ]);
        router.push(ROUTES.instructorManageContests);
      } else {
        await createContestMutation.mutateAsync({
          ...formValues,
          isDraft: true,
          aiHintEnabled,
          selectedProblemIds,
        });
        await Promise.all([
          utils.instructorManageContent.getManageContent.invalidate(),
          utils.instructorManageContent.getInstructorOverview.invalidate(),
        ]);
        router.push(ROUTES.instructorManageContests);
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

            <Card className={styles.card} elevation={0}>
              <CardContent className={styles.cardContent}>
                {isPageLoading ? (
                  <Box display="flex" justifyContent="center" py={6}>
                    <CircularProgress size={28} />
                  </Box>
                ) : null}

                <Box className={styles.sectionHeader}>
                  <Typography className={styles.sectionTitle}>
                    {contestAuthoringCopy.basicInfoTitle}
                  </Typography>
                  <Typography className={styles.sectionDescription}>
                    {contestAuthoringCopy.basicInfoDescription}
                  </Typography>
                </Box>

                <Box className={styles.fieldBlock}>
                  <Typography className={styles.fieldLabel}>
                    {contestAuthoringCopy.contestNameLabel}
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder={contestAuthoringCopy.contestNamePlaceholder}
                    value={formValues.contestName}
                    onChange={(event) => updateField("contestName", event.target.value)}
                    className={styles.inputField}
                  />
                </Box>

                <Box className={styles.fieldBlock}>
                  <Typography className={styles.fieldLabel}>
                    {contestAuthoringCopy.descriptionLabel}
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    placeholder={contestAuthoringCopy.descriptionPlaceholder}
                    value={formValues.description}
                    onChange={(event) => updateField("description", event.target.value)}
                    className={`${styles.inputField} ${styles.textAreaField}`}
                  />
                </Box>
              </CardContent>
            </Card>

            <Card className={styles.card} elevation={0}>
              <CardContent className={styles.cardContent}>
                <Box className={styles.sectionHeader}>
                  <Typography className={styles.sectionTitle}>
                    {contestAuthoringCopy.scheduleTitle}
                  </Typography>
                  <Typography className={styles.sectionDescription}>
                    {contestAuthoringCopy.scheduleDescription}
                  </Typography>
                </Box>

                <Box className={styles.fieldBlock}>
                  <Box className={styles.fieldLabelRow}>
                    <EventOutlinedIcon className={styles.fieldLabelIcon} />
                    <Typography className={styles.fieldLabel}>
                      {contestAuthoringCopy.startLabel}
                    </Typography>
                  </Box>
                  <Box className={styles.twoColumnGrid}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={formValues.startDate}
                      onChange={(event) => updateField("startDate", event.target.value)}
                      className={styles.inputField}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      type="time"
                      value={formValues.startTime}
                      onChange={(event) => updateField("startTime", event.target.value)}
                      className={styles.inputField}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </Box>

                <Box className={styles.fieldBlock}>
                  <Box className={styles.fieldLabelRow}>
                    <EventOutlinedIcon className={styles.fieldLabelIcon} />
                    <Typography className={styles.fieldLabel}>
                      {contestAuthoringCopy.endLabel}
                    </Typography>
                  </Box>
                  <Box className={styles.twoColumnGrid}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={formValues.endDate}
                      onChange={(event) => updateField("endDate", event.target.value)}
                      className={styles.inputField}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      type="time"
                      value={formValues.endTime}
                      onChange={(event) => updateField("endTime", event.target.value)}
                      className={styles.inputField}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card className={styles.card} elevation={0}>
              <CardContent className={styles.cardContent}>
                <Box className={styles.sectionHeaderRow}>
                  <Box className={styles.sectionHeader}>
                    <Typography className={styles.sectionTitle}>
                      {contestAuthoringCopy.contestProblemsTitle}
                    </Typography>
                    <Typography className={styles.sectionDescription}>
                      {contestAuthoringCopy.contestProblemsDescription}
                    </Typography>
                  </Box>
                  <Button
                    className={styles.addProblemsButton}
                    variant="outlined"
                    startIcon={<AddRoundedIcon className={styles.actionIcon} />}
                    onClick={openSelectProblems}
                  >
                    {contestAuthoringCopy.addProblemsLabel}
                  </Button>
                </Box>

                {selectedProblems.length === 0 ? (
                  <Box className={styles.emptyState}>
                    <EmojiEventsOutlinedIcon className={styles.emptyStateIcon} />
                    <Typography className={styles.emptyStateTitle}>
                      {contestAuthoringCopy.emptyProblemsTitle}
                    </Typography>
                    <Typography className={styles.emptyStateBody}>
                      {contestAuthoringCopy.emptyProblemsDescription}
                    </Typography>
                  </Box>
                ) : (
                  <Box className={styles.problemList}>
                    {selectedProblems.map((problem, index) => (
                      <Box key={problem.id} className={styles.selectedProblemRow}>
                        <Box className={styles.selectedProblemMain}>
                          <Typography className={styles.problemOrder}>{`#${index + 1}`}</Typography>
                          <Box className={styles.problemCopy}>
                              <Typography className={styles.problemTitle}>{problem.title}</Typography>
                              <Box className={styles.problemMetaRow}>
                                <span className={getDifficultyBadgeClassName(problem.difficulty)}>
                                  {problem.difficulty}
                                </span>
                              <Typography className={styles.problemMetaText}>
                                {`${problem.points} points`}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        <IconButton
                          className={styles.removeProblemButton}
                          onClick={() => removeProblem(problem.id)}
                          aria-label={`Remove ${problem.title}`}
                        >
                          <CloseRoundedIcon className={styles.removeProblemIcon} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card className={styles.card} elevation={0}>
              <CardContent className={styles.cardContent}>
                <Box className={styles.aiHeaderRow}>
                  <Box className={styles.aiTitleWrap}>
                    <AutoAwesomeOutlinedIcon className={styles.aiIcon} />
                    <Box className={styles.sectionHeader}>
                      <Typography className={styles.sectionTitle}>
                        {contestAuthoringCopy.aiHintTitle}
                      </Typography>
                      <Typography className={styles.sectionDescription}>
                        {contestAuthoringCopy.aiHintDescription}
                      </Typography>
                    </Box>
                  </Box>

                  <Box className={styles.aiToggleWrap}>
                    <Typography className={styles.aiToggleLabel}>
                      {aiHintEnabled
                        ? contestAuthoringCopy.aiHintEnabledLabel
                        : contestAuthoringCopy.aiHintDisabledLabel}
                    </Typography>
                    <Switch
                      checked={aiHintEnabled}
                      onChange={(_, checked) => setAiHintEnabled(checked)}
                      className={styles.aiSwitch}
                    />
                  </Box>
                </Box>

                {aiHintEnabled ? (
                  <>
                    <Box className={styles.sectionHeader}>
                      <Typography className={styles.subSectionLabel}>
                        {contestAuthoringCopy.groupConfigurationTitle}
                      </Typography>
                    </Box>

                    <Box className={styles.groupGrid}>
                      <Box className={`${styles.groupCard} ${styles.groupCardA}`}>
                        <Box className={styles.groupHeader}>
                          <span className={`${styles.groupDot} ${styles.groupDotA}`}>A</span>
                          <Typography className={styles.groupTitle}>Group A</Typography>
                        </Box>
                        <Typography className={styles.groupHintLabel}>
                          {contestAuthoringCopy.groupAHintLabel}
                        </Typography>
                        <Box className={styles.groupValueSurface}>
                          <Typography className={styles.groupValueText}>
                            {contestAiHintConfig.groupAHintAfterMinutes}
                          </Typography>
                        </Box>
                      </Box>

                      <Box className={`${styles.groupCard} ${styles.groupCardB}`}>
                        <Box className={styles.groupHeader}>
                          <span className={`${styles.groupDot} ${styles.groupDotB}`}>B</span>
                          <Typography className={styles.groupTitle}>Group B</Typography>
                        </Box>
                        <Typography className={styles.groupHintLabel}>
                          {contestAuthoringCopy.groupBHintLabel}
                        </Typography>
                        <Box className={styles.groupValueSurface}>
                          <Typography className={styles.groupValueText}>
                            {contestAiHintConfig.groupBHintAfterMinutes}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box className={styles.cooldownRow}>
                      <RadioButtonCheckedRoundedIcon className={styles.cooldownIcon} />
                      <Typography className={styles.cooldownText}>
                        {contestAuthoringCopy.cooldownLabel}
                      </Typography>
                    </Box>

                    <Box className={styles.assignmentSection}>
                      <Typography className={styles.subSectionLabel}>
                        {contestAuthoringCopy.assignmentTitle}
                      </Typography>
                      <Box className={styles.assignmentCard}>
                        <Box className={styles.assignmentCopy}>
                          <Box className={styles.assignmentTitleRow}>
                            <ShuffleRoundedIcon className={styles.assignmentIcon} />
                            <Typography className={styles.assignmentTitle}>
                              {contestAiHintConfig.assignmentLabel} Assignment
                            </Typography>
                          </Box>
                          <Typography className={styles.assignmentDescription}>
                            {contestAiHintConfig.assignmentDescription}
                          </Typography>
                        </Box>
                        <span className={styles.assignmentBadge}>
                          {contestAuthoringCopy.assignmentBadge}
                        </span>
                      </Box>
                      <Typography className={styles.assignmentFootnote}>
                        {contestAiHintConfig.assignmentFootnote}
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Box className={styles.aiDisabledPanel}>
                    <AutoAwesomeOutlinedIcon className={styles.aiDisabledIcon} />
                    <Box>
                      <Typography className={styles.aiDisabledTitle}>
                        {contestAuthoringCopy.aiHintDisabledTitle}
                      </Typography>
                      <Typography className={styles.aiDisabledBody}>
                        {contestAuthoringCopy.aiHintDisabledDescription}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card className={styles.card} elevation={0}>
              <CardContent className={styles.cardContent}>
                <Box className={styles.sectionHeader}>
                  <Typography className={styles.sectionTitle}>
                    {contestAuthoringCopy.draftsTitle}
                  </Typography>
                  <Typography className={styles.sectionDescription}>
                    {contestAuthoringCopy.draftsDescription}
                  </Typography>
                </Box>

                <Box className={styles.draftsList}>
                  {contestDrafts.map((draft) => (
                    <DraftRecordItem
                      key={draft.id}
                      title={draft.title}
                      topMeta={
                        <Box className={styles.draftMetaTop}>
                          <span className={styles.draftStatusChip}>{draft.status}</span>
                          <Typography className={styles.draftDate}>{draft.date}</Typography>
                        </Box>
                      }
                      bottomMeta={
                        <Typography className={styles.draftMetaBottom}>
                          {`${draft.problemsCount} problem(s)`}
                          {"   "}
                          {`${draft.durationMinutes} min`}
                        </Typography>
                      }
                      itemClassName={styles.draftItem}
                      mainClassName={styles.draftMain}
                      titleClassName={styles.draftTitle}
                      actionsClassName={styles.draftActions}
                      iconButtonClassName={styles.draftIconButton}
                      editIconClassName={styles.draftActionIcon}
                      deleteIconClassName={styles.draftActionIconDanger}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </>
        }
        sidebar={
          <>
            <StatusSummaryCard
              title={contestAuthoringCopy.contestStatusTitle}
              rows={contestStatusRows}
              dividerAfterRowIds={aiHintEnabled ? ["schedule", "assignment"] : ["schedule", "aiHint"]}
              cardClassName={styles.card}
              contentClassName={styles.sideCardContent}
              titleClassName={styles.sideTitle}
              rowsContainerClassName={styles.statusRows}
              rowClassName={styles.statusRow}
              labelClassName={styles.statusLabel}
              dividerClassName={styles.statusDivider}
            />

            <Card className={styles.card} elevation={0}>
              <CardContent className={styles.sideCardContent}>
                <Typography className={styles.sideTitle}>
                  {contestAuthoringCopy.visibilityTitle}
                </Typography>
                <Typography className={styles.sectionDescription}>
                  {contestAuthoringCopy.visibilityDescription}
                </Typography>

                <Box className={styles.fieldBlock}>
                  <Typography className={styles.fieldLabel}>
                    {contestAuthoringCopy.visibilityLabel}
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={formValues.visibility}
                    onChange={(event) => updateField("visibility", event.target.value)}
                    className={styles.inputField}
                    SelectProps={{ IconComponent: KeyboardArrowDownRoundedIcon }}
                  >
                    {VISIBILITY_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {toVisibilityLabel(option.value)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </CardContent>
            </Card>

            <Button
              className={styles.publishButton}
              variant="contained"
              disabled={isSaving || isPageLoading}
              onClick={() => void handlePublish()}
            >
              {isSaving ? "Saving..." : publishLabel}
            </Button>
          </>
        }
      />

      <Dialog
        open={selectProblemsOpen}
        onClose={() => setSelectProblemsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ className: styles.selectProblemsDialogPaper }}
      >
        <DialogContent className={styles.dialogContent}>
          <Box className={styles.dialogHeader}>
            <Box>
              <Typography className={styles.dialogTitle}>
                {contestAuthoringCopy.selectProblemsTitle}
              </Typography>
              <Typography className={styles.dialogSubtitle}>
                {contestAuthoringCopy.selectProblemsDescription}
              </Typography>
            </Box>
            <IconButton
              className={styles.dialogCloseButton}
              onClick={() => setSelectProblemsOpen(false)}
              aria-label="Close select problems dialog"
            >
              <CloseRoundedIcon className={styles.dialogCloseIcon} />
            </IconButton>
          </Box>

          <Box className={styles.modalProblemList}>
            {availableProblems.map((problem) => {
              const isSelected = pendingProblemIds.includes(problem.id);

              return (
                <button
                  key={problem.id}
                  type="button"
                  className={`${styles.modalProblemButton} ${isSelected ? styles.modalProblemButtonSelected : ""}`}
                  onClick={() => togglePendingProblem(problem.id)}
                >
                    <Typography className={styles.modalProblemTitle}>{problem.title}</Typography>
                    <Box className={styles.modalProblemMeta}>
                      <span className={getDifficultyBadgeClassName(problem.difficulty)}>
                        {problem.difficulty}
                      </span>
                      <Typography className={styles.problemMetaText}>{`${problem.points} points`}</Typography>
                      <Typography className={styles.problemSeparator}>•</Typography>
                    <Typography className={styles.problemMetaText}>
                      {formatProblemTags(problem)}
                    </Typography>
                  </Box>
                </button>
              );
            })}
          </Box>

          <Box className={styles.dialogFooter}>
            <Button className={styles.dialogPrimaryButton} variant="contained" onClick={applySelectedProblems}>
              {`Done (${pendingProblemIds.length} ${contestAuthoringCopy.selectedCountSuffix})`}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ className: styles.previewDialogPaper }}
      >
        <DialogContent className={styles.previewDialogContent}>
          <Box className={styles.previewDialogHeader}>
            <Box className={styles.previewDialogTitleWrap}>
              <RemoveRedEyeOutlinedIcon className={styles.previewDialogTitleIcon} />
              <Typography className={styles.previewDialogTitle}>
                {contestAuthoringCopy.previewModalTitle}
              </Typography>
              <span className={styles.previewHeaderBadge}>
                {contestAuthoringCopy.previewBadgeLabel}
              </span>
            </Box>
            <IconButton
              className={styles.dialogCloseButton}
              onClick={() => setPreviewOpen(false)}
              aria-label="Close contest preview"
            >
              <CloseRoundedIcon className={styles.dialogCloseIcon} />
            </IconButton>
          </Box>

          <Box className={styles.previewBody}>
            <Box className={styles.previewTitleRow}>
              <Typography className={styles.previewContestTitle}>{previewTitle}</Typography>
              <span className={styles.previewVisibilityBadge}>
                {toVisibilityLabel(formValues.visibility)}
              </span>
            </Box>
            <Typography className={styles.previewDescriptionText}>{previewDescription}</Typography>

            <Box className={styles.previewScheduleCard}>
              <Box className={styles.previewScheduleRow}>
                <Box className={styles.previewScheduleLabel}>
                  <EventOutlinedIcon className={styles.previewScheduleIcon} />
                  <Typography className={styles.previewScheduleKey}>Start</Typography>
                </Box>
                <Typography className={styles.previewScheduleValue}>{previewStart}</Typography>
              </Box>
              <Box className={styles.previewScheduleRow}>
                <Box className={styles.previewScheduleLabel}>
                  <EventOutlinedIcon className={styles.previewScheduleIcon} />
                  <Typography className={styles.previewScheduleKey}>End</Typography>
                </Box>
                <Typography className={styles.previewScheduleValue}>{previewEnd}</Typography>
              </Box>
            </Box>

            <Box className={styles.previewSection}>
              <Box className={styles.previewSectionHeader}>
                <Box className={styles.previewSectionTitleWrap}>
                  <EmojiEventsOutlinedIcon className={styles.previewSectionIcon} />
                  <Typography className={styles.previewSectionTitle}>
                    {contestAuthoringCopy.previewProblemsTitle}
                  </Typography>
                </Box>
                <Typography className={styles.previewProblemsCount}>
                  {`${previewProblems.length} problem${previewProblems.length === 1 ? "" : "s"}`}
                </Typography>
              </Box>

              <Box className={styles.previewProblemsList}>
                {previewProblems.map((problem, index) => (
                    <Box key={problem.id} className={styles.previewProblemRow}>
                    <Box className={styles.previewProblemCopy}>
                      <Typography className={styles.previewProblemOrder}>{`#${index + 1}`}</Typography>
                      <Typography className={styles.previewProblemTitle}>{problem.title}</Typography>
                    </Box>
                    <Box className={styles.previewProblemMeta}>
                      <span className={getDifficultyBadgeClassName(problem.difficulty)}>
                        {problem.difficulty}
                      </span>
                      <Typography className={styles.previewPoints}>{`${problem.points} pts`}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            {aiHintEnabled ? (
              <Box className={styles.previewExperimentBanner}>
                <AutoAwesomeOutlinedIcon className={styles.previewExperimentIcon} />
                <Box>
                  <Typography className={styles.previewExperimentTitle}>
                    AI Hint Experiment Active
                  </Typography>
                  <Typography className={styles.previewExperimentBody}>
                    {`Group A: hints after ${contestAiHintConfig.groupAHintAfterMinutes} min · Group B: hints after ${contestAiHintConfig.groupBHintAfterMinutes} min`}
                  </Typography>
                </Box>
              </Box>
            ) : null}
          </Box>

          <Box className={styles.previewFooter}>
            <Typography className={styles.previewFooterText}>
              {contestAuthoringCopy.previewReadonlyCopy}
            </Typography>
            <Button
              className={styles.previewCloseButton}
              variant="outlined"
              onClick={() => setPreviewOpen(false)}
            >
              {contestAuthoringCopy.previewCloseLabel}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
