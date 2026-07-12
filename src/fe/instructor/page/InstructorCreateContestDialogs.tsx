import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import { Box, Button, Dialog, DialogContent, IconButton, Typography } from "@mui/material";
import {
  contestAuthoringCopy,
  type ContestDifficulty,
  type ContestFormDraft,
  type ContestProblemRecord,
} from "@/fe/instructor/data/contestAuthoring";
import styles from "@/fe/instructor/styles/InstructorCreateContestPage.module.css";

function toVisibilityLabel(value: string) {
  return value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function formatProblemTags(problem: ContestProblemRecord) {
  return problem.tags.join(", ");
}

function getProblemSourceLabel(problem: ContestProblemRecord) {
  return problem.source === "contest-only" ? "Contest-only" : "Public";
}

function getDifficultyBadgeClassName(difficulty: ContestDifficulty) {
  const toneClassMap: Record<ContestDifficulty, string> = {
    easy: styles.difficultyEasy,
    medium: styles.difficultyMedium,
    hard: styles.difficultyHard,
  };

  return `${styles.difficultyBadge} ${toneClassMap[difficulty]}`;
}

interface InstructorCreateContestDialogsProps {
  selectProblemsOpen: boolean;
  previewOpen: boolean;
  availableProblems: ContestProblemRecord[];
  pendingProblemIds: string[];
  previewProblems: ContestProblemRecord[];
  formValues: ContestFormDraft;
  aiHintEnabled: boolean;
  previewTitle: string;
  previewDescription: string;
  previewStart: string;
  previewEnd: string;
  onSelectProblemsClose: () => void;
  onPreviewClose: () => void;
  onTogglePendingProblem: (problemId: string) => void;
  onApplySelectedProblems: () => void;
}

export default function InstructorCreateContestDialogs({
  selectProblemsOpen,
  previewOpen,
  availableProblems,
  pendingProblemIds,
  previewProblems,
  formValues,
  aiHintEnabled,
  previewTitle,
  previewDescription,
  previewStart,
  previewEnd,
  onSelectProblemsClose,
  onPreviewClose,
  onTogglePendingProblem,
  onApplySelectedProblems,
}: InstructorCreateContestDialogsProps) {
  return (
    <>
      <Dialog
        open={selectProblemsOpen}
        onClose={onSelectProblemsClose}
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
              onClick={onSelectProblemsClose}
              aria-label="Close select problems dialog"
            >
              <CloseRoundedIcon className={styles.dialogCloseIcon} />
            </IconButton>
          </Box>

          <Box className={styles.modalProblemList}>
            {availableProblems.map((problem) => {
              const isSelected = pendingProblemIds.includes(problem.id);
              const showContestOnlyBadge = problem.source === "contest-only";

              return (
                <button
                  key={problem.id}
                  type="button"
                  className={`${styles.modalProblemButton} ${isSelected ? styles.modalProblemButtonSelected : ""}`}
                  onClick={() => onTogglePendingProblem(problem.id)}
                >
                  <Box className={styles.modalProblemTitleRow}>
                    <Typography className={styles.modalProblemTitle}>{problem.title}</Typography>
                    {showContestOnlyBadge ? (
                      <span className={styles.contestOnlyBadge}>
                        <FlagOutlinedIcon className={styles.contestOnlyBadgeIcon} />
                        {getProblemSourceLabel(problem)}
                      </span>
                    ) : null}
                  </Box>
                  <Box className={styles.modalProblemMeta}>
                    <span className={getDifficultyBadgeClassName(problem.difficulty)}>
                      {problem.difficulty}
                    </span>
                    {!showContestOnlyBadge ? (
                      <Typography className={styles.problemMetaText}>
                        {getProblemSourceLabel(problem)}
                      </Typography>
                    ) : null}
                    <Typography className={styles.problemMetaText}>{`${problem.points} points`}</Typography>
                    <Typography className={styles.problemSeparator}>-</Typography>
                    <Typography className={styles.problemMetaText}>
                      {formatProblemTags(problem)}
                    </Typography>
                  </Box>
                </button>
              );
            })}
          </Box>

          <Box className={styles.dialogFooter}>
            <Button className={styles.dialogPrimaryButton} variant="contained" onClick={onApplySelectedProblems}>
              {`Done (${pendingProblemIds.length} ${contestAuthoringCopy.selectedCountSuffix})`}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={previewOpen}
        onClose={onPreviewClose}
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
              onClick={onPreviewClose}
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
              {[
                ["Start", previewStart],
                ["End", previewEnd],
              ].map(([label, value]) => (
                <Box key={label} className={styles.previewScheduleRow}>
                  <Box className={styles.previewScheduleLabel}>
                    <EventOutlinedIcon className={styles.previewScheduleIcon} />
                    <Typography className={styles.previewScheduleKey}>{label}</Typography>
                  </Box>
                  <Typography className={styles.previewScheduleValue}>{value}</Typography>
                </Box>
              ))}
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
                    {`Group A: hints after ${formValues.groupAHintAfterMinutes} min - Group B: hints after ${formValues.groupBHintAfterMinutes} min`}
                  </Typography>
                </Box>
              </Box>
            ) : null}
          </Box>

          <Box className={styles.previewFooter}>
            <Typography className={styles.previewFooterText}>
              {contestAuthoringCopy.previewReadonlyCopy}
            </Typography>
            <Button className={styles.previewCloseButton} variant="outlined" onClick={onPreviewClose}>
              {contestAuthoringCopy.previewCloseLabel}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
