import type { ChangeEvent, DragEvent, RefObject } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { Box, Button, Chip, Dialog, DialogContent, IconButton, Popover, Typography } from "@mui/material";
import {
  problemAuthoringCopy,
  type ProblemExampleDraft,
  type ProblemMetadataDraft,
  type ProblemStatementDraft,
} from "@/fe/instructor/data/problemAuthoring";
import { PROBLEM_TAG_GROUPS } from "@/fe/shared/constants/options";
import styles from "@/fe/instructor/styles/InstructorCreateProblemPage.module.css";

const difficultyBadgeStyles = {
  easy: { backgroundColor: "#ecfdf3", color: "#027a48" },
  medium: { backgroundColor: "#dc2626", color: "#ffffff" },
  hard: { backgroundColor: "#b91c1c", color: "#ffffff" },
} as const;

interface InstructorCreateProblemDialogsProps {
  previewOpen: boolean;
  csvOpen: boolean;
  tagPopoverOpen: boolean;
  tagAnchorEl: HTMLElement | null;
  metadataValues: ProblemMetadataDraft;
  statementValues: ProblemStatementDraft;
  examples: ProblemExampleDraft[];
  previewTitle: string;
  previewDifficulty: string;
  previewPoints: string;
  selectedCsvName: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onPreviewClose: () => void;
  onCsvClose: () => void;
  onTagPopoverClose: () => void;
  onToggleTag: (tag: string) => void;
  onCsvDrop: (event: DragEvent<HTMLDivElement>) => void;
  onCsvSelection: (event: ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
}

export default function InstructorCreateProblemDialogs({
  previewOpen,
  csvOpen,
  tagPopoverOpen,
  tagAnchorEl,
  metadataValues,
  statementValues,
  examples,
  previewTitle,
  previewDifficulty,
  previewPoints,
  selectedCsvName,
  fileInputRef,
  onPreviewClose,
  onCsvClose,
  onTagPopoverClose,
  onToggleTag,
  onCsvDrop,
  onCsvSelection,
  onDownloadTemplate,
}: InstructorCreateProblemDialogsProps) {
  return (
    <>
      <Popover
        open={tagPopoverOpen}
        anchorEl={tagAnchorEl}
        onClose={onTagPopoverClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{ className: styles.tagPopoverPaper }}
      >
        <Box className={styles.tagPopover}>
          <Typography className={styles.tagPopoverHeading}>
            {`Select tags - ${metadataValues.tags.length} selected`}
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
                      onClick={() => onToggleTag(tag)}
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

      <Dialog open={previewOpen} onClose={onPreviewClose} maxWidth="md" fullWidth>
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
              onClick={onPreviewClose}
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

      <Dialog open={csvOpen} onClose={onCsvClose} maxWidth="md" fullWidth>
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
              onClick={onCsvClose}
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
            onDrop={onCsvDrop}
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
              onChange={onCsvSelection}
            />
          </Box>

          <Box className={styles.templateRow}>
            <Typography className={styles.templatePrompt}>
              {problemAuthoringCopy.importCsvTemplatePrompt}
            </Typography>
            <Button
              className={styles.templateButton}
              startIcon={<DownloadRoundedIcon className={styles.actionIcon} />}
              onClick={onDownloadTemplate}
            >
              {problemAuthoringCopy.importCsvTemplateLabel}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
