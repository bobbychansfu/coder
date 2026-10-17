import { useState } from "react";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { Button, Card, CardContent, MenuItem, Switch, TextField, Typography } from "@mui/material";
import StatusSummaryCard, {
  type StatusSummaryRow,
} from "@/fe/instructor/components/StatusSummaryCard";
import {
  CONTEST_SCORING_RULE_OPTIONS,
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
  showDifficulty: boolean;
  isEditMode: boolean;
  isSaving: boolean;
  isPageLoading: boolean;
  contestId: string | null;
  joinCode: string | null;
  isJoinLinkSaving: boolean;
  onJoinLinkChange: (action: "enable" | "reset" | "disable") => void;
  publishLabel: string;
  onFieldChange: (field: keyof ContestFormDraft, value: string) => void;
  onShowDifficultyChange: (enabled: boolean) => void;
  onNumberFieldChange: (field: keyof ContestFormDraft, value: string) => void;
  onPublish: () => void;
}

export default function InstructorCreateContestSidebar({
  formValues,
  selectedProblemsCount,
  draftContestsCount,
  aiHintEnabled,
  showDifficulty,
  isEditMode,
  isSaving,
  isPageLoading,
  contestId,
  joinCode,
  isJoinLinkSaving,
  onJoinLinkChange,
  publishLabel,
  onFieldChange,
  onShowDifficultyChange,
  onNumberFieldChange,
  onPublish,
}: InstructorCreateContestSidebarProps) {
  const [copiedJoinLink, setCopiedJoinLink] = useState<string | null>(null);
  const joinLink =
    contestId && joinCode && typeof window !== "undefined"
      ? `${window.location.origin}/contests/${contestId}/join/${joinCode}`
      : null;

  const copyJoinLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    setCopiedJoinLink(link);
  };

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

          {formValues.visibility === "private" ? (
            <>
              <div className={styles.fieldBlock}>
                <Typography className={styles.fieldLabel}>
                  {contestAuthoringCopy.allowedUsersLabel}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  placeholder={contestAuthoringCopy.allowedUsersPlaceholder}
                  value={formValues.allowedUsers}
                  onChange={(event) => onFieldChange("allowedUsers", event.target.value)}
                  className={`${styles.inputField} ${styles.textAreaField}`}
                  slotProps={{
                    htmlInput: { "aria-label": contestAuthoringCopy.allowedUsersLabel },
                  }}
                />
              </div>

              {contestId ? (
                <div className={styles.fieldBlock}>
                  <div className={styles.aiHeaderRow}>
                    <Typography className={styles.fieldLabel}>
                      {contestAuthoringCopy.joinLinkLabel}
                    </Typography>
                    <Switch
                      checked={Boolean(joinCode)}
                      disabled={isJoinLinkSaving}
                      onChange={(_, checked) => onJoinLinkChange(checked ? "enable" : "disable")}
                      className={styles.aiSwitch}
                      slotProps={{
                        input: { role: "switch", "aria-label": contestAuthoringCopy.joinLinkLabel },
                      }}
                    />
                  </div>
                  {joinLink ? (
                    <>
                      <TextField
                        fullWidth
                        size="small"
                        value={joinLink}
                        className={styles.inputField}
                        slotProps={{
                          htmlInput: {
                            readOnly: true,
                            "aria-label": contestAuthoringCopy.joinLinkLabel,
                          },
                        }}
                      />
                      <div className={styles.joinLinkActions}>
                        <Button size="small" onClick={() => void copyJoinLink(joinLink)}>
                          {copiedJoinLink === joinLink ? "Link copied" : "Copy link"}
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          disabled={isJoinLinkSaving}
                          onClick={() => onJoinLinkChange("reset")}
                        >
                          Reset
                        </Button>
                      </div>
                    </>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}

          <div className={styles.aiHeaderRow}>
            <Typography className={styles.fieldLabel}>
              {contestAuthoringCopy.showDifficultyLabel}
            </Typography>
            <Switch
              checked={showDifficulty}
              onChange={(_, checked) => onShowDifficultyChange(checked)}
              className={styles.aiSwitch}
              // Setting slotProps.input drops MUI's default role, so it is restated here.
              slotProps={{
                input: { role: "switch", "aria-label": contestAuthoringCopy.showDifficultyLabel },
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className={styles.card} elevation={0}>
        <CardContent className={styles.sideCardContent}>
          <Typography className={styles.sideTitle}>
            {contestAuthoringCopy.scoringRuleTitle}
          </Typography>

          <div className={styles.fieldBlock}>
            <Typography className={styles.fieldLabel}>
              {contestAuthoringCopy.scoringRuleLabel}
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={formValues.scoringRule}
              onChange={(event) => onFieldChange("scoringRule", event.target.value)}
              className={styles.inputField}
              SelectProps={{ IconComponent: KeyboardArrowDownRoundedIcon }}
            >
              {CONTEST_SCORING_RULE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </div>

          <div className={styles.fieldBlock}>
            <Typography className={styles.fieldLabel}>
              {contestAuthoringCopy.teamSizeLabel}
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={String(formValues.maxTeamSize)}
              onChange={(event) => onNumberFieldChange("maxTeamSize", event.target.value)}
              className={styles.inputField}
              SelectProps={{ IconComponent: KeyboardArrowDownRoundedIcon }}
            >
              {[1, 2, 3, 4, 5].map((size) => (
                <MenuItem key={size} value={String(size)}>
                  {size}
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
