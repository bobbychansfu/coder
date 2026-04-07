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
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
          border: "1px solid rgba(217, 119, 6, 0.14)",
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.1)",
          background: "linear-gradient(180deg, #fffdf9 0%, #ffffff 22%)",
        },
      }}
    >
      <DialogTitle
        sx={{
          color: "#111827",
          fontWeight: 700,
          borderBottom: "1px solid rgba(217, 119, 6, 0.08)",
          pb: 1.5,
        }}
      >
        Export Analysis Data
      </DialogTitle>
      <DialogContent
        className={styles.exportDialogContent}
        sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2.5 }}
      >
        <Box
          className={styles.exportSectionList}
          sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.5 }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={allSectionsSelected}
                indeterminate={!allSectionsSelected && someSectionsSelected}
                onChange={onToggleAll}
                sx={{
                  color: "#d97706",
                  "&.Mui-checked, &.MuiCheckbox-indeterminate": {
                    color: "#ea580c",
                  },
                }}
              />
            }
            label="Select All"
            className={styles.exportCheckbox}
            sx={{
              margin: 0,
              "& .MuiFormControlLabel-label": {
                color: "#111827",
                fontWeight: 600,
              },
            }}
          />
          {(Object.keys(EXPORT_SECTION_LABELS) as ExportSectionKey[]).map((section) => (
            <FormControlLabel
              key={section}
              control={
                <Checkbox
                  checked={selectedSections[section]}
                  onChange={() => onToggleSection(section)}
                  sx={{
                    color: "#d97706",
                    "&.Mui-checked": {
                      color: "#ea580c",
                    },
                  }}
                />
              }
              label={EXPORT_SECTION_LABELS[section]}
              className={styles.exportCheckbox}
              sx={{
                margin: 0,
                "& .MuiFormControlLabel-label": {
                  color: "#374151",
                },
              }}
            />
          ))}
        </Box>

        <Box
          className={styles.exportFormatRow}
          sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}
        >
          <Typography
            className={styles.exportFormatLabel}
            sx={{ color: "#c2410c", fontWeight: 700 }}
          >
            File format
          </Typography>
          <FormControl size="small" className={styles.exportFormatControl} sx={{ minWidth: 180 }}>
            <Select
              value={exportFormat}
              onChange={(event) => onExportFormatChange(event.target.value as ExportFormat)}
              sx={{
                backgroundColor: "#fffaf3",
                color: "#111827",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(217, 119, 6, 0.2)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(234, 88, 12, 0.35)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#ea580c",
                },
              }}
            >
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="json">JSON</MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          padding: "0 24px 20px",
          borderTop: "1px solid rgba(217, 119, 6, 0.08)",
          pt: 2,
        }}
      >
        <Button onClick={onClose} sx={{ color: "#6b7280", textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onExport}
          disabled={!Object.values(selectedSections).some(Boolean)}
          sx={{
            textTransform: "none",
            borderRadius: "10px",
            boxShadow: "none",
            backgroundColor: "#f59e0b",
            color: "#ffffff",
            "&:hover": {
              backgroundColor: "#ea580c",
              boxShadow: "none",
            },
          }}
        >
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
}
