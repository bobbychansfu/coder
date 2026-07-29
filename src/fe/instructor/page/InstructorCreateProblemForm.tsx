import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import {
  problemAuthoringCopy,
  problemAuthoringTabs,
  type ProblemExampleDraft,
  type ProblemMetadataDraft,
  type ProblemStatementDraft,
  type StarterLanguage,
} from "@/fe/instructor/data/problemAuthoring";
import AuthoringStepTabs from "@/fe/shared/components/authoring/AuthoringStepTabs";
import {
  DIFFICULTY_OPTIONS,
  LANGUAGE_OPTIONS,
  PROBLEM_SOURCE_OPTIONS,
} from "@/fe/shared/constants/options";
import styles from "@/fe/instructor/styles/InstructorCreateProblemPage.module.css";

type ProblemTab = (typeof problemAuthoringTabs)[number]["value"];

interface InstructorCreateProblemFormProps {
  activeTab: ProblemTab;
  completedByTab: Record<ProblemTab, boolean>;
  metadataValues: ProblemMetadataDraft;
  statementValues: ProblemStatementDraft;
  examples: ProblemExampleDraft[];
  starterCodes: Record<StarterLanguage, string>;
  baseLanguage: StarterLanguage;
  activeLanguage: StarterLanguage;
  activeCode: string;
  tagSummary: string;
  filledLanguages: StarterLanguage[];
  starterProgress: string;
  generationError: string | null;
  generationFeedback: string | null;
  isSaving: boolean;
  isPageLoading: boolean;
  publishLabel: string;
  isGeneratingStarterCodes: boolean;
  onTabChange: (tab: ProblemTab) => void;
  onMetadataChange: (field: keyof ProblemMetadataDraft, value: string) => void;
  onStatementChange: (field: keyof ProblemStatementDraft, value: string) => void;
  onExampleChange: (
    id: string,
    field: keyof Omit<ProblemExampleDraft, "id">,
    value: string,
  ) => void;
  onStarterCodeChange: (language: StarterLanguage, value: string) => void;
  onBaseLanguageChange: (language: StarterLanguage) => void;
  onActiveLanguageChange: (language: StarterLanguage) => void;
  onOpenTagSelector: (anchorEl: HTMLElement) => void;
  onGenerateOtherLanguages: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onPublish: () => void;
}

export default function InstructorCreateProblemForm({
  activeTab,
  completedByTab,
  metadataValues,
  statementValues,
  examples,
  starterCodes,
  baseLanguage,
  activeLanguage,
  activeCode,
  tagSummary,
  filledLanguages,
  starterProgress,
  generationError,
  generationFeedback,
  isSaving,
  isPageLoading,
  publishLabel,
  isGeneratingStarterCodes,
  onTabChange,
  onMetadataChange,
  onStatementChange,
  onExampleChange,
  onStarterCodeChange,
  onBaseLanguageChange,
  onActiveLanguageChange,
  onOpenTagSelector,
  onGenerateOtherLanguages,
  onNext,
  onPrevious,
  onPublish,
}: InstructorCreateProblemFormProps) {
  return (
    <>
      <AuthoringStepTabs
        value={activeTab}
        tabs={problemAuthoringTabs.map((tab) => ({
          ...tab,
          completed: completedByTab[tab.value],
        }))}
        onChange={(value) => onTabChange(value as ProblemTab)}
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
              onChange={(event) => onMetadataChange("title", event.target.value)}
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
                onChange={(event) => onMetadataChange("difficulty", event.target.value)}
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
                onChange={(event) => onMetadataChange("points", event.target.value)}
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
                onMetadataChange("judgeProblemId", event.target.value.replace(/[^\d]/g, ""))
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
                onClick={(event) => onOpenTagSelector(event.currentTarget)}
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
              onChange={(event) => onMetadataChange("source", event.target.value)}
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
              onClick={onNext}
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
              onChange={(event) => onStatementChange("statement", event.target.value)}
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
              onChange={(event) => onStatementChange("inputFormat", event.target.value)}
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
              onChange={(event) => onStatementChange("outputFormat", event.target.value)}
              className={`${styles.inputField} ${styles.textAreaField} ${styles.codeText}`}
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
              onChange={(event) => onStatementChange("constraints", event.target.value)}
              className={`${styles.inputField} ${styles.textAreaField} ${styles.codeText}`}
            />
          </Box>

          <Box className={styles.stepActionsRow}>
            <Button className={styles.secondaryStepButton} onClick={onPrevious}>
              {`← ${problemAuthoringCopy.backMetadataLabel}`}
            </Button>
            <Button
              className={styles.primaryStepButton}
              variant="contained"
              endIcon={<ArrowForwardRoundedIcon className={styles.actionIcon} />}
              disabled={isSaving || isPageLoading}
              onClick={onNext}
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
                    onChange={(event) => onExampleChange(example.id, "input", event.target.value)}
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
                    onChange={(event) => onExampleChange(example.id, "output", event.target.value)}
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
                      onExampleChange(example.id, "explanation", event.target.value)
                    }
                    className={`${styles.inputField} ${styles.textAreaField}`}
                  />
                </Box>
              </Box>
            ))}
          </Box>

          <Box className={styles.stepActionsRow}>
            <Button className={styles.secondaryStepButton} onClick={onPrevious}>
              {`← ${problemAuthoringCopy.backStatementLabel}`}
            </Button>
            <Button
              className={styles.primaryStepButton}
              variant="contained"
              endIcon={<ArrowForwardRoundedIcon className={styles.actionIcon} />}
              disabled={isSaving || isPageLoading}
              onClick={onNext}
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
                  const language = event.target.value as StarterLanguage;
                  onBaseLanguageChange(language);
                  onActiveLanguageChange(language);
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
                onClick={onGenerateOtherLanguages}
                disabled={isGeneratingStarterCodes}
              >
                {isGeneratingStarterCodes
                  ? "Generating..."
                  : problemAuthoringCopy.generateOtherLanguagesLabel}
              </Button>
            </Box>
            <Typography className={styles.fieldHint}>
              {problemAuthoringCopy.baseLanguageHint}
            </Typography>
          </Box>

          {generationError ? (
            <Typography className={`${styles.generationFeedback} ${styles.generationFeedbackError}`}>
              {generationError}
            </Typography>
          ) : generationFeedback ? (
            <Typography className={`${styles.generationFeedback} ${styles.generationFeedbackSuccess}`}>
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
                    onClick={() => onActiveLanguageChange(language)}
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
              onChange={(event) => onStarterCodeChange(activeLanguage, event.target.value)}
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
            <Button className={styles.secondaryStepButton} onClick={onPrevious}>
              {`← ${problemAuthoringCopy.backExamplesLabel}`}
            </Button>
            <Button
              className={styles.primaryStepButton}
              variant="contained"
              disabled={isSaving || isPageLoading}
              onClick={onPublish}
            >
              {isSaving ? "Saving..." : publishLabel}
            </Button>
          </Box>
        </Box>
      ) : null}
    </>
  );
}
