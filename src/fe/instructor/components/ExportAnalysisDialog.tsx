"use client";

import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, MenuItem, Select, Typography } from "@mui/material";
import type { ExportFormat, ExportSectionKey } from "@/fe/instructor/page/researchAnalytics.helpers";
import { EXPORT_SECTION_LABELS } from "@/fe/instructor/page/researchAnalytics.helpers";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

interface ExportAnalysisDialogProps {
  open: boolean;
  exportFormat: ExportFormat;
  selectedSections: Record<ExportSectionKey, boolean>;
  allSectionsSelected: boolean;
  someSectionsSelected: boolean;
  onClose: () => void;
  onExport: () => void;
  onExportFormatChange: (format: ExportFormat) => void;
  onToggleAll: () => void;
  onToggleSection: (section: ExportSectionKey) => void;
}

export default function ExportAnalysisDialog({
  open,
  exportFormat,
  selectedSections,
  allSectionsSelected,
  someSectionsSelected,
  onClose,
  onExport,
  onExportFormatChange,
  onToggleAll,
  onToggleSection,
}: ExportAnalysisDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Export Analysis Data</DialogTitle>
      <DialogContent className={styles.exportDialogContent}>
        <Box className={styles.exportSectionList}>
          <FormControlLabel
            control={
              <Checkbox
                checked={allSectionsSelected}
                indeterminate={!allSectionsSelected && someSectionsSelected}
                onChange={onToggleAll}
              />
            }
            label="Select All"
            className={styles.exportCheckbox}
          />
          {(Object.keys(EXPORT_SECTION_LABELS) as ExportSectionKey[]).map((section) => (
            <FormControlLabel
              key={section}
              control={
                <Checkbox
                  checked={selectedSections[section]}
                  onChange={() => onToggleSection(section)}
                />
              }
              label={EXPORT_SECTION_LABELS[section]}
              className={styles.exportCheckbox}
            />
          ))}
        </Box>

        <Box className={styles.exportFormatRow}>
          <Typography className={styles.exportFormatLabel}>File format</Typography>
          <FormControl size="small" className={styles.exportFormatControl}>
            <Select
              value={exportFormat}
              onChange={(event) => onExportFormatChange(event.target.value as ExportFormat)}
            >
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="json">JSON</MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ padding: "0 24px 20px" }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onExport} disabled={!Object.values(selectedSections).some(Boolean)}>
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
}
