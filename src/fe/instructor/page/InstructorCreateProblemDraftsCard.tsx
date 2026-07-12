import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import DraftRecordItem from "@/fe/instructor/components/DraftRecordItem";
import { problemAuthoringCopy } from "@/fe/instructor/data/problemAuthoring";
import styles from "@/fe/instructor/styles/InstructorCreateProblemPage.module.css";

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

export interface ProblemDraftListItem {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  updatedAt: string;
  examplesCount: number;
  starterCodesCount: number;
}

interface InstructorCreateProblemDraftsCardProps {
  draftProblems: ProblemDraftListItem[];
  isLoading: boolean;
  onEditDraft: (draftProblemId: string) => void;
  onDeleteDraft: (draftProblemId: string) => void;
}

export default function InstructorCreateProblemDraftsCard({
  draftProblems,
  isLoading,
  onEditDraft,
  onDeleteDraft,
}: InstructorCreateProblemDraftsCardProps) {
  return (
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
          {isLoading && draftProblems.length === 0 ? (
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
                  onEdit={() => onEditDraft(draft.id)}
                  onDelete={() => onDeleteDraft(draft.id)}
                  editAriaLabel={`Edit draft ${draft.title}`}
                  deleteAriaLabel={`Delete draft ${draft.title}`}
                />
              );
            })
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
