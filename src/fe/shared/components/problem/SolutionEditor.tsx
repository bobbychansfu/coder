import { Box, Button, MenuItem, Select, TextField, Typography } from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { LANGUAGE_OPTIONS } from "@/fe/shared/constants/options";
import styles from "@/fe/contests/styles/ProblemSubmissionPage.module.css";

interface SolutionEditorProps {
  language: string;
  code: string;
  onLanguageChange: (language: string) => void;
  onCodeChange: (code: string) => void;
}

export default function SolutionEditor({
  language,
  code,
  onLanguageChange,
  onCodeChange,
}: SolutionEditorProps) {
  return (
    <Box className={`${styles.card} ${styles.solutionCard}`}>
      <Box className={styles.solutionHeader}>
        <Typography className={styles.solutionTitle}>Solution</Typography>
        <Select
          className={styles.solutionSelect}
          value={language}
          onChange={(event) => onLanguageChange(event.target.value as string)}
          size="small"
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </Box>
      <TextField
        className={styles.codeEditor}
        placeholder="Write your solution here..."
        value={code}
        onChange={(event) => onCodeChange(event.target.value)}
        multiline
        fullWidth
      />
      <Box className={styles.buttonRow}>
        <Button className={styles.runButton} startIcon={<PlayArrowRoundedIcon fontSize="small" />}>
          Run Code
        </Button>
        <Button
          className={styles.submitButton}
          variant="contained"
          disableElevation
          startIcon={<SendRoundedIcon fontSize="small" />}
          sx={{ backgroundColor: "#dc2626", "&:hover": { backgroundColor: "#b91c1c" } }}
        >
          Submit
        </Button>
      </Box>
    </Box>
  );
}
