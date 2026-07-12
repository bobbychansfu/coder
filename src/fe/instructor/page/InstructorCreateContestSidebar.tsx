import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { Button, Card, CardContent, MenuItem, TextField, Typography } from "@mui/material";
import StatusSummaryCard, {
  type StatusSummaryRow,
} from "@/fe/instructor/components/StatusSummaryCard";
import {
  contestAiHintConfig,
  contestAuthoringCopy,
  type ContestFormDraft,
} from "@/fe/instructor/data/contestAuthoring";
import { VISIBILITY_OPTIONS } from "@/fe/shared/constants/options";
import styles from "@/fe/instructor/styles/InstructorCreateContestPage.module.css";

function formatStatusDate(dateValue: string) {
  if (!dateValue) {
    return "Not set";
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

interface InstructorCreateContestSidebarProps {
  formValues: ContestFormDraft;
  selectedProblemsCount: number;
  draftContestsCount: number;
  aiHintEnabled: boolean;
  isEditMode: boolean;
  isSaving: boolean;
  isPageLoading: boolean;
  publishLabel: string;
  onFieldChange: (field: keyof ContestFormDraft, value: string) => void;
  onPublish: () => void;
}

export default function InstructorCreateContestSidebar({
  formValues,
  selectedProblemsCount,
  draftContestsCount,
  aiHintEnabled,
  isEditMode,
  isSaving,
  isPageLoading,
  publishLabel,
  onFieldChange,
  onPublish,
}: InstructorCreateContestSidebarProps) {
  const contestStatusRows: StatusSummaryRow[] = aiHintEnabled
    ? [
        {
          id: "status",
          label: "Status",
          value: <span className={styles.statusNewBadge}>{isEditMode ? "Editing" : "New"}</span>,
        },
        {
          id: "problems",
          label: "Problems",
          value: <Typography className={styles.statusValue}>{selectedProblemsCount}</Typography>,
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
          value: <Typography className={styles.statusValue}>{draftContestsCount}</Typography>,
        },
      ]
    : [
        {
          id: "status",
          label: "Status",
          value: <span className={styles.statusNewBadge}>{isEditMode ? "Editing" : "New"}</span>,
        },
        {
          id: "problems",
          label: "Problems",
          value: <Typography className={styles.statusValue}>{selectedProblemsCount}</Typography>,
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
          value: <Typography className={styles.statusValue}>{draftContestsCount}</Typography>,
        },
      ];

  return (
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

          <div className={styles.fieldBlock}>
            <Typography className={styles.fieldLabel}>
              {contestAuthoringCopy.visibilityLabel}
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={formValues.visibility}
              onChange={(event) => onFieldChange("visibility", event.target.value)}
              className={styles.inputField}
              SelectProps={{ IconComponent: KeyboardArrowDownRoundedIcon }}
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {toVisibilityLabel(option.value)}
                </MenuItem>
              ))}
            </TextField>
          </div>
        </CardContent>
      </Card>

      <Button
        className={styles.publishButton}
        variant="contained"
        disabled={isSaving || isPageLoading}
        onClick={onPublish}
      >
        {isSaving ? "Saving..." : publishLabel}
      </Button>
    </>
  );
}
