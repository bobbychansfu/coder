"use client";

import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { Box, Button } from "@mui/material";
import type { InstructorAnalysisData } from "@/lib/types/instructorAnalysis";
import {
  exportInstructorAnalysisCsv,
  exportInstructorAnalysisJson,
} from "@/fe/instructor/services/instructorAnalysis.export";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

interface InstructorAnalysisExportActionsProps {
  data: InstructorAnalysisData;
  disabled?: boolean;
}

export default function InstructorAnalysisExportActions({
  data,
  disabled = false,
}: InstructorAnalysisExportActionsProps) {
  return (
    <Box className={styles.exportActions}>
      <Button
        className={styles.exportButton}
        variant="outlined"
        startIcon={<FileDownloadOutlinedIcon />}
        onClick={() => exportInstructorAnalysisJson(data)}
        disabled={disabled}
      >
        Export JSON
      </Button>
      <Button
        className={styles.exportButton}
        variant="outlined"
        startIcon={<FileDownloadOutlinedIcon />}
        onClick={() => exportInstructorAnalysisCsv(data)}
        disabled={disabled}
      >
        Export CSV
      </Button>
    </Box>
  );
}
