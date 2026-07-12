import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import RadioButtonCheckedRoundedIcon from "@mui/icons-material/RadioButtonCheckedRounded";
import ShuffleRoundedIcon from "@mui/icons-material/ShuffleRounded";
import { Box, Button, Card, CardContent, Switch, TextField, Typography } from "@mui/material";
import DraftRecordItem from "@/fe/instructor/components/DraftRecordItem";
import {
  contestAiHintConfig,
  contestAuthoringCopy,
  type ContestDifficulty,
  type ContestFormDraft,
  type ContestProblemRecord,
} from "@/fe/instructor/data/contestAuthoring";
import styles from "@/fe/instructor/styles/InstructorCreateContestPage.module.css";

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

function getDifficultyBadgeClassName(difficulty: ContestDifficulty) {
  const toneClassMap: Record<ContestDifficulty, string> = {
    easy: styles.difficultyEasy,
    medium: styles.difficultyMedium,
    hard: styles.difficultyHard,
  };

  return `${styles.difficultyBadge} ${toneClassMap[difficulty]}`;
}

export interface ContestDraftListItem {
  id: string;
  title: string;
  updatedAt: string;
  status: "Draft";
  problemsCount: number;
  durationMinutes: number | null;
}

interface InstructorCreateContestMainProps {
  formValues: ContestFormDraft;
  selectedProblems: ContestProblemRecord[];
  draftContests: ContestDraftListItem[];
  aiHintEnabled: boolean;
  isLoading: boolean;
  onFieldChange: (field: keyof ContestFormDraft, value: string) => void;
  onNumberFieldChange: (field: keyof ContestFormDraft, value: string) => void;
  onOpenSelectProblems: () => void;
  onRemoveProblem: (problemId: string) => void;
  onAiHintEnabledChange: (enabled: boolean) => void;
  onEditDraft: (draftContestId: string) => void;
  onDeleteDraft: (draftContestId: string) => void;
}

export default function InstructorCreateContestMain({
  formValues,
  selectedProblems,
  draftContests,
  aiHintEnabled,
  isLoading,
  onFieldChange,
  onNumberFieldChange,
  onOpenSelectProblems,
  onRemoveProblem,
  onAiHintEnabledChange,
  onEditDraft,
  onDeleteDraft,
}: InstructorCreateContestMainProps) {
  return (
    <>
      <Card className={styles.card} elevation={0}>
        <CardContent className={styles.cardContent}>
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
              onChange={(event) => onFieldChange("contestName", event.target.value)}
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
              onChange={(event) => onFieldChange("description", event.target.value)}
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

          {(["start", "end"] as const).map((kind) => (
            <Box key={kind} className={styles.fieldBlock}>
              <Box className={styles.fieldLabelRow}>
                <EventOutlinedIcon className={styles.fieldLabelIcon} />
                <Typography className={styles.fieldLabel}>
                  {kind === "start" ? contestAuthoringCopy.startLabel : contestAuthoringCopy.endLabel}
                </Typography>
              </Box>
              <Box className={styles.twoColumnGrid}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={kind === "start" ? formValues.startDate : formValues.endDate}
                  onChange={(event) => onFieldChange(`${kind}Date`, event.target.value)}
                  className={styles.inputField}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  size="small"
                  type="time"
                  value={kind === "start" ? formValues.startTime : formValues.endTime}
                  onChange={(event) => onFieldChange(`${kind}Time`, event.target.value)}
                  className={styles.inputField}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Box>
          ))}
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
              onClick={onOpenSelectProblems}
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
                  <button
                    type="button"
                    className={styles.removeProblemButton}
                    onClick={() => onRemoveProblem(problem.id)}
                    aria-label={`Remove ${problem.title}`}
                  >
                    <CloseRoundedIcon className={styles.removeProblemIcon} />
                  </button>
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
                onChange={(_, checked) => onAiHintEnabledChange(checked)}
                className={styles.aiSwitch}
              />
            </Box>
          </Box>

          {aiHintEnabled ? (
            <>
              <Typography className={styles.subSectionLabel}>
                {contestAuthoringCopy.groupConfigurationTitle}
              </Typography>

              <Box className={styles.groupGrid}>
                {(["A", "B"] as const).map((group) => {
                  const field =
                    group === "A" ? "groupAHintAfterMinutes" : "groupBHintAfterMinutes";

                  return (
                    <Box
                      key={group}
                      className={`${styles.groupCard} ${group === "A" ? styles.groupCardA : styles.groupCardB}`}
                    >
                      <Box className={styles.groupHeader}>
                        <span className={`${styles.groupDot} ${group === "A" ? styles.groupDotA : styles.groupDotB}`}>
                          {group}
                        </span>
                        <Typography className={styles.groupTitle}>{`Group ${group}`}</Typography>
                      </Box>
                      <Typography className={styles.groupHintLabel}>
                        {group === "A"
                          ? contestAuthoringCopy.groupAHintLabel
                          : contestAuthoringCopy.groupBHintLabel}
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={formValues[field]}
                        onChange={(event) => onNumberFieldChange(field, event.target.value)}
                        className={styles.inputField}
                        inputProps={{ min: 0, step: 1 }}
                      />
                    </Box>
                  );
                })}
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
            {isLoading && draftContests.length === 0 ? (
              <Typography className={styles.sectionDescription}>Loading contest drafts...</Typography>
            ) : draftContests.length === 0 ? (
              <Typography className={styles.sectionDescription}>No saved contest drafts yet.</Typography>
            ) : (
              draftContests.map((draft) => (
                <DraftRecordItem
                  key={draft.id}
                  title={draft.title}
                  topMeta={
                    <Box className={styles.draftMetaTop}>
                      <span className={styles.draftStatusChip}>{draft.status}</span>
                      <Typography className={styles.draftDate}>
                        {formatDraftUpdatedAt(draft.updatedAt)}
                      </Typography>
                    </Box>
                  }
                  bottomMeta={
                    <Typography className={styles.draftMetaBottom}>
                      {`${draft.problemsCount} problem(s)`}
                      {"   "}
                      {draft.durationMinutes ? `${draft.durationMinutes} min` : "No duration"}
                    </Typography>
                  }
                  itemClassName={styles.draftItem}
                  mainClassName={styles.draftMain}
                  titleClassName={styles.draftTitle}
                  actionsClassName={styles.draftActions}
                  iconButtonClassName={styles.draftIconButton}
                  editIconClassName={styles.draftActionIcon}
                  deleteIconClassName={styles.draftActionIconDanger}
                  onEdit={() => onEditDraft(draft.id)}
                  onDelete={() => onDeleteDraft(draft.id)}
                  editAriaLabel={`Edit draft ${draft.title}`}
                  deleteAriaLabel={`Delete draft ${draft.title}`}
                />
              ))
            )}
          </Box>
        </CardContent>
      </Card>
    </>
  );
}
