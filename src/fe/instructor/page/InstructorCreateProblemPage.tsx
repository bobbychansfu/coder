"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import InstructorSubpageHeader from "@/fe/instructor/components/InstructorSubpageHeader";
import ChecklistPanel from "@/fe/instructor/components/ChecklistPanel";
import DraftRecordItem from "@/fe/instructor/components/DraftRecordItem";
import SubpageActionButtons, {
  type SubpageActionButtonItem,
} from "@/fe/instructor/components/SubpageActionButtons";
import StatusSummaryCard, {
  type StatusSummaryRow,
} from "@/fe/instructor/components/StatusSummaryCard";
import {
  assignmentTypeOptions,
  authoringGuidelines,
  difficultyOptions,
  problemAuthoringCopy,
  problemExamplesDraft,
  problemMetadataDraft,
  problemStatementDraft,
  problemTestCasesDraft,
  problemAuthoringTabs,
  savedProblemDrafts,
  visibilityOptions,
  type ProblemExampleDraft,
  type ProblemMetadataDraft,
  type ProblemStatementDraft,
  type ProblemTestCaseDraft,
} from "@/fe/instructor/data/problemAuthoring";
import PageHeader from "@/fe/shared/components/PageHeader";
import { ROUTES } from "@/fe/shared/constants/routes";
import subpageStyles from "@/fe/instructor/styles/InstructorSubpageHeader.module.css";
import styles from "@/fe/instructor/styles/InstructorCreateProblemPage.module.css";

type ProblemTab = (typeof problemAuthoringTabs)[number]["value"];

const stepOrder: ProblemTab[] = ["metadata", "statement", "examples", "test-cases"];

const statusChipColors = {
  status: { background: "#eceef2", color: "#030213", border: "none" },
  visibility: { background: "#eceef2", color: "#030213", border: "none" },
  difficulty: { background: "#dc2626", color: "#ffffff", border: "none" },
} as const;

const draftDifficultyChipColors = {
  easy: { background: "#eceef2", color: "#030213" },
  medium: { background: "#dc2626", color: "#ffffff" },
  hard: { background: "#b91c1c", color: "#ffffff" },
} as const;

const createEmptyTestCase = (index: number): ProblemTestCaseDraft => ({
  id: `test-case-${index}`,
  description: "",
  input: "",
  expectedOutput: "",
});

export default function InstructorCreateProblemPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ProblemTab>("metadata");
  const [assignmentType, setAssignmentType] = useState("");
  const [formValues, setFormValues] = useState<ProblemMetadataDraft>(problemMetadataDraft);
  const [statementValues, setStatementValues] =
    useState<ProblemStatementDraft>(problemStatementDraft);
  const [examples, setExamples] = useState<ProblemExampleDraft[]>(problemExamplesDraft);
  const [testCases, setTestCases] = useState<ProblemTestCaseDraft[]>(problemTestCasesDraft);
  const [previewOpen, setPreviewOpen] = useState(false);

  const headerActions: SubpageActionButtonItem[] = [
    {
      id: "save-draft",
      label: problemAuthoringCopy.saveDraftLabel,
      icon: SaveOutlinedIcon,
    },
    {
      id: "import-csv",
      label: problemAuthoringCopy.importCsvLabel,
      icon: UploadFileOutlinedIcon,
    },
    {
      id: "preview",
      label: problemAuthoringCopy.previewLabel,
      icon: RemoveRedEyeOutlinedIcon,
      onClick: () => setPreviewOpen(true),
    },
  ];

  const difficultyLabel = useMemo(() => {
    return difficultyOptions.find((option) => option.value === formValues.difficulty)?.label ?? "Medium";
  }, [formValues.difficulty]);

  const visibilityLabel = useMemo(() => {
    if (!formValues.visibility) {
      return "course-only";
    }

    return visibilityOptions.find((option) => option.value === formValues.visibility)?.label ?? "course-only";
  }, [formValues.visibility]);

  const testCasesSummary =
    testCases.length > 0
      ? `${testCases.length}`
      : `0${problemAuthoringCopy.testCasesNoneSuffix}`;

  const problemStatusRows: StatusSummaryRow[] = [
    {
      id: "status",
      label: "Status",
      value: (
        <Chip
          size="small"
          className={styles.statusChip}
          label={problemAuthoringCopy.statusNewLabel}
          sx={{
            backgroundColor: statusChipColors.status.background,
            color: statusChipColors.status.color,
            border: statusChipColors.status.border,
          }}
        />
      ),
    },
    {
      id: "visibility",
      label: "Visibility",
      value: (
        <Chip
          size="small"
          className={styles.statusChip}
          label={visibilityLabel}
          sx={{
            backgroundColor: statusChipColors.visibility.background,
            color: statusChipColors.visibility.color,
            border: statusChipColors.visibility.border,
          }}
        />
      ),
    },
    {
      id: "difficulty",
      label: "Difficulty",
      value: (
        <Chip
          size="small"
          className={styles.statusChip}
          label={difficultyLabel.toLowerCase()}
          sx={{
            backgroundColor: statusChipColors.difficulty.background,
            color: statusChipColors.difficulty.color,
            border: statusChipColors.difficulty.border,
          }}
        />
      ),
    },
    {
      id: "points",
      label: "Points",
      value: <Typography className={styles.statusValue}>{formValues.points || "0"}</Typography>,
    },
    {
      id: "examples",
      label: problemAuthoringCopy.examplesCountLabel,
      value: <Typography className={styles.statusValue}>{examples.length}</Typography>,
    },
    {
      id: "test-cases",
      label: problemAuthoringCopy.testCasesCountLabel,
      value: <Typography className={styles.statusValue}>{testCasesSummary}</Typography>,
    },
  ];

  const metadataComplete = Boolean(
    formValues.title.trim() &&
      formValues.visibility.trim() &&
      formValues.timeComplexity.trim() &&
      formValues.spaceComplexity.trim(),
  );

  const statementComplete = Boolean(
    statementValues.statement.trim() &&
      statementValues.inputFormat.trim() &&
      statementValues.outputFormat.trim() &&
      statementValues.constraints.trim(),
  );

  const examplesComplete = examples.some(
    (example) => example.input.trim() && example.output.trim(),
  );

  const testCasesComplete =
    testCases.length > 0 &&
    testCases.every((testCase) => testCase.input.trim() && testCase.expectedOutput.trim());

  const completedByTab: Record<ProblemTab, boolean> = {
    metadata: metadataComplete,
    statement: statementComplete,
    examples: examplesComplete,
    "test-cases": testCasesComplete,
  };

  const completedTestCasesCount = testCases.filter(
    (testCase) => testCase.input.trim() && testCase.expectedOutput.trim(),
  ).length;

  const updateField = (field: keyof ProblemMetadataDraft, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
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
      prev.map((example) =>
        example.id === id ? { ...example, [field]: value } : example,
      ),
    );
  };

  const updateTestCaseField = (
    id: string,
    field: keyof Omit<ProblemTestCaseDraft, "id">,
    value: string,
  ) => {
    setTestCases((prev) =>
      prev.map((testCase) =>
        testCase.id === id ? { ...testCase, [field]: value } : testCase,
      ),
    );
  };

  const addExample = () => {
    setExamples((prev) => [
      ...prev,
      { id: `example-${prev.length + 1}`, input: "", output: "", explanation: "" },
    ]);
  };

  const addTestCase = () => {
    setTestCases((prev) => [...prev, createEmptyTestCase(prev.length + 1)]);
  };

  const removeTestCase = (id: string) => {
    setTestCases((prev) => prev.filter((testCase) => testCase.id !== id));
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

  const previewTitle = formValues.title.trim() || "Untitled Problem";

  return (
    <Box className={styles.page}>
      <PageHeader
        onBack={() => router.push(ROUTES.instructor)}
        backLabel={problemAuthoringCopy.backButtonLabel}
        backButtonClassName={subpageStyles.backButton}
      />

      <InstructorSubpageHeader
        title={problemAuthoringCopy.pageTitle}
        subtitle={problemAuthoringCopy.pageSubtitle}
        actions={
          <SubpageActionButtons
            items={headerActions}
            containerClassName={styles.headerActions}
            buttonClassName={styles.secondaryAction}
            iconClassName={styles.actionIcon}
          />
        }
      />

      <Box className={styles.contentGrid}>
        <Box className={styles.leftColumn}>
          <Card className={styles.formCard} elevation={0}>
            <CardContent className={styles.formCardContent}>
              <ToggleButtonGroup
                className={styles.stepperTabs}
                value={activeTab}
                exclusive
                onChange={(_, nextTab) => {
                  if (nextTab) {
                    goToTab(nextTab as ProblemTab);
                  }
                }}
                aria-label="Create problem steps"
              >
                {problemAuthoringTabs.map((tab, index) => {
                  const isCompleted = completedByTab[tab.value];

                  return (
                    <ToggleButton
                      key={tab.value}
                      value={tab.value}
                      className={styles.stepperTabButton}
                    >
                      <Box className={styles.stepperTabInner}>
                        <Box className={styles.stepperBadge}>
                          {isCompleted && activeTab !== tab.value ? (
                            <CheckRoundedIcon className={styles.stepperCheckIcon} />
                          ) : (
                            index + 1
                          )}
                        </Box>
                        <span>{tab.label}</span>
                        {tab.value === "test-cases" && testCases.length > 0 ? (
                          <Box className={styles.stepperCountBadge}>{testCases.length}</Box>
                        ) : null}
                      </Box>
                    </ToggleButton>
                  );
                })}
              </ToggleButtonGroup>

              {activeTab === "metadata" ? (
                <Box className={styles.formFields}>
                  <Box className={styles.fieldBlock}>
                    <Typography className={styles.fieldLabel}>Problem Title *</Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g., Two Sum"
                      value={formValues.title}
                      onChange={(event) => updateField("title", event.target.value)}
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
                        value={formValues.difficulty}
                        onChange={(event) => updateField("difficulty", event.target.value)}
                        className={styles.selectField}
                        SelectProps={{ IconComponent: KeyboardArrowDownRoundedIcon }}
                      >
                        {difficultyOptions.map((option) => (
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
                        value={formValues.points}
                        onChange={(event) => updateField("points", event.target.value)}
                        className={styles.inputField}
                      />
                    </Box>
                  </Box>

                  <Box className={styles.twoColumnGrid}>
                    <Box className={styles.fieldBlock}>
                      <Box className={styles.fieldLabelRow}>
                        <AccessTimeOutlinedIcon className={styles.fieldLabelIcon} />
                        <Typography className={styles.fieldLabel}>Time Complexity *</Typography>
                      </Box>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g., O(n)"
                        value={formValues.timeComplexity}
                        onChange={(event) => updateField("timeComplexity", event.target.value)}
                        className={styles.inputField}
                      />
                    </Box>

                    <Box className={styles.fieldBlock}>
                      <Box className={styles.fieldLabelRow}>
                        <StorageOutlinedIcon className={styles.fieldLabelIcon} />
                        <Typography className={styles.fieldLabel}>Space Complexity *</Typography>
                      </Box>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g., O(1)"
                        value={formValues.spaceComplexity}
                        onChange={(event) => updateField("spaceComplexity", event.target.value)}
                        className={styles.inputField}
                      />
                    </Box>
                  </Box>

                  <Box className={styles.fieldBlock}>
                    <Typography className={styles.fieldLabel}>Tags</Typography>
                    <Box className={styles.tagsRow}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g., arrays, hash-table"
                        value={formValues.tags}
                        onChange={(event) => updateField("tags", event.target.value)}
                        className={styles.inputField}
                      />
                      <Button className={styles.addTagButton} aria-label="Add tag">
                        <AddRoundedIcon className={styles.addTagButtonIcon} />
                      </Button>
                    </Box>
                  </Box>

                  <Box className={styles.fieldBlock}>
                    <Typography className={styles.fieldLabel}>Visibility *</Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={formValues.visibility}
                      onChange={(event) => updateField("visibility", event.target.value)}
                      className={styles.selectField}
                      SelectProps={{ IconComponent: KeyboardArrowDownRoundedIcon, displayEmpty: true }}
                    >
                      <MenuItem value="" disabled>
                        Select visibility
                      </MenuItem>
                      {visibilityOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  <Box className={styles.nextStepRow}>
                    <Button
                      className={styles.nextStepButton}
                      variant="contained"
                      endIcon={<ArrowForwardRoundedIcon className={styles.actionIcon} />}
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
                      minRows={6}
                      placeholder="Describe the problem clearly..."
                      value={statementValues.statement}
                      onChange={(event) => updateStatementField("statement", event.target.value)}
                      className={`${styles.inputField} ${styles.textAreaField} ${styles.monoTextArea}`}
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
                      className={`${styles.inputField} ${styles.textAreaField} ${styles.monoTextArea}`}
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
                      onChange={(event) => updateStatementField("outputFormat", event.target.value)}
                      className={`${styles.inputField} ${styles.textAreaField} ${styles.monoTextArea}`}
                    />
                  </Box>

                  <Box className={styles.fieldBlock}>
                    <Typography className={styles.fieldLabel}>Constraints *</Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      placeholder="e.g., 1 <= n <= 10^5"
                      value={statementValues.constraints}
                      onChange={(event) => updateStatementField("constraints", event.target.value)}
                      className={`${styles.inputField} ${styles.textAreaField} ${styles.monoTextArea}`}
                    />
                  </Box>

                  <Box className={styles.stepActionsRow}>
                    <Button className={styles.stepSecondaryButton} onClick={goToPreviousTab}>
                      {problemAuthoringCopy.backMetadataLabel}
                    </Button>
                    <Button
                      className={styles.nextStepButton}
                      variant="contained"
                      endIcon={<ArrowForwardRoundedIcon className={styles.actionIcon} />}
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

                  <Box className={styles.examplesStack}>
                    {examples.map((example, index) => (
                      <Box key={example.id} className={styles.exampleCard}>
                        <Box className={styles.exampleCardTitleRow}>
                          <Typography className={styles.exampleCardTitle}>Example {index + 1}</Typography>
                        </Box>

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
                            className={`${styles.inputField} ${styles.textAreaField} ${styles.monoTextArea}`}
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
                            className={`${styles.inputField} ${styles.textAreaField} ${styles.monoTextArea}`}
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

                    <Button
                      className={styles.addExampleButton}
                      variant="outlined"
                      startIcon={<AddRoundedIcon className={styles.actionIcon} />}
                      onClick={addExample}
                    >
                      {problemAuthoringCopy.addAnotherExampleLabel}
                    </Button>
                  </Box>

                  <Box className={styles.stepActionsRow}>
                    <Button className={styles.stepSecondaryButton} onClick={goToPreviousTab}>
                      {problemAuthoringCopy.backStatementLabel}
                    </Button>
                    <Button
                      className={styles.nextStepButton}
                      variant="contained"
                      endIcon={<ArrowForwardRoundedIcon className={styles.actionIcon} />}
                      onClick={goToNextTab}
                    >
                      {problemAuthoringCopy.nextTestCasesLabel}
                    </Button>
                  </Box>
                </Box>
              ) : null}

              {activeTab === "test-cases" ? (
                <Box className={styles.formFields}>
                  <Box className={styles.optionalBanner}>
                    <WarningAmberRoundedIcon className={styles.optionalBannerIcon} />
                    <Box>
                      <Typography className={styles.optionalBannerTitle}>
                        {problemAuthoringCopy.optionalTestCasesTitle}
                      </Typography>
                      <Typography className={styles.optionalBannerText}>
                        {problemAuthoringCopy.optionalTestCasesDescription}
                      </Typography>
                    </Box>
                  </Box>

                  {testCases.length === 0 ? (
                    <Box className={styles.testCaseEmptyState}>
                      <ScienceOutlinedIcon className={styles.testCaseEmptyIcon} />
                      <Typography className={styles.testCaseEmptyTitle}>
                        {problemAuthoringCopy.testCasesEmptyTitle}
                      </Typography>
                      <Typography className={styles.testCaseEmptyBody}>
                        {problemAuthoringCopy.testCasesEmptyDescription}
                      </Typography>
                      <Button
                        className={styles.emptyStateButton}
                        variant="outlined"
                        startIcon={<AddRoundedIcon className={styles.actionIcon} />}
                        onClick={addTestCase}
                      >
                        {problemAuthoringCopy.addFirstTestCaseLabel}
                      </Button>
                    </Box>
                  ) : (
                    <Box className={styles.testCasesStack}>
                      {testCases.map((testCase, index) => (
                        <Box key={testCase.id} className={styles.testCaseCard}>
                          <Box className={styles.testCaseHeader}>
                            <Box className={styles.testCaseHeaderLeft}>
                              <ScienceOutlinedIcon className={styles.testCaseIcon} />
                              <Typography className={styles.testCaseTitle}>
                                Test Case {index + 1}
                              </Typography>
                            </Box>
                            <IconButton
                              className={styles.testCaseDeleteButton}
                              onClick={() => removeTestCase(testCase.id)}
                              aria-label={`Delete test case ${index + 1}`}
                            >
                              <DeleteOutlineRoundedIcon className={styles.testCaseDeleteIcon} />
                            </IconButton>
                          </Box>

                          <Box className={styles.fieldBlock}>
                            <Typography className={styles.fieldLabel}>
                              {problemAuthoringCopy.testCaseDescriptionLabel}
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="e.g., Edge case: empty array"
                              value={testCase.description}
                              onChange={(event) =>
                                updateTestCaseField(testCase.id, "description", event.target.value)
                              }
                              className={styles.inputField}
                            />
                          </Box>

                          <Box className={styles.twoColumnGrid}>
                            <Box className={styles.fieldBlock}>
                              <Typography className={styles.fieldLabel}>
                                {problemAuthoringCopy.testCaseInputLabel}
                              </Typography>
                              <TextField
                                fullWidth
                                multiline
                                minRows={2}
                                value={testCase.input}
                                onChange={(event) =>
                                  updateTestCaseField(testCase.id, "input", event.target.value)
                                }
                                className={`${styles.inputField} ${styles.textAreaField} ${styles.monoTextArea}`}
                              />
                            </Box>
                            <Box className={styles.fieldBlock}>
                              <Typography className={styles.fieldLabel}>
                                {problemAuthoringCopy.testCaseExpectedOutputLabel}
                              </Typography>
                              <TextField
                                fullWidth
                                multiline
                                minRows={2}
                                value={testCase.expectedOutput}
                                onChange={(event) =>
                                  updateTestCaseField(
                                    testCase.id,
                                    "expectedOutput",
                                    event.target.value,
                                  )
                                }
                                className={`${styles.inputField} ${styles.textAreaField} ${styles.monoTextArea}`}
                              />
                            </Box>
                          </Box>
                        </Box>
                      ))}

                      <Button
                        className={styles.addExampleButton}
                        variant="outlined"
                        startIcon={<AddRoundedIcon className={styles.actionIcon} />}
                        onClick={addTestCase}
                      >
                        {problemAuthoringCopy.addAnotherTestCaseLabel}
                      </Button>

                      <Box className={styles.testCaseProgressRow}>
                        <Typography className={styles.testCaseProgressText}>
                          {`${completedTestCasesCount} of ${testCases.length} test case(s) complete`}
                        </Typography>
                        <Chip
                          size="small"
                          label={problemAuthoringCopy.testCaseOptionalBadge}
                          className={styles.testCaseOptionalChip}
                        />
                      </Box>
                    </Box>
                  )}

                  <Box className={styles.stepActionsRow}>
                    <Button className={styles.stepSecondaryButton} onClick={goToPreviousTab}>
                      {problemAuthoringCopy.backExamplesLabel}
                    </Button>
                    <Button className={styles.nextStepButton} variant="contained">
                      {problemAuthoringCopy.publishLabel}
                    </Button>
                  </Box>
                </Box>
              ) : null}
            </CardContent>
          </Card>

          <Card className={styles.draftsCard} elevation={0}>
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
                {savedProblemDrafts.map((draft) => {
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
                          <Typography className={styles.draftDate}>{draft.date}</Typography>
                        </Box>
                      }
                      bottomMeta={
                        <Typography className={styles.draftCounts}>
                          {`${draft.examplesCount} example(s)`}
                          {"   "}
                          {`${draft.testCasesCount} test case(s)`}
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
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box className={styles.sidebar}>
          <StatusSummaryCard
            title={problemAuthoringCopy.problemStatusTitle}
            rows={problemStatusRows}
            dividerAfterRowIds={["points"]}
            cardClassName={styles.sideCard}
            contentClassName={styles.sideCardContent}
            titleClassName={styles.sideCardTitleSmall}
            rowsContainerClassName={styles.statusRows}
            rowClassName={styles.statusRow}
            labelClassName={styles.statusLabel}
            dividerClassName={styles.statusDivider}
          />

          <Card className={styles.sideCard} elevation={0}>
            <CardContent className={styles.sideCardContent}>
              <Typography className={styles.sideCardTitleSmall}>{problemAuthoringCopy.assignTitle}</Typography>
              <Typography className={styles.sideCardDescription}>{problemAuthoringCopy.assignDescription}</Typography>
              <Box className={styles.fieldBlock}>
                <Typography className={styles.fieldLabel}>{problemAuthoringCopy.assignmentTypeLabel}</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={assignmentType}
                  onChange={(event) => setAssignmentType(event.target.value)}
                  className={styles.selectField}
                  SelectProps={{ IconComponent: KeyboardArrowDownRoundedIcon, displayEmpty: true }}
                >
                  <MenuItem value="" disabled>
                    {problemAuthoringCopy.assignmentTypePlaceholder}
                  </MenuItem>
                  {assignmentTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </CardContent>
          </Card>

          <ChecklistPanel
            title={problemAuthoringCopy.guidelinesTitle}
            items={authoringGuidelines.map((guideline) => guideline.text)}
            cardClassName={styles.sideCard}
            contentClassName={styles.sideCardContent}
            titleClassName={styles.sideCardTitleSmall}
            listClassName={styles.guidelineList}
            itemClassName={styles.guidelineItem}
            iconClassName={styles.guidelineCheck}
            textClassName={styles.guidelineText}
          />

          <Box className={styles.footerActions}>
            <Button className={styles.publishButton} variant="contained">
              {problemAuthoringCopy.publishLabel}
            </Button>
          </Box>
        </Box>
      </Box>

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        fullWidth
        maxWidth="md"
        className={styles.previewDialog}
      >
        <DialogContent className={styles.previewDialogContent}>
          <Box className={styles.previewHeaderRow}>
            <Typography className={styles.previewDialogTitle}>
              {problemAuthoringCopy.previewModalTitle}
            </Typography>
            <IconButton
              className={styles.previewCloseButton}
              onClick={() => setPreviewOpen(false)}
              aria-label="Close preview"
            >
              <CloseRoundedIcon className={styles.previewCloseIcon} />
            </IconButton>
          </Box>

          <Typography className={styles.previewDialogSubtitle}>
            {problemAuthoringCopy.previewModalSubtitle}
          </Typography>

          <Typography className={styles.previewProblemTitle}>{previewTitle}</Typography>

          <Box className={styles.previewMetaRow}>
            <Chip label={difficultyLabel} size="small" className={styles.previewDifficultyChip} />
            <Chip
              label={`${formValues.points || "0"} pts`}
              size="small"
              className={styles.previewMetaChip}
            />
            <Chip
              label={`Time: ${formValues.timeComplexity || "-"}`}
              size="small"
              className={styles.previewMetaChip}
            />
            <Chip
              label={`Space: ${formValues.spaceComplexity || "-"}`}
              size="small"
              className={styles.previewMetaChip}
            />
          </Box>

          <Box className={styles.previewSectionBlock}>
            <Typography className={styles.previewSectionTitle}>
              {problemAuthoringCopy.previewStatementTitle}
            </Typography>
            <Box className={styles.previewSurface}>
              <Typography className={styles.previewBodyText}>
                {statementValues.statement || "-"}
              </Typography>
            </Box>
          </Box>

          <Box className={styles.previewTwoColumnGrid}>
            <Box className={styles.previewSectionBlock}>
              <Typography className={styles.previewSectionTitle}>
                {problemAuthoringCopy.previewInputTitle}
              </Typography>
              <Box className={styles.previewSurface}>
                <Typography className={styles.previewBodyText}>
                  {statementValues.inputFormat || "-"}
                </Typography>
              </Box>
            </Box>

            <Box className={styles.previewSectionBlock}>
              <Typography className={styles.previewSectionTitle}>
                {problemAuthoringCopy.previewOutputTitle}
              </Typography>
              <Box className={styles.previewSurface}>
                <Typography className={styles.previewBodyText}>
                  {statementValues.outputFormat || "-"}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box className={styles.previewSectionBlock}>
            <Typography className={styles.previewSectionTitle}>
              {problemAuthoringCopy.previewConstraintsTitle}
            </Typography>
            <Box className={styles.previewSurface}>
              <Typography className={styles.previewBodyText}>
                {statementValues.constraints || "-"}
              </Typography>
            </Box>
          </Box>

          <Box className={styles.previewSectionBlock}>
            <Typography className={styles.previewSectionTitle}>
              {problemAuthoringCopy.previewExamplesTitle}
            </Typography>
            <Box className={styles.previewExamplesWrap}>
              {examples.length === 0 ? (
                <Typography className={styles.previewBodyText}>No examples added.</Typography>
              ) : (
                examples.map((example, index) => (
                  <Box key={example.id} className={styles.previewExampleCard}>
                    <Typography className={styles.previewExampleTitle}>
                      Example {index + 1}
                    </Typography>
                    <Box className={styles.previewExampleGrid}>
                      <Box className={styles.previewExampleCell}>
                        <Typography className={styles.previewExampleLabel}>Input</Typography>
                        <Typography className={styles.previewBodyText}>{example.input || "-"}</Typography>
                      </Box>
                      <Box className={styles.previewExampleCell}>
                        <Typography className={styles.previewExampleLabel}>Output</Typography>
                        <Typography className={styles.previewBodyText}>{example.output || "-"}</Typography>
                      </Box>
                    </Box>
                    {example.explanation ? (
                      <Typography className={styles.previewExplanationText}>
                        {`${problemAuthoringCopy.previewExplanationPrefix} ${example.explanation}`}
                      </Typography>
                    ) : null}
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
