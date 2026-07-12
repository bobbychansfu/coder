import { Box, Button, Chip, Typography } from "@mui/material";
import StatusSummaryCard, {
  type StatusSummaryRow,
} from "@/fe/instructor/components/StatusSummaryCard";
import {
  problemAuthoringCopy,
  type ProblemMetadataDraft,
  type StarterLanguage,
} from "@/fe/instructor/data/problemAuthoring";
import { LANGUAGE_OPTIONS } from "@/fe/shared/constants/options";
import styles from "@/fe/instructor/styles/InstructorCreateProblemPage.module.css";

const difficultyBadgeStyles = {
  easy: { backgroundColor: "#ecfdf3", color: "#027a48" },
  medium: { backgroundColor: "#dc2626", color: "#ffffff" },
  hard: { backgroundColor: "#b91c1c", color: "#ffffff" },
} as const;

interface InstructorCreateProblemStatusSidebarProps {
  metadataValues: ProblemMetadataDraft;
  sourceLabel: string;
  difficultyLabel: string;
  completedExamplesCount: number;
  filledLanguages: StarterLanguage[];
  isEditMode: boolean;
  isSaving: boolean;
  isPageLoading: boolean;
  publishLabel: string;
  problemStatus?: {
    isDraft: boolean;
    manageStatus: string | null;
  };
  onPublish: () => void;
}

export default function InstructorCreateProblemStatusSidebar({
  metadataValues,
  sourceLabel,
  difficultyLabel,
  completedExamplesCount,
  filledLanguages,
  isEditMode,
  isSaving,
  isPageLoading,
  publishLabel,
  problemStatus,
  onPublish,
}: InstructorCreateProblemStatusSidebarProps) {
  const problemStatusRows: StatusSummaryRow[] = [
    {
      id: "status",
      label: "Status",
      value: (
        <Chip
          label={
            isEditMode
              ? problemStatus?.isDraft
                ? "Draft"
                : problemStatus?.manageStatus === "archived"
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
          onClick={onPublish}
        >
          {isSaving ? "Saving..." : publishLabel}
        </Button>
        <Typography className={styles.publishHint}>
          {problemAuthoringCopy.publishHint}
        </Typography>
      </Box>
    </>
  );
}
